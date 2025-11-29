const Call = require('../models/Call');
const { generateAgoraToken } = require('../config/agora');

class CallService {
  async initiateCall(userId, data) {
    const { conversationId, type } = data;

    const channelName = `call_${Date.now()}_${userId}`;
    const uid = parseInt(userId.toString().slice(-8), 16);
    
    const token = generateAgoraToken(channelName, uid, 'publisher');

    const call = await Call.create({
      conversationId,
      initiatorId: userId,
      participants: [userId],
      type,
      channelName,
      status: 'ongoing'
    });

    return {
      call,
      token,
      channelName,
      uid
    };
  }

  async joinCall(callId, userId) {
    const call = await Call.findById(callId);
    
    if (!call) {
      throw new Error('Call not found');
    }

    if (call.status !== 'ongoing') {
      throw new Error('Call has ended');
    }

    if (!call.participants.includes(userId)) {
      call.participants.push(userId);
      await call.save();
    }

    const uid = parseInt(userId.toString().slice(-8), 16);
    const token = generateAgoraToken(call.channelName, uid, 'publisher');

    return {
      call,
      token,
      channelName: call.channelName,
      uid
    };
  }

  async endCall(callId, userId) {
    const call = await Call.findById(callId);

    if (!call) {
      throw new Error('Call not found');
    }

    if (call.initiatorId.toString() !== userId.toString()) {
      throw new Error('Only initiator can end call');
    }

    call.status = 'ended';
    call.endTime = Date.now();
    call.duration = Math.floor((call.endTime - call.startTime) / 1000);
    await call.save();

    return call;
  }

  async getCallHistory(conversationId) {
    const calls = await Call.find({ conversationId })
      .populate('initiatorId', 'firstName lastName profilePicture username')
      .populate('participants', 'firstName lastName profilePicture username')
      .sort({ startTime: -1 })
      .limit(20);

    return calls;
  }
}

module.exports = new CallService();

