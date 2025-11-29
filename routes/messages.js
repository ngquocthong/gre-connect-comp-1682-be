const express = require('express');
const { 
  getMessages, 
  createMessage, 
  deleteMessage,
  markAsRead
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/:conversationId', protect, getMessages);

router.post('/', protect, createMessage);

router.delete('/:id', protect, deleteMessage);

router.post('/read', protect, markAsRead);

module.exports = router;

