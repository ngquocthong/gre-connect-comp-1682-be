const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  type: {
    type: String,
    enum: ['academic', 'social', 'sports', 'other'],
    default: 'other'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  recurrence: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

eventSchema.index({ createdBy: 1 });
eventSchema.index({ date: 1 });
eventSchema.index({ participants: 1 });

module.exports = mongoose.model('Event', eventSchema);

