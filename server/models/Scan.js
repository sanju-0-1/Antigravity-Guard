const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for anonymous scans if allowed, but we'll use it for history
  },
  type: {
    type: String,
    enum: ['url', 'text', 'whatsapp'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  riskScore: {
    type: Number,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['Safe', 'Suspicious', 'Malicious'],
    default: 'Safe'
  },
  engineBreakdown: {
    type: Object,
    default: {}
  },
  reportedByCommunity: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  details: {
    type: [String],
    default: []
  },
  recommendations: {
    type: [String],
    default: []
  },
  example: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Scan', scanSchema);
