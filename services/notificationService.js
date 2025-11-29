const Notification = require('../models/Notification');
const fcmService = require('./fcmService');

class NotificationService {
  async getNotifications(userId, limit = 50) {
    const notifications = await Notification.find({ recipientId: userId })
      .populate('senderId', 'firstName lastName profilePicture username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    return notifications;
  }

  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      recipientId: userId,
      isRead: false
    });

    return count;
  }

  async createNotification(data) {
    const { recipientId, senderId, type, title, message, dataObj, avatar, route } = data;

    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      title,
      message,
      data: dataObj,
      avatar,
      route
    });

    await notification.populate('senderId', 'firstName lastName profilePicture username');

    // Send push notification asynchronously (non-blocking)
    fcmService.sendPushNotification(recipientId, {
      title,
      body: message,
      data: {
        type,
        notificationId: notification._id.toString(),
        route: route || '',
        ...dataObj
      }
    }).catch(err => console.error('Push notification error:', err));

    return notification;
  }

  async markAsRead(userId, notificationIds) {
    await Notification.updateMany(
      { 
        _id: { $in: notificationIds },
        recipientId: userId
      },
      { isRead: true }
    );
  }

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { isRead: true }
    );
  }

  async deleteNotification(notificationId, userId) {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipientId: userId
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.deleteOne();
  }
}

module.exports = new NotificationService();

