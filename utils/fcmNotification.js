// This file is deprecated. Please use services/fcmService.js instead.
// Keeping for backward compatibility.

const fcmService = require('../services/fcmService');

module.exports = {
    sendPushNotification: fcmService.sendPushNotification.bind(fcmService),
    sendBulkPushNotifications: fcmService.sendBulkPushNotifications.bind(fcmService),
    sendPushNotificationByRole: fcmService.sendPushNotificationByRole.bind(fcmService),
    sendPushNotificationToAll: fcmService.sendPushNotificationToAll.bind(fcmService)
};
