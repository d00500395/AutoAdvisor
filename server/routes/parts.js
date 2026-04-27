const express = require('express');
const router = express.Router();

const PartSearch = require('../models/PartSearch');
const PartWatchlist = require('../models/PartWatchlist');

const SCRAPER_API_BASE = (process.env.SCRAPER_API_BASE || 'http://localhost:8000').replace(/\/$/, '');

const DOMAIN_LABELS = {
  'oreillyauto.com': "O'Reilly Auto Parts",
  'autozone.com': 'AutoZone',
  'napaonline.com': 'NAPA',
  'ebay.com': 'eBay',
  'rockauto.com': 'RockAuto',
};

function formatSearchDoc(doc, watchlisted = false) {
  const raw = doc.scraperResponse || {};
  const results = raw.results || {};
  const errors = raw.errors || {};

  const retailers = Object.entries(results)
    .filter(([, value]) => value && Array.isArray(value.llm_tagged_products) && value.llm_tagged_products.length > 0)
    .map(([domain, value]) => ({
      domain,
      retailerName: DOMAIN_LABELS[domain] || domain,
      taggedProducts: value.llm_tagged_products,
      matchedCount: Number(value.llm_matched_count || 0),
      productCount: Number(value.product_count || 0),
      targetUrl: value.target_url || null,
    }));

  return {
    id: String(doc._id),
    vehicleQuery: doc.vehicleQuery,
    partQuery: doc.partQuery,
    status: doc.status,
    watchlisted,
    retailers,
    failedRetailers: errors,
    successfulDomains: doc.successfulDomains || [],
    createdAt: doc.createdAt,
    raw,
  };
}

router.post('/search', async (req, res) => {
  try {
    const vehicleQuery = String(req.body?.vehicleQuery || '').trim();
    const partQuery = String(req.body?.partQuery || '').trim();

    if (!vehicleQuery || !partQuery) {
      return res.status(400).json({ error: 'vehicleQuery and partQuery are required.' });
    }

    if (typeof fetch !== 'function') {
      return res.status(500).json({ error: 'Server fetch API is unavailable.' });
    }

    const response = await fetch(`${SCRAPER_API_BASE}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_query: vehicleQuery, part_query: partQuery }),
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(502).json({
        error: body?.detail || body?.error || 'Failed to fetch recommendations from scraper service.',
      });
    }

    const resultMap = body.results || {};
    const successfulDomains = Object.entries(resultMap)
      .filter(([, value]) => value && Array.isArray(value.llm_tagged_products) && value.llm_tagged_products.length > 0)
      .map(([domain]) => domain);

    const failedDomains = body.errors || {};

    const status = successfulDomains.length === 0
      ? 'error'
      : Object.keys(failedDomains).length > 0
        ? 'partial'
        : 'success';

    const saved = await PartSearch.create({
      userId: req.session?.userId || undefined,
      vehicleQuery,
      partQuery,
      status,
      scraperResponse: body,
      successfulDomains,
      failedDomains,
    });

    if (status === 'error') {
      return res.status(200).json({
        status: 'error',
        message: 'Autodexx is not available at the moment. Please try again later.',
        search: formatSearchDoc(saved, false),
      });
    }

    res.json({ status, search: formatSearchDoc(saved, false) });
  } catch (error) {
    console.error('POST /parts/search failed:', error);
    res.status(500).json({ error: 'Search failed. Please try again.' });
  }
});

router.get('/searches', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.json([]);
    }

    const docs = await PartSearch.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const watchlist = await PartWatchlist.find({ userId: req.session.userId }).lean();
    const watchSet = new Set(watchlist.map((w) => String(w.partSearchId)));

    res.json(docs.map((doc) => formatSearchDoc(doc, watchSet.has(String(doc._id)))));
  } catch (error) {
    console.error('GET /parts/searches failed:', error);
    res.status(500).json({ error: 'Failed to fetch searches.' });
  }
});

router.delete('/searches', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const watchlistRows = await PartWatchlist.find({ userId: req.session.userId }).lean();
    const preservedSearchIds = watchlistRows.map((row) => row.partSearchId);

    const deleteFilter = preservedSearchIds.length
      ? { userId: req.session.userId, _id: { $nin: preservedSearchIds } }
      : { userId: req.session.userId };

    const result = await PartSearch.deleteMany(deleteFilter);

    res.json({ ok: true, deleted: result.deletedCount || 0, preserved: preservedSearchIds.length });
  } catch (error) {
    console.error('DELETE /parts/searches failed:', error);
    res.status(500).json({ error: 'Failed to clear search history.' });
  }
});

router.get('/watchlist', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const watchlistRows = await PartWatchlist.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();

    const ids = watchlistRows.map((row) => row.partSearchId);
    const searches = await PartSearch.find({ _id: { $in: ids } }).lean();
    const byId = new Map(searches.map((s) => [String(s._id), s]));

    const payload = watchlistRows
      .map((row) => byId.get(String(row.partSearchId)))
      .filter(Boolean)
      .map((search) => formatSearchDoc(search, true));

    res.json(payload);
  } catch (error) {
    console.error('GET /parts/watchlist failed:', error);
    res.status(500).json({ error: 'Failed to fetch watchlist.' });
  }
});

router.post('/watchlist', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const partSearchId = String(req.body?.partSearchId || '').trim();
    if (!partSearchId) {
      return res.status(400).json({ error: 'partSearchId is required.' });
    }

    const search = await PartSearch.findById(partSearchId).lean();
    if (!search) {
      return res.status(404).json({ error: 'Search record not found.' });
    }

    await PartWatchlist.updateOne(
      { userId: req.session.userId, partSearchId },
      { $setOnInsert: { userId: req.session.userId, partSearchId } },
      { upsert: true }
    );

    res.json({ ok: true, partSearchId });
  } catch (error) {
    console.error('POST /parts/watchlist failed:', error);
    res.status(500).json({ error: 'Failed to save watchlist item.' });
  }
});

router.delete('/watchlist/:partSearchId', async (req, res) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    await PartWatchlist.deleteOne({ userId: req.session.userId, partSearchId: req.params.partSearchId });
    res.json({ ok: true, partSearchId: req.params.partSearchId });
  } catch (error) {
    console.error('DELETE /parts/watchlist/:partSearchId failed:', error);
    res.status(500).json({ error: 'Failed to remove watchlist item.' });
  }
});

module.exports = router;
