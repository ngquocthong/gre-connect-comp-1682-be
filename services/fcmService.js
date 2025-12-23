const { getFirebaseAdmin } = require('../config/firebase');
const User = require('../models/User');

class FCMService {
  async sendPushNotification(userId, notification) {
    try {
      const admin = getFirebaseAdmin();
      if (!admin) {
        console.warn('Firebase not initialized. Skipping push notification.');
        return { success: false, message: 'Firebase not configured' };
      }

      const user = await User.findById(userId).select('fcmToken');
      if (!user || !user.fcmToken) {
        return { success: false, message: 'User FCM token not found' };
      }

      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending push notification:', error.message);

      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
        await User.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
      }

      return { success: false, error: error.message };
    }
  }

  async sendBulkPushNotifications(userIds, notification) {
    try {
      const admin = getFirebaseAdmin();
      if (!admin) {
        console.warn('Firebase not initialized. Skipping bulk push notifications.');
        return { success: false, message: 'Firebase not configured' };
      }

      const users = await User.find({
        _id: { $in: userIds },
        fcmToken: { $exists: true, $ne: null }
      }).select('fcmToken');

      if (users.length === 0) {
        return { success: false, message: 'No valid FCM tokens found' };
      }

      const tokens = users.map(user => user.fcmToken);

      const message = {
        tokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const error = resp.error;
            if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
              failedTokens.push(tokens[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          await User.updateMany(
            { fcmToken: { $in: failedTokens } },
            { $unset: { fcmToken: 1 } }
          );
        }
      }

      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      };
    } catch (error) {
      console.error('Error sending bulk push notifications:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPushNotificationByRole(role, notification) {
    try {
      const users = await User.find({
        role,
        fcmToken: { $exists: true, $ne: null }
      }).select('_id');

      if (users.length === 0) {
        return { success: false, message: 'No users found with FCM tokens for this role' };
      }

      const userIds = users.map(user => user._id.toString());
      return await this.sendBulkPushNotifications(userIds, notification);
    } catch (error) {
      console.error('Error sending push notifications by role:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPushNotificationToAll(notification) {
    try {
      const users = await User.find({
        fcmToken: { $exists: true, $ne: null }
      }).select('_id');

      if (users.length === 0) {
        return { success: false, message: 'No users found with FCM tokens' };
      }

      const userIds = users.map(user => user._id.toString());
      return await this.sendBulkPushNotifications(userIds, notification);
    } catch (error) {
      console.error('Error sending push notifications to all users:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // Specific Notification Types
  // ==========================================

  /**
   * Send notification for new message
   */
  async sendNewMessageNotification(recipientId, senderName, messagePreview, conversationId) {
    const preview = messagePreview.length > 100
      ? messagePreview.substring(0, 100) + '...'
      : messagePreview;

    return this.sendPushNotification(recipientId, {
      title: `New message from ${senderName}`,
      body: preview,
      data: {
        type: 'new_message',
        conversationId: conversationId.toString(),
        senderName
      }
    });
  }

  /**
   * Send notification for new answer to a question
   */
  async sendNewAnswerNotification(questionOwnerId, answererName, questionTitle, questionId) {
    const title = questionTitle.length > 50
      ? questionTitle.substring(0, 50) + '...'
      : questionTitle;

    return this.sendPushNotification(questionOwnerId, {
      title: `${answererName} answered your question`,
      body: title,
      data: {
        type: 'new_answer',
        questionId: questionId.toString(),
        answererName
      }
    });
  }

  /**
   * Send notification for incoming call
   */
  async sendIncomingCallNotification(recipientId, callerName, callType, conversationId) {
    return this.sendPushNotification(recipientId, {
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling you`,
      data: {
        type: 'incoming_call',
        callType,
        conversationId: conversationId.toString(),
        callerName
      }
    });
  }

  /**
   * Send notification for event reminder
   */
  async sendEventReminderNotification(userId, eventTitle, eventId, startTime) {
    return this.sendPushNotification(userId, {
      title: 'Event Reminder',
      body: `${eventTitle} is starting soon!`,
      data: {
        type: 'event_reminder',
        eventId: eventId.toString(),
        startTime
      }
    });
  }

  /**
   * Send notification for user approval
   */
  async sendUserApprovedNotification(userId) {
    return this.sendPushNotification(userId, {
      title: 'Account Approved!',
      body: 'Your account has been approved. You can now use all features.',
      data: {
        type: 'account_approved'
      }
    });
  }

  /**
   * Send notification for new resource
   */
  async sendNewResourceNotification(userIds, uploaderName, resourceTitle) {
    return this.sendBulkPushNotifications(userIds, {
      title: 'New Resource Available',
      body: `${uploaderName} shared: ${resourceTitle}`,
      data: {
        type: 'new_resource'
      }
    });
  }
}

module.exports = new FCMService();

