const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['ID Card', 'Laptop Charger', 'Keys', 'Water Bottle', 'Earphones', 'Other'],
    required: true
  },
  status: {
    type: String,
    enum: ['lost', 'found', 'claimed', 'returned'],
    default: 'found'
  },
  location: {
    type: String,
    required: true
  },
  dateFound: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    required: true
  },
  publicId: String,
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  claimRequest: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: undefined,
      required: false
    },
    message: String,
    requestedAt: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Item', itemSchema);