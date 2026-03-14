import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { Subscription } from '../models/Subscription.js';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// Mock payment gateway configuration (replace with actual Razorpay/Stripe in production)
const PAYMENT_GATEWAY_SECRET = process.env.PAYMENT_GATEWAY_SECRET || 'test_secret_key';
const PAYMENT_GATEWAY_MODE = process.env.PAYMENT_GATEWAY_MODE || 'test';

// Helper to format payment response
const formatPayment = (payment) => {
  const obj = payment.toObject ? payment.toObject() : payment;
  return {
    paymentId: obj._id.toString(),
    invoiceId: obj.invoice_id?.toString(),
    amount: obj.amount,
    method: obj.payment_method,
    transactionId: obj.transaction_id,
    status: obj.status,
    gatewayResponse: obj.gateway_response,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

// @route   POST /api/payments/initiate
// @desc    Initiate payment for invoice
// @access  Private
router.post('/initiate', async (req, res) => {
  try {
    const { invoiceId, paymentMethod } = req.body;

    // Validate required fields
    if (!invoiceId || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'invoiceId and paymentMethod are required' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    // Find invoice
    const invoice = await Invoice.findById(invoiceId).populate('subscription_id');
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return res.status(400).json({ 
        error: 'Invoice already paid',
        paymentId: invoice.payment_id
      });
    }

    // Validate payment method
    const validMethods = ['upi', 'card', 'netbanking', 'wallet'];
    if (!validMethods.includes(paymentMethod.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid payment method',
        validMethods 
      });
    }

    // In test mode, simulate payment gateway response
    let gatewayResponse;
    let transactionId;
    let paymentStatus;

    if (PAYMENT_GATEWAY_MODE === 'test') {
      // Simulate successful payment (90% success rate for testing)
      const isSuccess = Math.random() > 0.1;
      
      transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (isSuccess) {
        gatewayResponse = {
          success: true,
          transactionId,
          message: 'Payment successful',
          timestamp: new Date().toISOString()
        };
        paymentStatus = 'completed';
      } else {
        gatewayResponse = {
          success: false,
          error: 'Insufficient funds',
          timestamp: new Date().toISOString()
        };
        paymentStatus = 'failed';
      }
    } else {
      // TODO: Integrate with actual payment gateway (Razorpay/Stripe)
      // const razorpayResponse = await razorpay.charge({ amount, method });
      return res.status(501).json({ 
        error: 'Production payment gateway not configured',
        message: 'Please configure Razorpay or Stripe credentials'
      });
    }

    // Create payment record
    const payment = new Payment({
      invoice_id: invoiceId,
      amount: invoice.total_amount,
      payment_method: paymentMethod,
      transaction_id: transactionId,
      status: paymentStatus,
      gateway_response: gatewayResponse
    });

    await payment.save();

    // Update invoice if payment successful
    if (paymentStatus === 'completed') {
      invoice.status = 'paid';
      invoice.payment_id = payment._id;
      await invoice.save();

      // Create success notification
      const subscription = await Subscription.findById(invoice.subscription_id);
      if (subscription) {
        await Notification.create({
          user_id: subscription.user_id,
          type: 'payment_success',
          title: 'Payment Successful',
          message: `Your payment of ₹${invoice.total_amount} has been processed successfully.`,
          priority: 'medium',
          read: false
        });
      }
    } else {
      // Create failure notification
      const subscription = await Subscription.findById(invoice.subscription_id);
      if (subscription) {
        await Notification.create({
          user_id: subscription.user_id,
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Your payment of ₹${invoice.total_amount} failed. Please try again.`,
          priority: 'high',
          read: false
        });
      }
    }

    res.json({
      success: paymentStatus === 'completed',
      message: paymentStatus === 'completed' ? 'Payment processed successfully' : 'Payment failed',
      payment: formatPayment(payment),
      invoice: {
        invoiceId: invoice._id.toString(),
        status: invoice.status
      }
    });

  } catch (err) {
    console.error('Payment initiation error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle payment gateway webhooks
// @access  Public (but verified)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-payment-signature'];
    const payload = req.body;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', PAYMENT_GATEWAY_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { transactionId, status, invoiceId } = payload;

    // Find payment by transaction ID
    const payment = await Payment.findOne({ transaction_id: transactionId });
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status
    payment.status = status;
    payment.gateway_response = payload;
    await payment.save();

    // Update invoice if payment successful
    if (status === 'completed') {
      const invoice = await Invoice.findById(payment.invoice_id).populate('subscription_id');
      if (invoice) {
        invoice.status = 'paid';
        invoice.payment_id = payment._id;
        await invoice.save();

        // Send notification
        const subscription = await Subscription.findById(invoice.subscription_id);
        if (subscription) {
          await Notification.create({
            user_id: subscription.user_id,
            type: 'payment_success',
            title: 'Payment Confirmed',
            message: `Your payment of ₹${invoice.total_amount} has been confirmed.`,
            priority: 'medium',
            read: false
          });
        }
      }
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get payment status
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid payment ID' });
    }

    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'invoice_id',
        populate: { path: 'subscription_id' }
      });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      success: true,
      payment: formatPayment(payment)
    });

  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   GET /api/payments/invoice/:invoiceId
// @desc    Get payments for invoice
// @access  Private
router.get('/invoice/:invoiceId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    const payments = await Payment.find({ invoice_id: req.params.invoiceId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(formatPayment)
    });

  } catch (err) {
    console.error('Get invoice payments error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

// @route   GET /api/payments/user/:userId
// @desc    Get user payment history
// @access  Private
router.get('/user/:userId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Find all subscriptions for user
    const subscriptions = await Subscription.find({ user_id: req.params.userId });
    const subscriptionIds = subscriptions.map(s => s._id);

    // Find all invoices for these subscriptions
    const invoices = await Invoice.find({ subscription_id: { $in: subscriptionIds } });
    const invoiceIds = invoices.map(i => i._id);

    // Find all payments for these invoices
    const payments = await Payment.find({ invoice_id: { $in: invoiceIds } })
      .populate('invoice_id')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments: payments.map(formatPayment)
    });

  } catch (err) {
    console.error('Get user payments error:', err);
    res.status(500).json({ 
      error: 'Server error', 
      message: err.message 
    });
  }
});

export default router;
