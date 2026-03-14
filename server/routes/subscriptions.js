import express from 'express';
import mongoose from 'mongoose';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';
import { EnergyPlan } from '../models/EnergyPlan.js';
import { Location } from '../models/Location.js';
import { Invoice } from '../models/Invoice.js';

const router = express.Router();

// Helper to format subscription response
const formatSubscription = (sub) => {
  const obj = sub.toObject ? sub.toObject() : sub;
  return {
    subscriptionId: obj._id.toString(),
    userId: obj.user_id?.toString(),
    planId: obj.plan_id?.toString(),
    locationId: obj.location_id?.toString(),
    status: obj.status,
    billingCycle: obj.billing_cycle,
    startDate: obj.start_date,
    endDate: obj.end_date,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    // Include populated data if available
    plan: obj.plan_id?.plan_name ? {
      name: obj.plan_id.plan_name,
      description: obj.plan_id.description,
      pricePerMonth: obj.plan_id.price_per_month,
      solarCapacityKw: obj.plan_id.solar_capacity_kw,
      batteryIncluded: obj.plan_id.battery_included
    } : undefined,
    location: obj.location_id?.address_line1 ? {
      address: obj.location_id.address_line1,
      city: obj.location_id.city,
      state: obj.location_id.state,
      postalCode: obj.location_id.postal_code
    } : undefined
  };
};

// @route   POST /api/subscriptions
// @desc    Create new subscription
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { userId, planId, locationId, billingCycle } = req.body;

    // Validate required fields
    if (!userId || !planId || !locationId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userId, planId, and locationId are required' 
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(planId) || 
        !mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Step 1: Validate user exists and is active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'User account is not active' });
    }

    // Step 2: Validate plan exists and is active
    const plan = await EnergyPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: 'Energy plan not found' });
    }

    // Step 3: Validate location exists and belongs to user
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    if (location.user_id.toString() !== userId) {
      return res.status(403).json({ error: 'Location does not belong to user' });
    }

    // Step 4: Check for existing active subscription at location (Property 1: Subscription Uniqueness)
    const existingSubscription = await Subscription.findOne({
      location_id: locationId,
      status: 'active'
    });
    
    if (existingSubscription) {
      return res.status(409).json({ 
        error: 'Active subscription already exists at this location',
        existingSubscriptionId: existingSubscription._id.toString()
      });
    }

    // Step 5: Create subscription
    const subscription = new Subscription({
      user_id: userId,
      plan_id: planId,
      location_id: locationId,
      status: 'active',
      billing_cycle: billingCycle || 'monthly',
      start_date: new Date(),
      end_date: null
    });

    await subscription.save();

    // Step 6: Initialize first invoice (billing cycle)
    const now = new Date();
    const billingPeriodEnd = new Date(now);
    billingPeriodEnd.setMonth(billingPeriodEnd.getMonth() + 1);
    
    const dueDate = new Date(billingPeriodEnd);
    dueDate.setDate(dueDate.getDate() + 15); // 15 days after period end

    const invoice = new Invoice({
      subscription_id: subscription._id,
      billing_period: `${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`,
      billing_period_start: now,
      billing_period_end: billingPeriodEnd,
      due_date: dueDate,
      energy_used_kwh: 0,
      base_amount: plan.price_per_month,
      tax: plan.price_per_month * 0.18, // 18% GST
      discount: 0,
      total_amount: plan.price_per_month * 1.18,
      status: 'pending'
    });

    await invoice.save();

    // Return subscription with populated data
    const populatedSub = await Subscription.findById(subscription._id)
      .populate('plan_id')
      .populate('location_id');

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: formatSubscription(populatedSub),
      invoiceId: invoice._id.toString()
    });

  } catch (err) {
    console.error('Subscription creation error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   GET /api/subscriptions
// @desc    Get user subscriptions with filtering
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { userId, status, locationId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    // Build query
    const query = { user_id: userId };
    if (status) query.status = status;
    if (locationId) query.location_id = locationId;

    const subscriptions = await Subscription.find(query)
      .populate('plan_id')
      .populate('location_id')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: subscriptions.length,
      subscriptions: subscriptions.map(formatSubscription)
    });

  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   GET /api/subscriptions/:id
// @desc    Get single subscription details
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id)
      .populate('plan_id')
      .populate('location_id')
      .populate('user_id', '-password_hash');

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      success: true,
      subscription: formatSubscription(subscription)
    });

  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription (upgrade/downgrade plan)
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Only allow updates for active subscriptions
    if (subscription.status !== 'active') {
      return res.status(400).json({ 
        error: 'Cannot update inactive subscription',
        currentStatus: subscription.status
      });
    }

    // Update plan if provided
    if (planId) {
      if (!mongoose.Types.ObjectId.isValid(planId)) {
        return res.status(400).json({ error: 'Invalid plan ID' });
      }

      const plan = await EnergyPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      subscription.plan_id = planId;
    }

    // Update billing cycle if provided
    if (billingCycle) {
      if (!['monthly', 'yearly'].includes(billingCycle)) {
        return res.status(400).json({ error: 'Invalid billing cycle' });
      }
      subscription.billing_cycle = billingCycle;
    }

    await subscription.save();

    const updatedSub = await Subscription.findById(subscription._id)
      .populate('plan_id')
      .populate('location_id');

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: formatSubscription(updatedSub)
    });

  } catch (err) {
    console.error('Update subscription error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   DELETE /api/subscriptions/:id/cancel
// @desc    Cancel subscription
// @access  Private
router.delete('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Validate state transition
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ error: 'Subscription already cancelled' });
    }

    subscription.status = 'cancelled';
    subscription.end_date = new Date();
    
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: formatSubscription(subscription),
      cancellationReason: reason || 'Not provided'
    });

  } catch (err) {
    console.error('Cancel subscription error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   POST /api/subscriptions/:id/pause
// @desc    Pause subscription
// @access  Private
router.post('/:id/pause', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Validate state transition (only active can be paused)
    if (subscription.status !== 'active') {
      return res.status(400).json({ 
        error: 'Can only pause active subscriptions',
        currentStatus: subscription.status
      });
    }

    subscription.status = 'paused';
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      subscription: formatSubscription(subscription)
    });

  } catch (err) {
    console.error('Pause subscription error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   POST /api/subscriptions/:id/resume
// @desc    Resume paused subscription
// @access  Private
router.post('/:id/resume', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid subscription ID' });
    }

    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Validate state transition (only paused can be resumed)
    if (subscription.status !== 'paused') {
      return res.status(400).json({ 
        error: 'Can only resume paused subscriptions',
        currentStatus: subscription.status
      });
    }

    // Cannot resume cancelled subscriptions
    if (subscription.status === 'cancelled') {
      return res.status(400).json({ 
        error: 'Cannot resume cancelled subscription. Please create a new subscription.'
      });
    }

    subscription.status = 'active';
    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      subscription: formatSubscription(subscription)
    });

  } catch (err) {
    console.error('Resume subscription error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

export default router;
