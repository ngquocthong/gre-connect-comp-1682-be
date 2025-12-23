const AIConversation = require('../models/AIConversation');
const difyService = require('../services/difyService');

/**
 * Get or create AI conversation for current user
 * This ensures every user always has an AI chat available
 * @route GET /api/ai-chat
 */
const getOrCreateConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversation = await AIConversation.getOrCreateForUser(userId);
    
    res.json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        difyConversationId: conversation.difyConversationId,
        messages: conversation.messages,
        isPinned: conversation.isPinned,
        lastMessageAt: conversation.lastMessageAt,
        metadata: conversation.metadata,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      },
      aiServiceAvailable: difyService.isAvailable()
    });
  } catch (error) {
    console.error('Get AI conversation error:', error);
    res.status(500).json({ message: 'Failed to get AI conversation' });
  }
};

/**
 * Get all AI conversations for current user
 * @route GET /api/ai-chat/conversations
 */
const getAllConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20, skip = 0 } = req.query;

    const conversations = await AIConversation.find({ 
      userId, 
      isActive: true 
    })
      .select('_id title isPinned lastMessageAt metadata.totalMessages createdAt')
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await AIConversation.countDocuments({ userId, isActive: true });

    res.json({
      conversations,
      total,
      hasMore: total > Number(skip) + conversations.length
    });
  } catch (error) {
    console.error('Get AI conversations error:', error);
    res.status(500).json({ message: 'Failed to get conversations' });
  }
};

/**
 * Get a specific AI conversation by ID
 * @route GET /api/ai-chat/conversations/:conversationId
 */
const getConversationById = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      conversation,
      aiServiceAvailable: difyService.isAvailable()
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Failed to get conversation' });
  }
};

/**
 * Create a new AI conversation
 * @route POST /api/ai-chat/conversations
 */
const createConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title } = req.body;

    const conversation = await AIConversation.create({
      userId,
      title: title || 'New AI Chat',
      messages: [{
        role: 'assistant',
        content: 'Xin chào! Tôi là AI Assistant của GreConnect. Tôi có thể giúp bạn với các câu hỏi về học tập, tài liệu, và nhiều điều khác. Bạn cần hỗ trợ gì?'
      }]
    });

    res.status(201).json({
      conversation,
      aiServiceAvailable: difyService.isAvailable()
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
};

/**
 * Send a message to AI and get response
 * @route POST /api/ai-chat/conversations/:conversationId/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, inputs = {} } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Find conversation
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Add user message
    conversation.addMessage({
      role: 'user',
      content: message.trim()
    });

    // Check if AI service is available
    if (!difyService.isAvailable()) {
      // Fallback response when AI is not configured
      conversation.addMessage({
        role: 'assistant',
        content: 'Xin lỗi, dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.'
      });
      
      conversation.generateTitle();
      await conversation.save();

      return res.json({
        conversation: {
          _id: conversation._id,
          messages: conversation.messages.slice(-2) // Return last 2 messages
        },
        aiServiceAvailable: false
      });
    }

    // Call Dify API
    const aiResponse = await difyService.sendChatMessage({
      query: message.trim(),
      userId: userId.toString(),
      conversationId: conversation.difyConversationId || '',
      inputs
    });

    if (!aiResponse.success) {
      // Add error message
      conversation.addMessage({
        role: 'assistant',
        content: aiResponse.message || 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.'
      });
      
      await conversation.save();
      
      return res.status(500).json({
        message: aiResponse.message,
        conversation: {
          _id: conversation._id,
          messages: conversation.messages.slice(-2)
        }
      });
    }

    // Update Dify conversation ID if new
    if (aiResponse.conversationId && !conversation.difyConversationId) {
      conversation.difyConversationId = aiResponse.conversationId;
    }

    // Add AI response
    conversation.addMessage({
      role: 'assistant',
      content: aiResponse.answer,
      difyMessageId: aiResponse.messageId,
      metadata: aiResponse.metadata
    });

    // Generate title from first message
    conversation.generateTitle();
    
    await conversation.save();

    res.json({
      conversation: {
        _id: conversation._id,
        title: conversation.title,
        difyConversationId: conversation.difyConversationId,
        messages: conversation.messages.slice(-2), // Return last 2 messages
        lastMessageAt: conversation.lastMessageAt
      },
      aiResponse: {
        answer: aiResponse.answer,
        messageId: aiResponse.messageId,
        metadata: aiResponse.metadata
      },
      aiServiceAvailable: true
    });
  } catch (error) {
    console.error('Send AI message error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

/**
 * Send message with streaming response (SSE)
 * @route POST /api/ai-chat/conversations/:conversationId/messages/stream
 */
const sendMessageStreaming = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, inputs = {} } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!difyService.isAvailable()) {
      return res.status(503).json({ message: 'AI service not available' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Add user message first
    conversation.addMessage({
      role: 'user',
      content: message.trim()
    });

    // Call Dify with streaming
    await difyService.sendChatMessageStreaming(
      {
        query: message.trim(),
        userId: userId.toString(),
        conversationId: conversation.difyConversationId || '',
        inputs
      },
      // onMessage callback
      (data) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', ...data })}\n\n`);
      },
      // onComplete callback
      async (data) => {
        // Update conversation with Dify ID
        if (data.conversationId && !conversation.difyConversationId) {
          conversation.difyConversationId = data.conversationId;
        }

        // Add AI response
        conversation.addMessage({
          role: 'assistant',
          content: data.answer,
          difyMessageId: data.messageId
        });

        conversation.generateTitle();
        await conversation.save();

        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          answer: data.answer,
          conversationId: conversation._id,
          messageId: data.messageId
        })}\n\n`);
        res.end();
      },
      // onError callback
      (error) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.error })}\n\n`);
        res.end();
      }
    );
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ message: 'Failed to stream message' });
  }
};

/**
 * Update conversation title
 * @route PUT /api/ai-chat/conversations/:conversationId
 */
const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title, isPinned } = req.body;
    const userId = req.user._id;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (title !== undefined) conversation.title = title;
    if (isPinned !== undefined) conversation.isPinned = isPinned;

    await conversation.save();

    // Also update in Dify if conversation exists there
    if (title && conversation.difyConversationId) {
      difyService.renameConversation(
        conversation.difyConversationId, 
        title, 
        userId.toString()
      ).catch(err => console.error('Dify rename error:', err));
    }

    res.json({ conversation });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ message: 'Failed to update conversation' });
  }
};

/**
 * Delete (soft) a conversation
 * @route DELETE /api/ai-chat/conversations/:conversationId
 */
const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Soft delete
    conversation.isActive = false;
    await conversation.save();

    // Also delete in Dify
    if (conversation.difyConversationId) {
      difyService.deleteConversation(
        conversation.difyConversationId, 
        userId.toString()
      ).catch(err => console.error('Dify delete error:', err));
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
};

/**
 * Submit feedback for a message
 * @route POST /api/ai-chat/messages/:messageId/feedback
 */
const submitFeedback = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { rating } = req.body; // 'like' or 'dislike'
    const userId = req.user._id;

    if (!['like', 'dislike'].includes(rating)) {
      return res.status(400).json({ message: 'Invalid rating. Use "like" or "dislike"' });
    }

    // Find conversation containing this message
    const conversation = await AIConversation.findOne({
      userId,
      'messages.difyMessageId': messageId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Update local feedback
    const message = conversation.messages.find(m => m.difyMessageId === messageId);
    if (message) {
      message.feedback = {
        rating,
        submittedAt: new Date()
      };
      await conversation.save();
    }

    // Submit to Dify
    const result = await difyService.submitFeedback(messageId, rating, userId.toString());

    res.json({ 
      success: true, 
      message: 'Feedback submitted',
      difySubmitted: result.success
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

/**
 * Get suggested follow-up questions
 * @route GET /api/ai-chat/messages/:messageId/suggestions
 */
const getSuggestions = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const result = await difyService.getSuggestedQuestions(messageId, userId.toString());

    res.json({
      suggestions: result.suggestions || []
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions' });
  }
};

/**
 * Get AI service status
 * @route GET /api/ai-chat/status
 */
const getAIStatus = async (req, res) => {
  try {
    const isAvailable = difyService.isAvailable();
    let appInfo = null;

    if (isAvailable) {
      appInfo = await difyService.getAppInfo();
    }

    res.json({
      available: isAvailable,
      appInfo: appInfo?.success ? appInfo : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get AI status' });
  }
};

/**
 * Clear all messages in a conversation (keep conversation)
 * @route POST /api/ai-chat/conversations/:conversationId/clear
 */
const clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await AIConversation.findOne({
      _id: conversationId,
      userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Reset conversation
    conversation.messages = [{
      role: 'assistant',
      content: 'Xin chào! Tôi là AI Assistant của GreConnect. Tôi có thể giúp bạn với các câu hỏi về học tập, tài liệu, và nhiều điều khác. Bạn cần hỗ trợ gì?'
    }];
    conversation.difyConversationId = null;
    conversation.title = 'New AI Chat';
    conversation.metadata = { totalMessages: 1, totalTokensUsed: 0 };
    
    await conversation.save();

    res.json({ 
      message: 'Conversation cleared',
      conversation
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({ message: 'Failed to clear conversation' });
  }
};

module.exports = {
  getOrCreateConversation,
  getAllConversations,
  getConversationById,
  createConversation,
  sendMessage,
  sendMessageStreaming,
  updateConversation,
  deleteConversation,
  submitFeedback,
  getSuggestions,
  getAIStatus,
  clearConversation
};

