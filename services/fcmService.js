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

      // Convert userId to string if it's an ObjectId
      const userIdStr = userId?.toString ? userId.toString() : userId;

      if (!userIdStr) {
        console.error('Invalid userId provided to sendPushNotification:', userId);
        return { success: false, message: 'Invalid user ID' };
      }

      const user = await User.findById(userIdStr).select('fcmToken firstName lastName email');

      if (!user) {
        console.error(`User not found: ${userIdStr}`);
        return { success: false, message: 'User not found' };
      }

      if (!user.fcmToken) {
        console.warn(`User ${userIdStr} (${user.email || 'N/A'}) does not have FCM token. Skipping notification.`);
        return { success: false, message: 'User FCM token not found' };
      }

      // Validate FCM token format (should be a long string)
      if (typeof user.fcmToken !== 'string' || user.fcmToken.length < 50) {
        console.error(`Invalid FCM token format for user ${userIdStr}`);
        await User.findByIdAndUpdate(userIdStr, { $unset: { fcmToken: 1 } });
        return { success: false, message: 'Invalid FCM token format' };
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
      console.log(`✅ FCM notification sent successfully to user ${userIdStr} (${user.email || 'N/A'})`);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending push notification:', error.message);
      console.error('Error details:', {
        code: error.code,
        userId: userId?.toString ? userId.toString() : userId,
        errorInfo: error.errorInfo || error.message
      });

      // Handle specific Firebase errors
      if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-argument') {
        const userIdStr = userId?.toString ? userId.toString() : userId;
        await User.findByIdAndUpdate(userIdStr, { $unset: { fcmToken: 1 } });
        console.log(`Removed invalid FCM token for user ${userIdStr}`);
      }

      return { success: false, error: error.message, code: error.code };
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

