import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  method_type: { 
    type: String, 
    enum: ['upi', 'card', 'netbanking', 'wallet'], 
    required: true 
  },
  // For UPI
  upi_id: { 
    type: String 
  },
  // For cards (tokenized, never store actual card numbers)
  card_token: { 
    type: String 
  },
  card_last4: { 
    type: String 
  },
  card_brand: { 
    type: String 
  },
  card_expiry_month: { 
    type: Number 
  },
  card_expiry_year: { 
    type: Number 
  },
  // For netbanking
  bank_name: { 
    type: String 
  },
  // For wallet
  wallet_provider: { 
    type: String 
  },
  wallet_id: { 
    type: String 
  },
  is_default: { 
    type: Boolean, 
    default: false 
  },
  is_active: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentMethodSchema.index({ user_id: 1, is_active: 1 });

export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
