#!/usr/bin/env node
/**
 * RAG Ingestion Script — charm.li service manual crawler
 *
 * Usage:
 *   # Crawl ALL vehicles on charm.li (make → year → model → download ZIP → ingest)
 *   node ingest.js --charm https://charm.li/
 *
 *   # Crawl a single make
 *   node ingest.js --charm https://charm.li/Toyota/
 *
 *   # Crawl a single make+year
 *   node ingest.js --charm https://charm.li/Toyota/2019/
 *
 *   # Ingest a single URL page
 *   node ingest.js --url https://charm.li/Toyota/2019/Camry/.../Repair+and+Diagnosis/Brakes
 *
 *   # Ingest a local text file
 *   node ingest.js --file ./manuals/brakes.txt --category brakes
 */

const mongoose = require('mongoose');
const { OllamaEmbeddings } = require('@langchain/ollama');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const cheerio = require('cheerio');
const ManualChunk = require('../server/models/ManualChunk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ── Config ──────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/autoadvisor';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://golem:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'qwen3-embedding';
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;
const BATCH_SIZE = 10;   // embeddings per batch (lower = less likely to stall)
const FETCH_DELAY = 500; // ms between HTTP requests (be polite to charm.li)

const embeddings = new OllamaEmbeddings({
  model: EMBEDDING_MODEL,
  baseUrl: OLLAMA_URL,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: CHUNK_SIZE,
  chunkOverlap: CHUNK_OVERLAP,
  separators: ['\n## ', '\n### ', '\n\n', '\n', '. ', ' '],
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Totals tracker ──────────────────────────────────────────────────
let totalChunks = 0;
let totalVehicles = 0;

// ── HTML helpers ────────────────────────────────────────────────────
async function fetchHtml(url) {
  await sleep(FETCH_DELAY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
      try {
        const resolved = new URL(href, baseUrl).toString();
        links.push({ url: resolved, text });
      } catch { /* skip malformed URLs */ }
    }
  });
  return links;
}

function extractPageText(html) {
  const $ = cheerio.load(html);
  $('nav, header, footer, script, style, .sidebar, .menu').remove();
  const mainEl = $('article, main, .content, .manual-content, #content');
  const text = (mainEl.length ? mainEl : $('body')).text();
  return text.replace(/\s+/g, ' ').trim();
}

// ── Chunking & Embedding ────────────────────────────────────────────
async function ingestText(text, metadata = {}) {
  const chunks = await splitter.splitText(text);
  if (chunks.length === 0) return 0;

  let stored = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    // Embed one at a time to avoid overwhelming Ollama
    const vectors = [];
    for (const chunk of batch) {
      vectors.push(await embeddings.embedQuery(chunk));
    }

    const docs = batch.map((content, j) => ({
      content,
      embedding: vectors[j],
      source: metadata.source || '',
      title: metadata.title || '',
      category: metadata.category || 'general',
      vehicle: metadata.vehicle || {},
    }));

    await ManualChunk.insertMany(docs);
    stored += docs.length;
  }

  totalChunks += stored;
  return stored;
}

// ── ZIP Download & Extraction ───────────────────────────────────────
async function downloadAndExtractZip(zipUrl) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charm-'));
  const zipPath = path.join(tmpDir, 'manual.zip');

  // Download
  const res = await fetch(zipUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} downloading ${zipUrl}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(zipPath, buffer);

  // Extract
  const extractDir = path.join(tmpDir, 'extracted');
  fs.mkdirSync(extractDir);
  execSync(`unzip -o -q "${zipPath}" -d "${extractDir}"`);

  return { tmpDir, extractDir };
}

function collectTextFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTextFiles(full));
    } else if (/\.(txt|html?|md|xml)$/i.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function cleanupTmp(tmpDir) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
}

// ── Guess category from filename/path ───────────────────────────────
function guessCategory(filePath) {
  const lower = filePath.toLowerCase();
  const categories = [
    'brakes', 'engine', 'transmission', 'electrical', 'suspension',
    'steering', 'cooling', 'exhaust', 'fuel', 'heating', 'air-conditioning',
    'body', 'interior', 'tires', 'wheels', 'drivetrain', 'emissions',
  ];
  for (const cat of categories) {
    if (lower.includes(cat)) return cat;
  }
  return 'general';
}

// ── charm.li structured crawler ─────────────────────────────────────
// Site hierarchy: Home → Make → Year → Model/Engine → content/ZIPs
// ─────────────────────────────────────────────────────────────────────

function parseVehicleFromUrl(url) {
  // e.g. https://charm.li/Toyota/2019/Camry+L4-2.5L/
  const parts = new URL(url).pathname.split('/').filter(Boolean);
  return {
    make:  decodeURIComponent(parts[0] || '').replace(/\+/g, ' '),
    year:  decodeURIComponent(parts[1] || '').replace(/\+/g, ' '),
    model: decodeURIComponent(parts[2] || '').replace(/\+/g, ' '),
  };
}

async function crawlCharm(startUrl) {
  const base = new URL(startUrl);
  const pathDepth = base.pathname.split('/').filter(Boolean).length;

  // Determine what level we're starting at
  // 0 = home (list of makes), 1 = make (list of years), 2 = year (list of models), 3 = vehicle page
  if (pathDepth === 0) {
    console.log('=== Crawling all makes from charm.li ===');
    const html = await fetchHtml(startUrl);
    const links = extractLinks(html, startUrl);
    const makeLinks = links.filter(l => {
      try { return new URL(l.url).origin === base.origin && new URL(l.url).pathname.split('/').filter(Boolean).length === 1; }
      catch { return false; }
    });
    console.log(`Found ${makeLinks.length} makes`);
    for (const link of makeLinks) {
      await crawlCharm(link.url);
    }

  } else if (pathDepth === 1) {
    const make = decodeURIComponent(base.pathname.split('/').filter(Boolean)[0]).replace(/\+/g, ' ');
    console.log(`\n=== Make: ${make} ===`);
    const html = await fetchHtml(startUrl);
    const links = extractLinks(html, startUrl);
    const yearLinks = links.filter(l => {
      try { return new URL(l.url).origin === base.origin && new URL(l.url).pathname.split('/').filter(Boolean).length === 2; }
      catch { return false; }
    });
    console.log(`  Found ${yearLinks.length} years`);
    for (const link of yearLinks) {
      await crawlCharm(link.url);
    }

  } else if (pathDepth === 2) {
    const pathParts = base.pathname.split('/').filter(Boolean);
    const make = decodeURIComponent(pathParts[0]).replace(/\+/g, ' ');
    const year = decodeURIComponent(pathParts[1]).replace(/\+/g, ' ');
    console.log(`  ${make} ${year} — fetching models...`);
    const html = await fetchHtml(startUrl);
    const links = extractLinks(html, startUrl);
    const modelLinks = links.filter(l => {
      try { return new URL(l.url).origin === base.origin && new URL(l.url).pathname.split('/').filter(Boolean).length === 3; }
      catch { return false; }
    });
    console.log(`    Found ${modelLinks.length} models`);
    for (const link of modelLinks) {
      await crawlCharm(link.url);
    }

  } else {
    // pathDepth >= 3 → vehicle page, look for ZIP or Repair+Diagnosis links
    await ingestVehiclePage(startUrl);
  }
}

async function ingestVehiclePage(vehicleUrl) {
  const vehicle = parseVehicleFromUrl(vehicleUrl);
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  console.log(`\n  📦 ${label}`);

  const html = await fetchHtml(vehicleUrl);
  const links = extractLinks(html, vehicleUrl);

  // Prefer the Mac-friendly ZIP (better file names)
  let zipLink = links.find(l => l.text.includes('better file names'));
  if (!zipLink) zipLink = links.find(l => l.url.endsWith('.zip'));

  if (zipLink) {
    await ingestFromZip(zipLink.url, vehicle, label);
  } else {
    // Fallback: crawl Repair and Diagnosis + Parts and Labor pages
    const contentLinks = links.filter(l =>
      l.text.includes('Repair and Diagnosis') || l.text.includes('Parts and Labor')
    );
    console.log(`    No ZIP found, crawling ${contentLinks.length} content pages...`);
    for (const link of contentLinks) {
      await ingestContentPage(link.url, vehicle);
    }
  }

  totalVehicles++;
}

async function ingestFromZip(zipUrl, vehicle, label) {
  console.log(`    Downloading ZIP...`);
  let tmpDir;
  try {
    const { tmpDir: tmp, extractDir } = await downloadAndExtractZip(zipUrl);
    tmpDir = tmp;

    const textFiles = collectTextFiles(extractDir);
    console.log(`    Extracted ${textFiles.length} files`);

    let vehicleChunks = 0;
    for (const filePath of textFiles) {
      let text;
      // Handle HTML files
      if (/\.html?$/i.test(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        text = extractPageText(raw);
      } else {
        text = fs.readFileSync(filePath, 'utf-8');
      }

      if (!text || text.length < 50) continue;

      const category = guessCategory(filePath);
      const title = path.basename(filePath, path.extname(filePath)).replace(/[_+]/g, ' ');

      const count = await ingestText(text, {
        source: zipUrl,
        title: `${label} — ${title}`,
        category,
        vehicle,
      });
      vehicleChunks += count;
    }
    console.log(`    ✓ ${label}: ${vehicleChunks} chunks stored`);

  } catch (err) {
    console.error(`    ✗ Error processing ZIP for ${label}: ${err.message}`);
  } finally {
    if (tmpDir) cleanupTmp(tmpDir);
  }
}

async function ingestContentPage(url, vehicle) {
  try {
    const html = await fetchHtml(url);
    const text = extractPageText(html);
    if (!text || text.length < 50) return;

    const category = guessCategory(url);
    const count = await ingestText(text, {
      source: url,
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      category,
      vehicle,
    });
    console.log(`    Page: ${count} chunks from ${url}`);
  } catch (err) {
    console.error(`    Error ingesting page ${url}: ${err.message}`);
  }
}

// ── Single URL Ingestion ────────────────────────────────────────────
async function ingestUrl(url, metadata = {}) {
  console.log(`Fetching: ${url}`);
  const html = await fetchHtml(url);
  const text = extractPageText(html);
  if (!text || text.length < 50) {
    console.log('  Skipping — too little content');
    return 0;
  }
  console.log(`  Extracted ${text.length} chars`);
  return ingestText(text, { source: url, ...metadata });
}

// ── CLI ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    flags[args[i].replace(/^--/, '')] = args[i + 1];
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  try {
    if (flags.charm) {
      await crawlCharm(flags.charm);
      console.log(`\n=== DONE: ${totalVehicles} vehicles, ${totalChunks} total chunks ===`);

    } else if (flags.url) {
      await ingestUrl(flags.url, {
        category: flags.category || 'general',
        title: flags.title || '',
        vehicle: {
          make: flags.make || '',
          model: flags.model || '',
          year: flags.year || '',
        },
      });

    } else if (flags.file) {
      const text = fs.readFileSync(flags.file, 'utf-8');
      await ingestText(text, {
        source: flags.file,
        category: flags.category || 'general',
        title: flags.title || '',
        vehicle: {
          make: flags.make || '',
          model: flags.model || '',
          year: flags.year || '',
        },
      });

    } else {
      console.log(`Usage:
  node ingest.js --charm https://charm.li/              (crawl entire site)
  node ingest.js --charm https://charm.li/Toyota/       (single make)
  node ingest.js --charm https://charm.li/Toyota/2019/  (single make+year)
  node ingest.js --url <URL> [--category brakes]
  node ingest.js --file <path> [--category brakes]`);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Done.');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
