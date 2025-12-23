const messageService = require('../services/messageService');
const fcmService = require('../services/fcmService');
const Conversation = require('../models/Conversation');

const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    const messages = await messageService.getMessages(conversationId, { limit, before });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { conversationId, content, type, attachments } = req.body;
    const senderId = req.user._id;

    const message = await messageService.createMessage(senderId, {
      conversationId,
      content,
      type,
      attachments
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new-message', message);
    }

    // Send FCM push notifications to other participants (in background)
    sendMessageNotifications(senderId, conversationId, content, type, attachments, req.user);

    res.status(201).json(message);
  } catch (error) {
    if (error.message === 'Conversation not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// Helper function to send FCM notifications (runs in background)
const sendMessageNotifications = async (senderId, conversationId, content, type, attachments, sender) => {
  try {
    // Get conversation with participants
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', '_id');

    if (!conversation) return;

    const senderName = `${sender.firstName} ${sender.lastName}`;

    // Generate message preview based on type
    let messagePreview = content;
    if (type === 'image') {
      messagePreview = '📷 Sent an image';
    } else if (type === 'file' && attachments?.length > 0) {
      messagePreview = `📎 ${attachments[0].name || 'Sent a file'}`;
    }

    // Get recipient IDs (exclude sender)
    const recipientIds = conversation.participants
      .filter(p => p._id.toString() !== senderId.toString())
      .map(p => p._id);

    // Send notifications to all recipients
    await Promise.all(
      recipientIds.map(recipientId =>
        fcmService.sendNewMessageNotification(
          recipientId,
          senderName,
          messagePreview,
          conversationId
        ).catch(err => console.error('FCM notification error:', err.message))
      )
    );
  } catch (error) {
    console.error('Error sending message notifications:', error.message);
  }
};

const deleteMessage = async (req, res) => {
  try {
    const message = await messageService.deleteMessage(req.params.id, req.user._id);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${message.conversationId}`).emit('message-deleted', {
        messageId: message._id,
        conversationId: message.conversationId
      });
    }

    res.json(message);
  } catch (error) {
    if (error.message === 'Message not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message === 'Can only delete own messages') {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { messageIds, conversationId } = req.body;
    await messageService.markAsRead(req.user._id, messageIds);

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io && conversationId) {
      io.to(`conversation:${conversationId}`).emit('messages-read', {
        messageIds,
        userId: req.user._id,
        conversationId
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  createMessage,
  deleteMessage,
  markAsRead
};

