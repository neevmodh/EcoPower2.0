import express from 'express';
import mongoose from 'mongoose';
import { EnergyReading } from '../models/EnergyReading.js';
import { Device } from '../models/Device.js';
import { Location } from '../models/Location.js';

const router = express.Router();

// @route   GET /api/telemetry/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const { role, userId, range } = req.query;

    // ── Time range filter ──────────────────────────────────────────────────
    const rangeMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = rangeMap[range] || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Find relevant devices based on user role
    let devices = [];
    const normalizedRole = role ? String(role).trim().toLowerCase() : '';

    if (normalizedRole === 'admin') {
      devices = await Device.find().lean();
    } else {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Valid User ID required for non-admin roles' });
      }
      const locations = await Location.find({ user_id: userId }).lean();
      const locIds = locations.map(l => l._id);
      devices = await Device.find({ location_id: { $in: locIds } }).lean();
    }

    const deviceIds = devices.map(d => d._id);

    // Fetch readings within time range
    const readings = await EnergyReading.find({
      device_id: { $in: deviceIds },
      timestamp: { $gte: since }
    })
      .select('timestamp energy_generated_kwh energy_consumed_kwh grid_usage_kwh battery_soc')
      .sort({ timestamp: 1 })
      .limit(normalizedRole === 'admin' ? 500 : 200)
      .lean();

    // Global totals within range
    let totals = { totalGenerated: 0, totalConsumed: 0 };
    if (normalizedRole === 'admin') {
      const agg = await EnergyReading.aggregate([
        { $match: { timestamp: { $gte: since } } },
        { $group: { _id: null, totalGen: { $sum: '$energy_generated_kwh' }, totalCons: { $sum: '$energy_consumed_kwh' } } }
      ]);
      if (agg.length > 0) totals = { totalGenerated: agg[0].totalGen, totalConsumed: agg[0].totalCons };
    } else {
      totals.totalGenerated = readings.reduce((s, r) => s + (r.energy_generated_kwh || 0), 0);
      totals.totalConsumed  = readings.reduce((s, r) => s + (r.energy_consumed_kwh  || 0), 0);
    }

    const formatted = readings.map(r => ({
      timestamp: r.timestamp,
      solarGeneration: r.energy_generated_kwh,
      consumption: r.energy_consumed_kwh,
      gridImport: r.grid_usage_kwh,
      gridExport: Math.max(0, r.energy_generated_kwh - r.energy_consumed_kwh),
      batteryStateOfCharge: r.battery_soc || 100
    }));

    res.json({ telemetry: formatted, totals, range: range || '30d', days });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   GET /api/telemetry/latest
// @desc    Get latest telemetry reading for a location
router.get('/latest', async (req, res) => {
  try {
    const { locationId, deviceId } = req.query;

    let query = {};
    if (locationId) {
      if (!mongoose.Types.ObjectId.isValid(locationId)) {
        return res.status(400).json({ error: 'Invalid location ID' });
      }
      const devices = await Device.find({ location_id: locationId });
      const deviceIds = devices.map(d => d._id);
      query.device_id = { $in: deviceIds };
    } else if (deviceId) {
      if (!mongoose.Types.ObjectId.isValid(deviceId)) {
        return res.status(400).json({ error: 'Invalid device ID' });
      }
      query.device_id = deviceId;
    } else {
      return res.status(400).json({ error: 'locationId or deviceId required' });
    }

    const latestReading = await EnergyReading.findOne(query)
      .sort({ timestamp: -1 })
      .lean();

    if (!latestReading) {
      return res.status(404).json({ error: 'No telemetry data found' });
    }

    res.json({
      timestamp: latestReading.timestamp,
      energy_generated_kwh: latestReading.energy_generated_kwh,
      energy_consumed_kwh: latestReading.energy_consumed_kwh,
      grid_usage_kwh: latestReading.grid_usage_kwh,
      battery_soc: latestReading.battery_soc || 0,
      voltage: latestReading.voltage,
      current: latestReading.current,
      power_factor: latestReading.power_factor
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   GET /api/telemetry/history
// @desc    Get historical telemetry data for charts
router.get('/history', async (req, res) => {
  try {
    const { locationId, deviceId, startDate, endDate, limit } = req.query;

    let query = {};
    
    if (locationId) {
      if (!mongoose.Types.ObjectId.isValid(locationId)) {
        return res.status(400).json({ error: 'Invalid location ID' });
      }
      const devices = await Device.find({ location_id: locationId });
      const deviceIds = devices.map(d => d._id);
      query.device_id = { $in: deviceIds };
    } else if (deviceId) {
      if (!mongoose.Types.ObjectId.isValid(deviceId)) {
        return res.status(400).json({ error: 'Invalid device ID' });
      }
      query.device_id = deviceId;
    } else {
      return res.status(400).json({ error: 'locationId or deviceId required' });
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const readings = await EnergyReading.find(query)
      .sort({ timestamp: 1 })
      .limit(limit ? parseInt(limit) : 168) // Default 7 days hourly
      .lean();

    res.json({
      success: true,
      count: readings.length,
      readings: readings.map(r => ({
        timestamp: r.timestamp,
        energy_generated_kwh: r.energy_generated_kwh,
        energy_consumed_kwh: r.energy_consumed_kwh,
        grid_usage_kwh: r.grid_usage_kwh,
        battery_soc: r.battery_soc || 0
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   POST /api/telemetry/ingest
// @desc    Ingest telemetry data from IoT devices (for simulation)
router.post('/ingest', async (req, res) => {
  try {
    const { deviceId, readings } = req.body;

    if (!deviceId || !readings || !Array.isArray(readings)) {
      return res.status(400).json({ error: 'deviceId and readings array required' });
    }

    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      return res.status(400).json({ error: 'Invalid device ID' });
    }

    // Validate device exists
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Insert readings
    const telemetryDocs = readings.map(r => ({
      device_id: deviceId,
      timestamp: r.timestamp || new Date(),
      energy_generated_kwh: r.energy_generated_kwh || 0,
      energy_consumed_kwh: r.energy_consumed_kwh || 0,
      grid_usage_kwh: r.grid_usage_kwh || 0,
      battery_soc: r.battery_soc || 0,
      voltage: r.voltage || 230,
      current: r.current || 0,
      power_factor: r.power_factor || 0.95
    }));

    await EnergyReading.insertMany(telemetryDocs);

    // Update device last_seen
    device.last_seen = new Date();
    await device.save();

    res.json({
      success: true,
      message: `Ingested ${telemetryDocs.length} readings`,
      deviceId: device._id
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

export default router;
