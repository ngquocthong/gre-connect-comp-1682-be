const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  uploadedBy: {
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
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['document', 'video', 'link'],
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

resourceSchema.index({ uploadedBy: 1 });
resourceSchema.index({ type: 1, createdAt: -1 });
resourceSchema.index({ tags: 1 });

module.exports = mongoose.model('Resource', resourceSchema);

