const express = require('express');
const router = express.Router();

const VPIC = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const VEHICLE_TYPES = ['car', 'truck', 'multipurpose passenger vehicle (mpv)'];

// In-memory cache for makes list (refreshes every 24 hours)
let makesCache = { data: null, ts: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Format vPIC uppercase names to title case (keeps short abbreviations like BMW, GMC)
function formatName(name) {
  return name.split(/(\s+|-)/).map(part => {
    if (/^\s+$/.test(part) || part === '-') return part;
    if (part.length <= 3) return part;
    return part.charAt(0) + part.slice(1).toLowerCase();
  }).join('');
}

// GET /api/vehicles/years — generated year range (no external API needed)
router.get('/years', (req, res) => {
  const top = new Date().getFullYear() + 1;
  const years = [];
  for (let y = top; y >= 1979; y--) years.push(y);
  res.json(years);
});

// GET /api/vehicles/makes — all passenger-vehicle makes (cached from vPIC)
router.get('/makes', async (req, res) => {
  try {
    if (makesCache.data && Date.now() - makesCache.ts < CACHE_TTL) {
      return res.json(makesCache.data);
    }

    const requests = VEHICLE_TYPES.map(type =>
      fetch(`${VPIC}/GetMakesForVehicleType/${encodeURIComponent(type)}?format=json`)
        .then(r => r.json())
    );
    const results = await Promise.all(requests);

    const nameSet = new Set();
    for (const r of results) {
      for (const item of (r.Results || [])) {
        nameSet.add(item.MakeName);
      }
    }

    const makes = [...nameSet].map(formatName).sort((a, b) => a.localeCompare(b));
    makesCache = { data: makes, ts: Date.now() };
    res.json(makes);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch makes from NHTSA' });
  }
});

// GET /api/vehicles/models?year=&make= — models from vPIC (merges car/truck/mpv)
router.get('/models', async (req, res) => {
  try {
    const { year, make } = req.query;
    if (!year || !make) return res.status(400).json({ error: 'year and make query params are required' });

    const requests = VEHICLE_TYPES.map(type =>
      fetch(`${VPIC}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}/vehicletype/${encodeURIComponent(type)}?format=json`)
        .then(r => r.json())
    );
    const results = await Promise.all(requests);

    const nameSet = new Set();
    for (const r of results) {
      for (const item of (r.Results || [])) {
        if (item.Model_Name) nameSet.add(item.Model_Name);
      }
    }

    const models = [...nameSet].sort((a, b) => a.localeCompare(b));
    res.json(models);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch models from NHTSA' });
  }
});

// GET /api/vehicles/trims?year=&make=&model= — best-effort trim/variant options from vPIC
// Note: vPIC does not expose a dedicated trim catalog by year/make/model. We infer
// options from model variants returned by GetModelsForMakeYear.
router.get('/trims', async (req, res) => {
  try {
    const { year, make, model } = req.query;
    if (!year || !make || !model) {
      return res.status(400).json({ error: 'year, make, and model query params are required' });
    }

    const response = await fetch(
      `${VPIC}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${year}?format=json`
    );
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch trim options from NHTSA' });
    }

    const data = await response.json();
    const modelLower = String(model).trim().toLowerCase();
    const optionsSet = new Set();

    for (const item of (data.Results || [])) {
      const name = (item.Model_Name || '').trim();
      if (!name) continue;
      const lower = name.toLowerCase();

      if (lower === modelLower) continue;

      // "Explorer Sport" -> "Sport" when model is "Explorer"
      if (lower.startsWith(`${modelLower} `)) {
        const suffix = name.slice(model.length).trim();
        if (suffix) optionsSet.add(suffix);
      }
    }

    res.json([...optionsSet].sort((a, b) => a.localeCompare(b)));
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch trim options from NHTSA' });
  }
});

// GET /api/vehicles/vin/:vin — VIN decode via NHTSA vPIC
router.get('/vin/:vin', async (req, res) => {
  try {
    const { vin } = req.params;

    // Validate VIN format: 17 chars, alphanumeric, no I/O/Q
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(vin)) {
      return res.status(400).json({ error: 'Invalid VIN format. Must be 17 alphanumeric characters (no I, O, or Q).' });
    }

    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
    );

    if (!response.ok) {
      return res.status(502).json({ error: 'NHTSA VIN decode service unavailable' });
    }

    const data = await response.json();
    const row = (data.Results && data.Results[0]) || {};
    const clean = (v) => {
      if (v == null) return null;
      const s = String(v).trim();
      if (!s || s === '0' || s.toLowerCase() === 'not applicable') return null;
      return s;
    };

    const year = clean(row.ModelYear);
    const make = clean(row.Make);
    const model = clean(row.Model);
    const trim = clean(row.Trim) || clean(row.Series) || clean(row.Series2) || '';
    const bodyStyle = clean(row.BodyClass) || '';
    const driveType = clean(row.DriveType) || '';

    const displacement = clean(row.DisplacementL);
    const cylinders = clean(row.EngineCylinders);
    const engineModel = clean(row.EngineModel);
    const engineDesc = clean(row.EngineConfiguration);

    let engine = '';
    if (displacement && cylinders) engine = `${displacement}L ${cylinders}-Cylinder`;
    else if (displacement) engine = `${displacement}L`;
    else if (engineModel) engine = engineModel;
    else if (engineDesc) engine = engineDesc;

    const decoded = {
      year: year ? parseInt(year) : null,
      make,
      model,
      trim,
      engine,
      bodyStyle,
      driveType,
    };

    if (!decoded.year || !decoded.make || !decoded.model) {
      return res.status(404).json({ error: 'Could not decode VIN. Some required fields are missing.', partial: decoded });
    }

    res.json(decoded);
  } catch (err) {
    res.status(500).json({ error: 'VIN decode failed' });
  }
});

module.exports = router;
