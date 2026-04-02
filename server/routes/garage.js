const express = require('express');
const router = express.Router();
const GarageVehicle = require('../models/GarageVehicle');

const MAX_GARAGE_VEHICLES = 5;

// GET /api/garage — list all saved vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await GarageVehicle.find({ userId: req.session.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch garage vehicles' });
  }
});

// POST /api/garage — save a vehicle to the garage
router.post('/', async (req, res) => {
  try {
    const count = await GarageVehicle.countDocuments({ userId: req.session.userId });
    if (count >= MAX_GARAGE_VEHICLES) {
      return res.status(400).json({ error: `Maximum ${MAX_GARAGE_VEHICLES} vehicles allowed. Remove a vehicle to add a new one.` });
    }

    const { year, make, model, trim, engine, bodyStyle, driveType, nickname } = req.body;

    if (!year || !make || !model) {
      return res.status(400).json({ error: 'year, make, and model are required' });
    }

    // Check for duplicate
    const existing = await GarageVehicle.findOne({ userId: req.session.userId, year, make, model, trim: trim || '' });
    if (existing) {
      return res.status(409).json({ error: 'This vehicle is already in your garage.' });
    }

    const vehicle = await GarageVehicle.create({
      userId: req.session.userId,
      year, make, model,
      trim: trim || '',
      engine: engine || '',
      bodyStyle: bodyStyle || '',
      driveType: driveType || '',
      nickname: nickname || '',
    });

    res.status(201).json(vehicle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save vehicle' });
  }
});

// PUT /api/garage/:id — update a saved vehicle (nickname, isDefault)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    if (req.body.nickname !== undefined) updates.nickname = req.body.nickname;

    if (req.body.isDefault === true) {
      // Unset default on all others first
      await GarageVehicle.updateMany({ userId: req.session.userId }, { isDefault: false });
      updates.isDefault = true;
    } else if (req.body.isDefault === false) {
      updates.isDefault = false;
    }

    const vehicle = await GarageVehicle.findOneAndUpdate({ _id: id, userId: req.session.userId }, updates, { new: true });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/garage/:id — remove a vehicle from the garage
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await GarageVehicle.findOneAndDelete({ _id: req.params.id, userId: req.session.userId });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle removed from garage' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

module.exports = router;
