const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class MessageService {
  async getMessages(conversationId, options = {}) {
    const { limit = 50, before } = options;

    let query = { conversationId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'firstName lastName profilePicture username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return messages.reverse();
  }

  async createMessage(userId, data) {
    const { conversationId, content, type, attachments } = data;

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
      throw new Error('Access denied');
    }

    const message = await Message.create({
      conversationId,
      senderId: userId,
      content,
      type: type || 'text',
      attachments: attachments || [],
      readBy: [userId]
    });

    conversation.lastMessage = content;
    conversation.lastMessageTime = Date.now();
    await conversation.save();

    await message.populate('senderId', 'firstName lastName profilePicture username');

    return message;
  }

  async deleteMessage(messageId, userId) {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId.toString() !== userId.toString()) {
      throw new Error('Can only delete own messages');
    }

    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();

    return message;
  }

  async markAsRead(userId, messageIds) {
    await Message.updateMany(
      { 
        _id: { $in: messageIds },
        readBy: { $ne: userId }
      },
      { 
        $addToSet: { readBy: userId }
      }
    );
  }
}

module.exports = new MessageService();

