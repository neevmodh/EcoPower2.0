import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const router = express.Router();

const formatUser = (u) => {
  const obj = u.toObject ? u.toObject() : u;
  return {
    userId: obj._id.toString(),
    _id: obj._id.toString(),
    name: obj.name,
    email: obj.email,
    phone: obj.phone || '',
    companyName: obj.companyName || '',
    role: obj.role.charAt(0).toUpperCase() + obj.role.slice(1),
    status: obj.status.charAt(0).toUpperCase() + obj.status.slice(1),
    created_at: obj.created_at,
  };
};

// @route POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// @route POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, companyName } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role are required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = new User({
      name, email, password_hash,
      role: role.toLowerCase(),
      phone: phone || '',
      companyName: companyName || '',
      status: 'active',
    });
    await user.save();
    res.status(201).json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// @route GET /api/users
// Works for both 'admin' and 'Admin' role query
router.get('/', async (req, res) => {
  try {
    const roleReq = req.query.role;
    const normalized = roleReq ? roleReq.trim().toLowerCase() : '';
    if (normalized !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const users = await User.find().sort({ created_at: -1 });
    res.json(users.map(formatUser));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route PUT /api/users/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: status.toLowerCase() },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.companyName !== undefined) updates.companyName = req.body.companyName;
    if (req.body.role) updates.role = req.body.role.toLowerCase();
    if (req.body.status) updates.status = req.body.status.toLowerCase();
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(formatUser(user));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/users/:id/dashboard
router.get('/:id/dashboard', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: formatUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
