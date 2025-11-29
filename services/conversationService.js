const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class ConversationService {
  async getConversations(userId) {
    const conversations = await Conversation.find({
      participants: userId
    })
    .populate('participants', 'firstName lastName profilePicture username')
    .sort({ lastMessageTime: -1 });

    return conversations;
  }

  async getConversationById(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'firstName lastName profilePicture username');

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(p => p._id.toString() === userId.toString())) {
      throw new Error('Access denied');
    }

    return conversation;
  }

  async createConversation(userId, data) {
    const { participantIds, name, type } = data;

    if (type === 'direct' && participantIds.length !== 1) {
      throw new Error('Direct conversation must have exactly 2 participants');
    }

    const allParticipants = [...participantIds, userId];

    if (type === 'direct') {
      const existing = await Conversation.findOne({
        type: 'direct',
        participants: { $all: allParticipants, $size: 2 }
      });

      if (existing) {
        return existing;
      }
    }

    const conversation = await Conversation.create({
      name,
      type: type || 'direct',
      participants: allParticipants
    });

    await conversation.populate('participants', 'firstName lastName profilePicture username');

    return conversation;
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      throw new Error('Access denied');
    }

    await Message.deleteMany({ conversationId: conversation._id });
    await conversation.deleteOne();
  }

  async searchConversations(userId, query) {
    const conversations = await Conversation.find({
      participants: userId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { lastMessage: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('participants', 'firstName lastName profilePicture username')
    .sort({ lastMessageTime: -1 });

    return conversations;
  }
}

module.exports = new ConversationService();

