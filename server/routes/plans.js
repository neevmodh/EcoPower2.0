import express from 'express';
import { EnergyPlan } from '../models/EnergyPlan.js';

const router = express.Router();

const formatPlan = (p) => {
  const obj = p.toObject ? p.toObject() : p;
  return {
    planId: obj._id.toString(),
    name: obj.plan_name,
    description: obj.description || '',
    targetAudience: obj.price_per_month > 10000 ? 'Enterprise' : obj.price_per_month > 3000 ? 'Business' : 'Consumer',
    basePrice: obj.price_per_month,
    maxKwh: obj.max_kwh || 0,
    includedSolarKw: obj.solar_capacity_kw || 0,
    includedBatteryKwh: obj.battery_included ? 10 : 0,
    batteryIncluded: obj.battery_included || false,
    features: obj.description ? [obj.description] : [],
  };
};

// @route GET /api/plans
router.get('/', async (req, res) => {
  try {
    const plans = await EnergyPlan.find().sort({ price_per_month: 1 });
    res.json(plans.map(formatPlan));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/plans
router.post('/', async (req, res) => {
  try {
    const plan = new EnergyPlan({
      plan_name: req.body.name,
      description: req.body.description || '',
      price_per_month: req.body.basePrice,
      max_kwh: req.body.maxKwh || 0,
      solar_capacity_kw: req.body.includedSolarKw || 0,
      battery_included: req.body.batteryIncluded || req.body.includedBatteryKwh > 0,
    });
    await plan.save();
    res.status(201).json(formatPlan(plan));
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route PUT /api/plans/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.plan_name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.basePrice !== undefined) updates.price_per_month = req.body.basePrice;
    if (req.body.maxKwh !== undefined) updates.max_kwh = req.body.maxKwh;
    if (req.body.includedSolarKw !== undefined) updates.solar_capacity_kw = req.body.includedSolarKw;
    if (req.body.batteryIncluded !== undefined) updates.battery_included = req.body.batteryIncluded;
    if (req.body.includedBatteryKwh !== undefined) updates.battery_included = req.body.includedBatteryKwh > 0;

    const plan = await EnergyPlan.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(formatPlan(plan));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route DELETE /api/plans/:id
router.delete('/:id', async (req, res) => {
  try {
    await EnergyPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
