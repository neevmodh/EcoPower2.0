import express from 'express';
import mongoose from 'mongoose';
import { PaymentMethod } from '../models/PaymentMethod.js';

const router = express.Router();

// Helper to format payment method response (never expose sensitive data)
const formatPaymentMethod = (pm) => {
  const obj = pm.toObject ? pm.toObject() : pm;
  const formatted = {
    paymentMethodId: obj._id.toString(),
    userId: obj.user_id.toString(),
    methodType: obj.method_type,
    isDefault: obj.is_default,
    isActive: obj.is_active,
    createdAt: obj.createdAt
  };

  // Add method-specific display info (masked/tokenized only)
  switch (obj.method_type) {
    case 'upi':
      formatted.displayInfo = obj.upi_id ? `${obj.upi_id.substring(0, 3)}***@${obj.upi_id.split('@')[1]}` : 'UPI';
      break;
    case 'card':
      formatted.displayInfo = `${obj.card_brand || 'Card'} •••• ${obj.card_last4}`;
      formatted.expiryMonth = obj.card_expiry_month;
      formatted.expiryYear = obj.card_expiry_year;
      break;
    case 'netbanking':
      formatted.displayInfo = obj.bank_name || 'Net Banking';
      break;
    case 'wallet':
      formatted.displayInfo = obj.wallet_provider || 'Wallet';
      break;
  }

  return formatted;
};

// @route   POST /api/payment-methods
// @desc    Save payment method
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { userId, methodType, upiId, cardToken, cardLast4, cardBrand, cardExpiryMonth, cardExpiryYear, bankName, walletProvider, walletId, isDefault } = req.body;

    // Validate required fields
    if (!userId || !methodType) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'userId and methodType are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Validate method type
    const validMethods = ['upi', 'card', 'netbanking', 'wallet'];
    if (!validMethods.includes(methodType)) {
      return res.status(400).json({ 
        error: 'Invalid method type',
        validMethods 
      });
    }

    // Validate method-specific fields
    if (methodType === 'upi' && !upiId) {
      return res.status(400).json({ error: 'UPI ID required for UPI payment method' });
    }
    if (methodType === 'card' && (!cardToken || !cardLast4)) {
      return res.status(400).json({ error: 'Card token and last 4 digits required for card payment method' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await PaymentMethod.updateMany(
        { user_id: userId, is_default: true },
        { is_default: false }
      );
    }

    // Create payment method
    const paymentMethod = new PaymentMethod({
      user_id: userId,
      method_type: methodType,
      upi_id: upiId,
      card_token: cardToken,
      card_last4: cardLast4,
      card_brand: cardBrand,
      card_expiry_month: cardExpiryMonth,
      card_expiry_year: cardExpiryYear,
      bank_name: bankName,
      wallet_provider: walletProvider,
      wallet_id: walletId,
      is_default: isDefault || false,
      is_active: true
    });

    await paymentMethod.save();

    res.status(201).json({
      success: true,
      message: 'Payment method saved successfully',
      paymentMethod: formatPaymentMethod(paymentMethod)
    });

  } catch (err) {
    console.error('Save payment method error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   GET /api/payment-methods
// @desc    List user payment methods
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId query parameter required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const paymentMethods = await PaymentMethod.find({ 
      user_id: userId, 
      is_active: true 
    }).sort({ is_default: -1, createdAt: -1 });

    res.json({
      success: true,
      count: paymentMethods.length,
      paymentMethods: paymentMethods.map(formatPaymentMethod)
    });

  } catch (err) {
    console.error('Get payment methods error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   DELETE /api/payment-methods/:id
// @desc    Remove payment method (soft delete)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid payment method ID' });
    }

    const paymentMethod = await PaymentMethod.findById(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Soft delete (set is_active to false)
    paymentMethod.is_active = false;
    await paymentMethod.save();

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });

  } catch (err) {
    console.error('Delete payment method error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   PUT /api/payment-methods/:id/default
// @desc    Set payment method as default
// @access  Private
router.put('/:id/default', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid payment method ID' });
    }

    const paymentMethod = await PaymentMethod.findById(req.params.id);
    if (!paymentMethod) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    // Unset other defaults for this user
    await PaymentMethod.updateMany(
      { user_id: paymentMethod.user_id, is_default: true },
      { is_default: false }
    );

    // Set this as default
    paymentMethod.is_default = true;
    await paymentMethod.save();

    res.json({
      success: true,
      message: 'Default payment method updated',
      paymentMethod: formatPaymentMethod(paymentMethod)
    });

  } catch (err) {
    console.error('Set default payment method error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

export default router;
