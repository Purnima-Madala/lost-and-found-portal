const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
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
  location: {
    type: String,
    required: true
  },
  lostDate: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: String,
    default: null
  },
  publicId: String,
  reward: {
    type: String,
    default: 'No reward offered'
  },
  status: {
    type: String,
    enum: ['lost', 'found', 'returned'],
    default: 'lost'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foundBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LostItem', lostItemSchema);