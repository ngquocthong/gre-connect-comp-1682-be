const messageService = require('../services/messageService');

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

    const message = await messageService.createMessage(req.user._id, {
      conversationId,
      content,
      type,
      attachments
    });

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

const deleteMessage = async (req, res) => {
  try {
    const message = await messageService.deleteMessage(req.params.id, req.user._id);
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
    const { messageIds } = req.body;
    await messageService.markAsRead(req.user._id, messageIds);
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

