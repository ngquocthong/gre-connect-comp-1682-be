const callService = require('../services/callService');
const Conversation = require('../models/Conversation');

/**
 * Initiate a new call
 * @route POST /api/calls/initiate
 */
const initiateCall = async (req, res) => {
  try {
    const { conversationId, type } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: 'Conversation ID is required' });
    }

    if (!type || !['audio', 'video'].includes(type)) {
      return res.status(400).json({ message: 'Type must be "audio" or "video"' });
    }

    const result = await callService.initiateCall(req.user._id, { conversationId, type });

    // Get conversation participants to notify
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', '_id');

    // Emit socket event for incoming call to EACH target user
    const io = req.app.get('io');
    if (io && conversation) {
      // Build caller object with required fields
      const callerData = {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profilePicture: req.user.profilePicture
      };

      // Emit to each participant EXCEPT the caller
      conversation.participants.forEach(participant => {
        if (participant._id.toString() !== req.user._id.toString()) {
          // Emit to user's personal socket room (user:<userId>)
          io.to(`user:${participant._id}`).emit('incoming-call', {
            conversationId: conversationId,
            type: type,
            caller: callerData,
            callId: result.call._id
          });
        }
      });

      // Also emit to conversation room for clients already listening there
      io.to(`conversation:${conversationId}`).emit('incoming-call', {
        conversationId: conversationId,
        type: type,
        caller: callerData,
        callId: result.call._id
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Initiate call error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Join an existing call
 * @route POST /api/calls/:id/join
 */
const joinCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await callService.joinCall(id, req.user._id);

    // Emit socket event for user joined
    const io = req.app.get('io');
    if (io) {
      io.to(`call:${id}`).emit('user-joined-call', {
        callId: id,
        user: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          profilePicture: req.user.profilePicture
        }
      });
    }

    res.json(result);
  } catch (error) {
    if (error.message === 'Call not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Call has ended') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Join call error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * End a call
 * @route POST /api/calls/:id/end
 */
const endCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await callService.endCall(id, req.user._id);

    // Emit socket event for call ended
    const io = req.app.get('io');
    if (io) {
      io.to(`call:${id}`).emit('call-ended', {
        callId: id,
        endedBy: req.user._id,
        duration: result.call.duration
      });
    }

    res.json(result);
  } catch (error) {
    if (error.message === 'Call not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Not authorized to end this call') {
      return res.status(403).json({ message: error.message });
    }
    console.error('End call error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Leave a call (for group calls)
 * @route POST /api/calls/:id/leave
 */
const leaveCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await callService.leaveCall(id, req.user._id);

    // Emit socket event for user left
    const io = req.app.get('io');
    if (io) {
      io.to(`call:${id}`).emit('user-left-call', {
        callId: id,
        user: {
          _id: req.user._id,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      });
    }

    res.json(result);
  } catch (error) {
    if (error.message === 'Call not found') {
      return res.status(404).json({ message: error.message });
    }
    console.error('Leave call error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Decline an incoming call
 * @route POST /api/calls/:id/decline
 */
const declineCall = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await callService.declineCall(id, req.user._id);

    // Emit socket event for call declined
    const io = req.app.get('io');
    if (io) {
      io.to(`call:${id}`).emit('call-declined', {
        callId: id,
        declinedBy: req.user._id
      });
    }

    res.json(result);
  } catch (error) {
    if (error.message === 'Call not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Call is not active') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Decline call error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get call history for a conversation
 * @route GET /api/calls/history/:conversationId
 */
const getCallHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const calls = await callService.getCallHistory(conversationId);
    res.json(calls);
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get active call for a conversation
 * @route GET /api/calls/active/:conversationId
 */
const getActiveCall = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const call = await callService.getActiveCall(conversationId);

    if (!call) {
      return res.json({ call: null, hasActiveCall: false });
    }

    // Generate token for the requesting user to join
    const uid = callService.generateUid(req.user._id);
    const { generateAgoraToken } = require('../config/agora');
    const agoraToken = generateAgoraToken(call.channelName, uid, 'publisher');

    res.json({
      call,
      hasActiveCall: true,
      agoraToken,
      channelName: call.channelName,
      uid,
      appId: process.env.AGORA_APP_ID
    });
  } catch (error) {
    console.error('Get active call error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  initiateCall,
  joinCall,
  endCall,
  leaveCall,
  declineCall,
  getCallHistory,
  getActiveCall
};
