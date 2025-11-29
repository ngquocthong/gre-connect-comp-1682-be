const express = require('express');
const { 
  getConversations, 
  getConversation, 
  createConversation, 
  deleteConversation,
  searchConversations
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getConversations);

router.get('/search', protect, searchConversations);

router.get('/:id', protect, getConversation);

router.post('/', protect, createConversation);

router.delete('/:id', protect, deleteConversation);

module.exports = router;

