const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: String,
  type: String,
  name: String,
  size: Number
}, { _id: false });

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  reactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvotes: {
    type: Number,
    default: 0
  },
  attachments: [attachmentSchema]
}, {
  timestamps: true
});

answerSchema.index({ questionId: 1, createdAt: 1 });
answerSchema.index({ authorId: 1 });

module.exports = mongoose.model('Answer', answerSchema);

