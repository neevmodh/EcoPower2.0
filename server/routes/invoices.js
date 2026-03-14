import express from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Subscription } from '../models/Subscription.js';
import { EnergyPlan } from '../models/EnergyPlan.js';
import { Payment } from '../models/Payment.js';

const router = express.Router();

const formatInvoice = (inv) => {
  const obj = inv.toObject ? inv.toObject() : inv;
  return {
    invoiceId: obj._id.toString(),
    subscriptionId: obj.subscription_id?.toString() || '',
    locationId: obj.subscription_id?.toString() || 'Unknown',
    billingPeriod: obj.billing_period || '',
    billingPeriodStart: obj.billing_period_start || new Date(),
    billingPeriodEnd: obj.billing_period_end || new Date(),
    dueDate: obj.due_date || new Date(),
    energyUsedKwh: obj.energy_used_kwh || 0,
    baseAmount: obj.base_amount || 0,
    tax: obj.tax || 0,
    discount: obj.discount || 0,
    totalAmount: obj.total_amount || 0,
    status: obj.status.charAt(0).toUpperCase() + obj.status.slice(1),
  };
};

// @route GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { role, userId } = req.query;
    const normalizedRole = role ? String(role).trim().toLowerCase() : '';
    let invoices = [];

    if (normalizedRole === 'admin') {
      invoices = await Invoice.find().sort({ billing_period_start: -1 });
    } else {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Valid User ID required' });
      }
      const subs = await Subscription.find({ user_id: userId });
      const subIds = subs.map(s => s._id);
      invoices = await Invoice.find({ subscription_id: { $in: subIds } }).sort({ billing_period_start: -1 });
    }

    res.json(invoices.map(formatInvoice));
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route POST /api/invoices — generate new billing cycle for all active subscriptions
router.post('/', async (req, res) => {
  try {
    const subs = await Subscription.find({ status: 'active' }).populate('plan_id');
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDate = new Date(end.getTime() + 15 * 24 * 60 * 60 * 1000);
    const period = now.toLocaleString('default', { month: 'short', year: 'numeric' });

    const created = [];
    for (const sub of subs) {
      // Skip if invoice already exists for this period
      const existing = await Invoice.findOne({
        subscription_id: sub._id,
        billing_period: period,
      });
      if (existing) continue;

      const plan = sub.plan_id;
      const baseAmount = plan?.price_per_month || 1499;
      const tax = Number((baseAmount * 0.18).toFixed(2));
      const totalAmount = Number((baseAmount + tax).toFixed(2));
      const energyUsed = Math.floor((plan?.max_kwh || 400) * (0.6 + Math.random() * 0.3));

      const inv = await Invoice.create({
        subscription_id: sub._id,
        billing_period: period,
        billing_period_start: start,
        billing_period_end: end,
        due_date: dueDate,
        energy_used_kwh: energyUsed,
        base_amount: baseAmount,
        tax,
        discount: 0,
        total_amount: totalAmount,
        status: 'pending',
      });
      created.push(inv);
    }

    res.json({
      message: `Generated ${created.length} new invoices for ${period}`,
      count: created.length,
      skipped: subs.length - created.length,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// @route PUT /api/invoices/:id/pay
router.put('/:id/pay', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', updated_at: new Date() },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Create payment audit record
    try {
      await Payment.create({
        invoice_id: invoice._id,
        amount: invoice.total_amount,
        payment_method: 'card',
        transaction_id: `TXN-ADMIN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'completed',
        gateway_response: { source: 'admin_manual', success: true },
      });
    } catch {
      // Payment audit failure shouldn't block the invoice update
    }

    res.json(formatInvoice(invoice));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(formatInvoice(invoice));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid ID' });
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
