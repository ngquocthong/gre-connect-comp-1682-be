const mongoose = require('mongoose');

/**
 * AI Message Schema - Individual messages in AI conversation
 */
const aiMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  difyMessageId: {
    type: String,
    index: true
  },
  metadata: {
    usage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number
    },
    retrieverResources: [{
      datasetId: String,
      datasetName: String,
      documentId: String,
      documentName: String,
      score: Number,
      content: String
    }]
  },
  feedback: {
    rating: {
      type: String,
      enum: ['like', 'dislike', null],
      default: null
    },
    submittedAt: Date
  }
}, {
  timestamps: true
});

/**
 * AI Conversation Schema - Store AI chat sessions
 */
const aiConversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  difyConversationId: {
    type: String,
    index: true
  },
  title: {
    type: String,
    default: 'New AI Chat'
  },
  messages: [aiMessageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
aiConversationSchema.index({ userId: 1, lastMessageAt: -1 });
aiConversationSchema.index({ userId: 1, isPinned: -1, lastMessageAt: -1 });

// Virtual for unread count (if needed later)
aiConversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Update lastMessageAt and metadata when messages are added
aiConversationSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.lastMessageAt = new Date();
  this.metadata.totalMessages = this.messages.length;
  
  if (message.metadata?.usage?.totalTokens) {
    this.metadata.totalTokensUsed += message.metadata.usage.totalTokens;
  }
  
  return this;
};

// Auto-generate title from first user message
aiConversationSchema.methods.generateTitle = function() {
  const firstUserMessage = this.messages.find(m => m.role === 'user');
  if (firstUserMessage && this.title === 'New AI Chat') {
    // Take first 50 chars of first message as title
    this.title = firstUserMessage.content.substring(0, 50) + 
      (firstUserMessage.content.length > 50 ? '...' : '');
  }
  return this;
};

// Static method to get or create AI conversation for user
aiConversationSchema.statics.getOrCreateForUser = async function(userId) {
  // Check if user has any active AI conversation
  let conversation = await this.findOne({ 
    userId, 
    isActive: true 
  }).sort({ lastMessageAt: -1 });
  
  if (!conversation) {
    // Create new AI conversation
    conversation = await this.create({
      userId,
      title: 'New AI Chat',
      messages: [{
        role: 'assistant',
        content: 'Xin chào! Tôi là AI Assistant của GreConnect. Tôi có thể giúp bạn với các câu hỏi về học tập, tài liệu, và nhiều điều khác. Bạn cần hỗ trợ gì?'
      }]
    });
  }
  
  return conversation;
};

// JSON transform
aiConversationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('AIConversation', aiConversationSchema);

