const express = require('express');
const {
  initiateCall,
  joinCall,
  endCall,
  leaveCall,
  declineCall,
  getCallHistory,
  getActiveCall
} = require('../controllers/callController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/calls/initiate
 * @desc    Initiate a new audio/video call
 * @access  Private
 * @body    { conversationId: string, type: "audio" | "video" }
 * @returns { call, agoraToken, channelName, uid, appId }
 */
router.post('/initiate', protect, initiateCall);

/**
 * @route   POST /api/calls/:id/join
 * @desc    Join an existing call
 * @access  Private
 * @returns { call, agoraToken, channelName, uid, appId }
 */
router.post('/:id/join', protect, joinCall);

/**
 * @route   POST /api/calls/:id/end
 * @desc    End a call
 * @access  Private
 */
router.post('/:id/end', protect, endCall);

/**
 * @route   POST /api/calls/:id/leave
 * @desc    Leave a call (for group calls)
 * @access  Private
 */
router.post('/:id/leave', protect, leaveCall);

/**
 * @route   POST /api/calls/:id/decline
 * @desc    Decline an incoming call
 * @access  Private
 */
router.post('/:id/decline', protect, declineCall);

/**
 * @route   GET /api/calls/history/:conversationId
 * @desc    Get call history for a conversation
 * @access  Private
 */
router.get('/history/:conversationId', protect, getCallHistory);

/**
 * @route   GET /api/calls/active/:conversationId
 * @desc    Get active call for a conversation (if any)
 * @access  Private
 * @returns { call, hasActiveCall, agoraToken?, channelName?, uid?, appId? }
 */
router.get('/active/:conversationId', protect, getActiveCall);

module.exports = router;
