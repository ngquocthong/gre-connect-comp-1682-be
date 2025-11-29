const express = require('express');
const { 
  getNotifications, 
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getNotifications);

router.get('/unread-count', protect, getUnreadCount);

router.post('/', protect, createNotification);

router.post('/read', protect, markAsRead);

router.post('/read-all', protect, markAllAsRead);

router.delete('/:id', protect, deleteNotification);

module.exports = router;

