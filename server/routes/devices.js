import express from 'express';
import mongoose from 'mongoose';
import { Device } from '../models/Device.js';
import { Location } from '../models/Location.js';

const router = express.Router();

const TYPE_LABELS = {
  smart_meter: 'Smart Meter',
  solar_inverter: 'Solar Inverter',
  battery_system: 'Battery System',
};

const formatDevice = (d) => {
  const obj = d.toObject ? d.toObject() : d;
  obj.deviceId = obj.device_serial;
  obj.type = TYPE_LABELS[obj.device_type] || obj.device_type;
  obj.status = obj.status.charAt(0).toUpperCase() + obj.status.slice(1);
  obj.locationId = obj.location_id?.toString();
  obj.lastPing = obj.last_seen || new Date();
  return obj;
};

// @route GET /api/devices
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.query;
    let devices;
    const normalizedRole = role ? String(role).trim().toLowerCase() : '';

    if (normalizedRole === 'admin') {
      devices = await Device.find();
    } else {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Valid User ID required' });
      }
      const userLocations = await Location.find({ user_id: userId });
      const locIds = userLocations.map(l => l._id);
      devices = await Device.find({ location_id: { $in: locIds } });
    }

    res.json(devices.map(formatDevice));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/devices/:id
router.get('/:id', async (req, res) => {
  try {
    const device = await Device.findOne({ device_serial: req.params.id });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(formatDevice(device));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route PUT /api/devices/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status.toLowerCase();
    if (req.body.firmware_version) updates.firmware_version = req.body.firmware_version;
    if (req.body.device_type) updates.device_type = req.body.device_type;
    updates.last_seen = new Date();

    const device = await Device.findOneAndUpdate(
      { device_serial: req.params.id },
      updates,
      { new: true }
    );
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(formatDevice(device));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/devices/:id/toggle
router.post('/:id/toggle', async (req, res) => {
  try {
    const device = await Device.findOne({ device_serial: req.params.id });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    device.status = device.status === 'online' ? 'offline' : 'online';
    device.last_seen = new Date();
    await device.save();
    res.json(formatDevice(device));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route DELETE /api/devices/:id
router.delete('/:id', async (req, res) => {
  try {
    await Device.findOneAndDelete({ device_serial: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
