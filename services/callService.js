const Call = require('../models/Call');
const { generateAgoraToken } = require('../config/agora');
const fcmService = require('./fcmService');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

class CallService {
  /**
   * Generate a numeric UID from MongoDB ObjectId
   * Agora requires numeric UID (0 or positive integer)
   */
  generateUid(userId) {
    // Convert last 8 chars of ObjectId to integer
    const hexStr = userId.toString().slice(-8);
    return parseInt(hexStr, 16) % 2147483647; // Keep within 32-bit signed int range
  }

  /**
   * Initiate a new call
   * @returns {Object} { call, agoraToken, channelName, uid, appId }
   */
  async initiateCall(userId, data) {
    const { conversationId, type } = data;

    // Channel name format: conversation_<conversationId>
    const channelName = `conversation_${conversationId}`;
    const uid = this.generateUid(userId);

    // Generate Agora RTC token
    const agoraToken = generateAgoraToken(channelName, uid, 'publisher');

    const call = await Call.create({
      conversationId,
      initiatorId: userId,
      participants: [userId],
      type,
      channelName,
      status: 'ongoing'
    });

    // Populate initiator info
    await call.populate('initiatorId', 'firstName lastName profilePicture username');

    // Send FCM notification to other participants (non-blocking)
    // This will not prevent the call from being created if it fails
    this.notifyCallParticipants(conversationId, userId, type, call._id)
      .catch(err => {
        console.error('FCM call notification error (non-blocking):', err.message);
        // Don't throw - allow call to proceed even if notification fails
      });

    console.log(`✅ Call ${call._id} initiated successfully. Type: ${type}, Channel: ${channelName}`);

    return {
      call,
      agoraToken,
      channelName,
      uid,
      appId: process.env.AGORA_APP_ID
    };
  }

  /**
   * Join an existing call
   * @returns {Object} { call, agoraToken, channelName, uid, appId }
   */
  async joinCall(callId, userId) {
    const call = await Call.findById(callId)
      .populate('initiatorId', 'firstName lastName profilePicture username')
      .populate('participants', 'firstName lastName profilePicture username');

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.status !== 'ongoing') {
      throw new Error('Call has ended');
    }

    // Add user to participants if not already
    const isParticipant = call.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant) {
      call.participants.push(userId);
      await call.save();
      await call.populate('participants', 'firstName lastName profilePicture username');
    }

    const uid = this.generateUid(userId);
    const agoraToken = generateAgoraToken(call.channelName, uid, 'publisher');

    return {
      call,
      agoraToken,
      channelName: call.channelName,
      uid,
      appId: process.env.AGORA_APP_ID
    };
  }

  /**
   * End a call
   */
  async endCall(callId, userId) {
    const call = await Call.findById(callId)
      .populate('initiatorId', 'firstName lastName profilePicture username')
      .populate('participants', 'firstName lastName profilePicture username');

    if (!call) {
      throw new Error('Call not found');
    }

    // Allow any participant to end call (not just initiator)
    const isParticipant = call.participants.some(
      p => p._id.toString() === userId.toString()
    );

    if (!isParticipant && call.initiatorId._id.toString() !== userId.toString()) {
      throw new Error('Not authorized to end this call');
    }

    call.status = 'ended';
    call.endTime = Date.now();
    call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    await call.save();

    return { call };
  }

  /**
   * Leave a call (for group calls)
   */
  async leaveCall(callId, userId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    // Remove user from participants
    call.participants = call.participants.filter(
      p => p.toString() !== userId.toString()
    );

    // If no participants left, end the call
    if (call.participants.length === 0) {
      call.status = 'ended';
      call.endTime = Date.now();
      call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    }

    await call.save();
    await call.populate('participants', 'firstName lastName profilePicture username');

    return { call };
  }

  /**
   * Decline an incoming call
   */
  async declineCall(callId, userId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.status !== 'ongoing') {
      throw new Error('Call is not active');
    }

    // If only initiator is in call, mark as missed
    if (call.participants.length <= 1) {
      call.status = 'missed';
      call.endTime = Date.now();
      await call.save();
    }

    return { call, message: 'Call declined' };
  }

  /**
   * Get call history for a conversation
   */
  async getCallHistory(conversationId) {
    const calls = await Call.find({ conversationId })
      .populate('initiatorId', 'firstName lastName profilePicture username')
      .populate('participants', 'firstName lastName profilePicture username')
      .sort({ startTime: -1 })
      .limit(20);

    return calls;
  }

  /**
   * Get active call for a conversation
   */
  async getActiveCall(conversationId) {
    const call = await Call.findOne({
      conversationId,
      status: 'ongoing'
    })
      .populate('initiatorId', 'firstName lastName profilePicture username')
      .populate('participants', 'firstName lastName profilePicture username');

    return call;
  }

  /**
   * Send FCM notification to other participants
   */
  async notifyCallParticipants(conversationId, callerId, callType, callId) {
    try {
      const conversation = await Conversation.findById(conversationId)
        .populate('participants', '_id firstName lastName fcmToken');

      if (!conversation) {
        console.warn(`Conversation ${conversationId} not found for call notification`);
        return;
      }

      const caller = await User.findById(callerId);
      if (!caller) {
        console.warn(`Caller ${callerId} not found`);
        return;
      }

      const callerName = `${caller.firstName} ${caller.lastName}`;

      // Notify all participants except caller
      const recipients = conversation.participants.filter(
        p => p._id.toString() !== callerId.toString()
      );

      if (recipients.length === 0) {
        console.log(`No recipients to notify for call ${callId}`);
        return;
      }

      console.log(`Sending call notification to ${recipients.length} recipient(s) for call ${callId}`);

      // Send notifications and log results
      const results = await Promise.allSettled(
        recipients.map(recipient => {
          const recipientId = recipient._id;
          console.log(`Attempting to send FCM to user ${recipientId} (has token: ${!!recipient.fcmToken})`);

          return fcmService.sendIncomingCallNotification(
            recipientId,
            callerName,
            callType,
            conversationId
          );
        })
      );

      // Log results
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`FCM notification failed for recipient ${recipients[index]._id}:`, result.reason);
        } else if (result.value && !result.value.success) {
          console.warn(`FCM notification failed for recipient ${recipients[index]._id}:`, result.value.message || result.value.error);
        }
      });
    } catch (error) {
      console.error('Notify call participants error:', error);
      console.error('Error stack:', error.stack);
    }
  }
}

module.exports = new CallService();
