import express from 'express';
import mongoose from 'mongoose';
import { CarbonStat } from '../models/CarbonStat.js';
import { Subscription } from '../models/Subscription.js';
import { Location } from '../models/Location.js';

const router = express.Router();

// @route   GET /api/carbon
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.query;

    const normalizedRole = role ? String(role).trim().toLowerCase() : '';

    if (normalizedRole === 'admin') {
      const stats = await CarbonStat.find().lean();
      // Aggregate all stats into a single summary object
      let total_carbon_saved_kg = 0;
      let total_trees_equivalent = 0;
      stats.forEach(s => {
        total_carbon_saved_kg += s.carbon_saved_kg || 0;
        total_trees_equivalent += s.trees_equivalent || 0;
      });
      return res.json({ total_carbon_saved_kg, total_trees_equivalent, raw_stats: stats });
    }

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Valid User ID required' });
    }

    // Role: Consumer or Enterprise
    // We fetch their subscriptions, then fetch carbon stats for those subscriptions
    const subs = await Subscription.find({ user_id: userId }).select('_id').lean();
    const subIds = subs.map(s => s._id);

    const stats = await CarbonStat.find({ subscription_id: { $in: subIds } }).lean();
    
    // Aggregate multiple subs (e.g. for Enterprise multi-site)
    let totalCarbonSaved = 0;
    let totalTrees = 0;
    
    stats.forEach(s => {
      totalCarbonSaved += s.carbon_saved_kg;
      totalTrees += s.trees_equivalent;
    });

    res.json({
        total_carbon_saved_kg: totalCarbonSaved,
        total_trees_equivalent: totalTrees,
        raw_stats: stats
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error on carbon stats' });
  }
});

export default router;
