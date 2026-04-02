/**
 * Background Vehicle Ingestion — on-demand lazy RAG loader
 *
 * When a diagnosis is requested for a vehicle we haven't ingested yet,
 * this module fetches the charm.li data and embeds it in the background
 * so it's available for the next query.
 */

const { OllamaEmbeddings } = require('@langchain/ollama');
const { ChatOllama } = require('@langchain/ollama');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const cheerio = require('cheerio');
const ManualChunk = require('../models/ManualChunk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// ── Config ──────────────────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://golem:11434';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'qwen3-embedding';
const CHARM_BASE = 'https://charm.li';
const BATCH_SIZE = 10;
const FETCH_DELAY = 300;

const embeddings = new OllamaEmbeddings({
  model: EMBEDDING_MODEL,
  baseUrl: OLLAMA_URL,
});

const llm = new ChatOllama({
  baseUrl: OLLAMA_URL,
  model: process.env.OLLAMA_MODEL || 'gpt-oss:20b',
  temperature: 0,
  timeout: 15000,
});

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ['\n## ', '\n### ', '\n\n', '\n', '. ', ' '],
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Track in-flight ingestions to avoid duplicate concurrent requests
const activeIngestions = new Set();

// ── Helpers ─────────────────────────────────────────────────────────

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
        links.push({ url: new URL(href, baseUrl).toString(), text });
      } catch { /* skip */ }
    }
  });
  return links;
}

function extractPageText(html) {
  const $ = cheerio.load(html);
  $('nav, header, footer, script, style, .sidebar, .menu').remove();
  const mainEl = $('article, main, .content, .manual-content, #content');
  return (mainEl.length ? mainEl : $('body')).text().replace(/\s+/g, ' ').trim();
}

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

function collectTextFiles(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectTextFiles(full));
    else if (/\.(txt|html?|md|xml)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

// ── Core: embed text chunks ─────────────────────────────────────────

async function ingestText(text, metadata) {
  const chunks = await splitter.splitText(text);
  if (chunks.length === 0) return 0;

  let stored = 0;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
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
  return stored;
}

// ── Check if a vehicle has been ingested ────────────────────────────

function vehicleKey(make, model) {
  return `${make}::${model}`.toLowerCase();
}

async function isVehicleIngested(vehicleContext) {
  const { make, model } = vehicleContext;
  if (!make || !model) return false;

  const count = await ManualChunk.countDocuments({
    'vehicle.make': new RegExp(`^${make}$`, 'i'),
    'vehicle.model': new RegExp(model.split(/\s/)[0], 'i'), // match first word of model
  });
  return count > 0;
}

// ── Find the vehicle page on charm.li ───────────────────────────────

async function findVehiclePage(vehicleContext) {
  const { make, year, model } = vehicleContext;
  if (!make || !year) return null;

  try {
    // Step 1: Find the make on the homepage (case-insensitive match)
    const homeHtml = await fetchHtml(`${CHARM_BASE}/`);
    const makeLinks = extractLinks(homeHtml, `${CHARM_BASE}/`);
    const makeLink = makeLinks.find(l =>
      l.text.toLowerCase().trim() === make.toLowerCase().trim()
    );
    if (!makeLink) {
      console.log(`[BGIngest] Make "${make}" not found on charm.li`);
      return null;
    }

    // Step 2: Find the year under the make
    const makeHtml = await fetchHtml(makeLink.url);
    const yearLinks = extractLinks(makeHtml, makeLink.url);
    const yearLink = yearLinks.find(l => l.text.includes(String(year)));
    if (!yearLink) {
      console.log(`[BGIngest] No year ${year} found for ${make}`);
      return null;
    }

    // Step 2: Find matching model under year
    const yearHtml = await fetchHtml(yearLink.url);
    const modelLinks = extractLinks(yearHtml, yearLink.url);

    // Try to match model name (e.g. "Camry" matches "Camry L4-2.5L")
    const modelWord = model.split(/\s/)[0]; // first word
    const modelLink = modelLinks.find(l =>
      l.text.toLowerCase().includes(modelWord.toLowerCase())
    );

    if (modelLink) return modelLink.url;

    // No direct match — ask the LLM to pick the best option
    const base = new URL(CHARM_BASE);
    const depth3 = modelLinks.filter(l => {
      try { return new URL(l.url).origin === base.origin && new URL(l.url).pathname.split('/').filter(Boolean).length === 3; }
      catch { return false; }
    });

    if (depth3.length === 0) {
      console.log(`[BGIngest] No models found for ${year} ${make}`);
      return null;
    }

    // Build a numbered list for the LLM
    const optionsList = depth3.map((l, i) => `${i + 1}. ${l.text}`).join('\n');
    console.log(`[BGIngest] No direct match for "${model}". Asking LLM to pick from ${depth3.length} options...`);

    try {
      const response = await llm.invoke([
        { role: 'system', content: 'You are a vehicle identification expert. Given a target vehicle and a list of available options from a repair manual database, pick the BEST matching option. Respond with ONLY the number (e.g. "3"). If none are a reasonable match, respond with "0".' },
        { role: 'user', content: `Target vehicle: ${year} ${make} ${model}\n\nAvailable options:\n${optionsList}` },
      ]);

      const pick = parseInt(response.content.trim(), 10);
      if (pick > 0 && pick <= depth3.length) {
        console.log(`[BGIngest] LLM selected: ${depth3[pick - 1].text}`);
        return depth3[pick - 1].url;
      } else {
        console.log(`[BGIngest] LLM found no reasonable match for "${model}"`);
        return null;
      }
    } catch (llmErr) {
      console.error(`[BGIngest] LLM model selection failed: ${llmErr.message}`);
      // Last resort: skip rather than pick wrong vehicle
      return null;
    }
  } catch (err) {
    console.error(`[BGIngest] Error finding vehicle page: ${err.message}`);
    return null;
  }
}

// ── Ingest a vehicle page (download ZIP, extract, embed) ────────────

async function ingestVehiclePage(pageUrl, vehicleContext) {
  const label = `${vehicleContext.year} ${vehicleContext.make} ${vehicleContext.model}`;
  const html = await fetchHtml(pageUrl);
  const links = extractLinks(html, pageUrl);

  // Prefer Mac-friendly ZIP
  let zipLink = links.find(l => l.text.includes('better file names'));
  if (!zipLink) zipLink = links.find(l => l.url.endsWith('.zip'));

  if (zipLink) {
    return await ingestFromZip(zipLink.url, vehicleContext, label);
  } else {
    // Fallback: scrape Repair and Diagnosis page
    const contentLinks = links.filter(l =>
      l.text.includes('Repair and Diagnosis') || l.text.includes('Parts and Labor')
    );
    let total = 0;
    for (const link of contentLinks) {
      try {
        const cHtml = await fetchHtml(link.url);
        const text = extractPageText(cHtml);
        if (text && text.length >= 50) {
          total += await ingestText(text, {
            source: link.url,
            title: label,
            category: guessCategory(link.url),
            vehicle: vehicleContext,
          });
        }
      } catch (err) {
        console.error(`[BGIngest] Error scraping ${link.url}: ${err.message}`);
      }
    }
    return total;
  }
}

async function ingestFromZip(zipUrl, vehicleContext, label) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'charm-bg-'));
  try {
    console.log(`[BGIngest] Downloading ZIP for ${label}...`);
    const res = await fetch(zipUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const zipPath = path.join(tmpDir, 'manual.zip');
    fs.writeFileSync(zipPath, buffer);

    const extractDir = path.join(tmpDir, 'extracted');
    fs.mkdirSync(extractDir);
    execSync(`unzip -o -q "${zipPath}" -d "${extractDir}"`);

    const textFiles = collectTextFiles(extractDir);
    console.log(`[BGIngest] ${label}: Extracted ${textFiles.length} files, embedding...`);

    let total = 0;
    for (const filePath of textFiles) {
      let text;
      if (/\.html?$/i.test(filePath)) {
        text = extractPageText(fs.readFileSync(filePath, 'utf-8'));
      } else {
        text = fs.readFileSync(filePath, 'utf-8');
      }
      if (!text || text.length < 50) continue;

      const category = guessCategory(filePath);
      const title = path.basename(filePath, path.extname(filePath)).replace(/[_+]/g, ' ');

      total += await ingestText(text, {
        source: zipUrl,
        title: `${label} — ${title}`,
        category,
        vehicle: vehicleContext,
      });
    }

    console.log(`[BGIngest] ✓ ${label}: ${total} chunks stored`);
    return total;
  } catch (err) {
    console.error(`[BGIngest] ✗ ${label}: ${err.message}`);
    return 0;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Kick off background ingestion for a vehicle if not already ingested.
 * Returns immediately — does not block the caller.
 * Returns true if ingestion was kicked off, false if already ingested/in-flight.
 */
function triggerBackgroundIngest(vehicleContext) {
  const key = vehicleKey(vehicleContext.make, vehicleContext.model);

  // Already running for this vehicle
  if (activeIngestions.has(key)) {
    console.log(`[BGIngest] Already ingesting ${key}, skipping`);
    return false;
  }

  activeIngestions.add(key);

  // Fire and forget — don't await
  (async () => {
    try {
      const alreadyDone = await isVehicleIngested(vehicleContext);
      if (alreadyDone) {
        console.log(`[BGIngest] ${key} already ingested, skipping`);
        return;
      }

      const pageUrl = await findVehiclePage(vehicleContext);
      if (!pageUrl) {
        console.log(`[BGIngest] Could not find ${key} on charm.li`);
        return;
      }

      await ingestVehiclePage(pageUrl, vehicleContext);
    } catch (err) {
      console.error(`[BGIngest] Unhandled error for ${key}: ${err.message}`);
    } finally {
      activeIngestions.delete(key);
    }
  })();

  return true;
}

module.exports = { isVehicleIngested, triggerBackgroundIngest };
