const notificationService = require('../services/notificationService');

const getNotifications = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const notifications = await notificationService.getNotifications(req.user._id, limit);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { recipientId, type, title, message, data, avatar, route } = req.body;

    const notification = await notificationService.createNotification({
      recipientId,
      senderId: req.user._id,
      type,
      title,
      message,
      dataObj: data,
      avatar,
      route
    });

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    await notificationService.markAsRead(req.user._id, notificationIds);
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    await notificationService.deleteNotification(req.params.id, req.user._id);
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

