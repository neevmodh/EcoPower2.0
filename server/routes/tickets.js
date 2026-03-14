import express from 'express';
import mongoose from 'mongoose';
import { SupportTicket } from '../models/SupportTicket.js';

const router = express.Router();

const formatTicket = (t) => {
  const obj = t.toObject ? t.toObject() : t;
  obj.ticketId = obj._id.toString();
  // Use subject as primary display, fall back to issue_type/category
  obj.subject = obj.subject || obj.issue_type || obj.category || 'Support Request';
  const rawType = obj.issue_type || obj.category || 'general';
  obj.issueType = String(rawType).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  // Normalize status display
  const s = obj.status || 'open';
  if (s === 'in_progress') obj.status = 'In Progress';
  else obj.status = s.charAt(0).toUpperCase() + s.slice(1);
  obj.priority = obj.priority
    ? obj.priority.charAt(0).toUpperCase() + obj.priority.slice(1)
    : 'Medium';
  obj.createdAt = obj.created_at || obj.createdAt || obj.updatedAt;
  return obj;
};

// @route GET /api/tickets
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.query;
    let tickets;
    const normalizedRole = role ? String(role).trim().toLowerCase() : '';

    if (normalizedRole === 'admin') {
      tickets = await SupportTicket.find().sort({ created_at: -1 });
    } else {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Valid User ID required' });
      }
      tickets = await SupportTicket.find({ user_id: userId }).sort({ created_at: -1 });
    }

    res.json(tickets.map(formatTicket));
  } catch (err) {
    console.error('GET /tickets error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route GET /api/tickets/:id
router.get('/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(formatTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route POST /api/tickets
router.post('/', async (req, res) => {
  try {
    const { user_id, subject, description, category, priority, issue_type } = req.body;
    if (!user_id || !subject || !description) {
      return res.status(400).json({ error: 'user_id, subject, and description are required' });
    }
    const ticket = new SupportTicket({
      user_id,
      subject,
      description,
      category: category || 'other',
      issue_type: issue_type || category || 'general',
      priority: priority || 'medium',
      status: 'open',
      created_at: new Date(),
    });
    await ticket.save();
    res.status(201).json(formatTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route PUT /api/tickets/:id
router.put('/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) {
      let s = req.body.status;
      if (s === 'In Progress') s = 'in_progress';
      else s = s.toLowerCase();
      updates.status = s;
      if (s === 'resolved') updates.resolved_at = new Date();
    }
    if (req.body.priority) updates.priority = req.body.priority.toLowerCase();
    if (req.body.resolution) updates.resolution = req.body.resolution;
    if (req.body.assigned_to) updates.assigned_to = req.body.assigned_to;
    updates.updated_at = new Date();

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(formatTicket(ticket));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route DELETE /api/tickets/:id
router.delete('/:id', async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
