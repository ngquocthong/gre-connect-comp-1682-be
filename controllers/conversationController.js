const conversationService = require('../services/conversationService');

const getConversations = async (req, res) => {
  try {
    const conversations = await conversationService.getConversations(req.user._id);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConversation = async (req, res) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user._id);
    res.json(conversation);
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

const createConversation = async (req, res) => {
  try {
    const { participantIds, name, type } = req.body;
    const conversation = await conversationService.createConversation(req.user._id, {
      participantIds,
      name,
      type
    });
    res.status(201).json(conversation);
  } catch (error) {
    if (error.message === 'Direct conversation must have exactly 2 participants') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

const deleteConversation = async (req, res) => {
  try {
    await conversationService.deleteConversation(req.params.id, req.user._id);
    res.json({ message: 'Conversation deleted successfully' });
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

const searchConversations = async (req, res) => {
  try {
    const { query } = req.query;
    const conversations = await conversationService.searchConversations(req.user._id, query);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  searchConversations
};

