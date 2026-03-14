import express from 'express';
import mongoose from 'mongoose';
import { Location } from '../models/Location.js';

const router = express.Router();

const formatLocation = (loc) => {
  const obj = loc.toObject ? loc.toObject() : loc;
  obj.locationId = obj._id.toString();
  obj.planId = 'Mapped Sub Plan';
  // Use actual lat/lng from DB; fall back to Ahmedabad center only if missing
  obj.coordinates = {
    lat: obj.latitude || 23.0225,
    lng: obj.longitude || 72.5714
  };
  obj.status = 'Active';
  return obj;
};

// @route GET /api/locations
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.query;
    let locations;
    const normalizedRole = role ? String(role).trim().toLowerCase() : '';

    if (normalizedRole === 'admin') {
      locations = await Location.find();
    } else {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Valid User ID required' });
      }
      locations = await Location.find({ user_id: userId });
    }

    res.json(locations.map(formatLocation));
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route POST /api/locations
router.post('/', async (req, res) => {
  try {
    const loc = new Location({
      user_id: req.body.user_id,
      name: req.body.name,
      address_line1: req.body.address_line1,
      city: req.body.city || 'Ahmedabad',
      state: req.body.state || 'Gujarat',
      postal_code: req.body.postal_code,
      location_type: req.body.location_type || 'residential',
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    await loc.save();
    res.status(201).json(formatLocation(loc));
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;
