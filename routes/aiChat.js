const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const {
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
} = require('../controllers/aiChatController');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/ai-chat
 * @desc    Get or create AI conversation for current user
 * @access  Private
 */
router.get('/', getOrCreateConversation);

/**
 * @route   GET /api/ai-chat/status
 * @desc    Get AI service status
 * @access  Private
 */
router.get('/status', getAIStatus);

/**
 * @route   GET /api/ai-chat/conversations
 * @desc    Get all AI conversations for current user
 * @access  Private
 */
router.get('/conversations', getAllConversations);

/**
 * @route   POST /api/ai-chat/conversations
 * @desc    Create a new AI conversation
 * @access  Private
 */
router.post('/conversations', [
  body('title').optional().trim().isLength({ max: 100 })
], createConversation);

/**
 * @route   GET /api/ai-chat/conversations/:conversationId
 * @desc    Get specific conversation by ID
 * @access  Private
 */
router.get('/conversations/:conversationId', getConversationById);

/**
 * @route   PUT /api/ai-chat/conversations/:conversationId
 * @desc    Update conversation (title, pin status)
 * @access  Private
 */
router.put('/conversations/:conversationId', [
  body('title').optional().trim().isLength({ max: 100 }),
  body('isPinned').optional().isBoolean(),
  validateRequest
], updateConversation);

/**
 * @route   DELETE /api/ai-chat/conversations/:conversationId
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/conversations/:conversationId', deleteConversation);

/**
 * @route   POST /api/ai-chat/conversations/:conversationId/clear
 * @desc    Clear all messages in a conversation
 * @access  Private
 */
router.post('/conversations/:conversationId/clear', clearConversation);

/**
 * @route   POST /api/ai-chat/conversations/:conversationId/messages
 * @desc    Send a message to AI and get response
 * @access  Private
 */
router.post('/conversations/:conversationId/messages', [
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('inputs').optional().isObject(),
  validateRequest
], sendMessage);

/**
 * @route   POST /api/ai-chat/conversations/:conversationId/messages/stream
 * @desc    Send a message to AI with streaming response (SSE)
 * @access  Private
 */
router.post('/conversations/:conversationId/messages/stream', [
  body('message').notEmpty().withMessage('Message is required').trim(),
  body('inputs').optional().isObject(),
  validateRequest
], sendMessageStreaming);

/**
 * @route   POST /api/ai-chat/messages/:messageId/feedback
 * @desc    Submit feedback for an AI message
 * @access  Private
 */
router.post('/messages/:messageId/feedback', [
  body('rating').isIn(['like', 'dislike']).withMessage('Rating must be "like" or "dislike"'),
  validateRequest
], submitFeedback);

/**
 * @route   GET /api/ai-chat/messages/:messageId/suggestions
 * @desc    Get suggested follow-up questions
 * @access  Private
 */
router.get('/messages/:messageId/suggestions', getSuggestions);

module.exports = router;

