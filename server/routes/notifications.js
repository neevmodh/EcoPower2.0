import express from 'express';
import mongoose from 'mongoose';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// Seed default notifications if none exist for a user
async function seedIfEmpty(userId, role) {
  const count = await Notification.countDocuments({ user_id: userId });
  if (count > 0) return;

  const defaults = {
    consumer: [
      { title: 'Solar Generation Peak', message: 'Your solar panels generated 8.4 kWh today — a new daily record!', type: 'info' },
      { title: 'Invoice Due Soon', message: 'Your March invoice of ₹2,499 is due in 5 days.', type: 'alert' },
      { title: 'Battery Fully Charged', message: 'Your home battery reached 100% charge at 2:30 PM.', type: 'success' },
      { title: 'Grid Export Earnings', message: 'You earned ₹124 from grid export this week.', type: 'success' },
      { title: 'Maintenance Reminder', message: 'Schedule your annual solar panel cleaning for optimal performance.', type: 'info' },
    ],
    admin: [
      { title: 'New User Registration', message: '3 new users registered today. Total active users: 1,247.', type: 'info' },
      { title: 'Device Offline Alert', message: 'Device SN-2024-0042 has been offline for 2 hours in Vastrapur.', type: 'alert' },
      { title: 'Revenue Milestone', message: 'Monthly revenue crossed ₹10 Lakhs for the first time!', type: 'success' },
      { title: 'Firmware Update Available', message: 'Firmware v2.4.1 is ready for deployment to 48 devices.', type: 'info' },
      { title: 'Support Ticket Escalated', message: 'Ticket #TKT-0089 has been escalated to Level 2 support.', type: 'alert' },
    ],
    enterprise: [
      { title: 'Multi-Site Report Ready', message: 'Your monthly energy report for all 5 sites is ready to download.', type: 'success' },
      { title: 'Carbon Target Achieved', message: 'Site Gandhinagar achieved its monthly carbon reduction target!', type: 'success' },
      { title: 'High Consumption Alert', message: 'Site Surat is consuming 23% above average this week.', type: 'alert' },
      { title: 'Team Member Added', message: 'Priya Sharma has been added to the Energy Manager role.', type: 'info' },
      { title: 'Contract Renewal', message: 'Your enterprise contract renews in 30 days. Review terms.', type: 'info' },
    ],
  };

  const msgs = defaults[role] || defaults.consumer;
  const docs = msgs.map((n, i) => ({
    user_id: userId,
    title: n.title,
    message: n.message,
    type: n.type,
    read: i > 2,
    is_read: i > 2,
    created_at: new Date(Date.now() - i * 3600000 * 4),
  }));
  await Notification.insertMany(docs);
}

// GET /api/notifications?userId=...&role=...
router.get('/', async (req, res) => {
  try {
    const { userId, role = 'consumer' } = req.query;
    if (!userId) return res.json([]);
    if (!mongoose.Types.ObjectId.isValid(userId)) return res.json([]);
    await seedIfEmpty(userId, role);
    const notifs = await Notification.find({ user_id: userId }).sort({ created_at: -1 }).limit(50);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true, is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/mark-all-read?userId=...
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return res.status(400).json({ error: 'Valid userId required' });
    await Notification.updateMany({ user_id: userId }, { read: true, is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
