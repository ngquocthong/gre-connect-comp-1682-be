# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
This backend now supports push notifications using Firebase Cloud Messaging (FCM). Users can receive real-time notifications on their mobile devices even when the app is closed.

## Prerequisites
- A Firebase project (create one at https://console.firebase.google.com/)
- Firebase Admin SDK credentials

## Setup Instructions

### 1. Create a Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project" and follow the setup wizard
3. Enable Cloud Messaging in your project

### 2. Get Firebase Admin SDK Credentials
1. In Firebase Console, go to **Project Settings** (gear icon)
2. Navigate to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file (e.g., `firebase-service-account.json`)
5. Save it in your backend root directory

### 3. Configure Environment Variables

#### Option A: Using JSON File (Recommended for Development)
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

#### Option B: Using JSON String (Recommended for Production)
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
```

### 4. API Endpoints

#### Update FCM Token
```http
POST /api/users/fcm-token
Authorization: Bearer {token}
Content-Type: application/json

{
  "fcmToken": "user_device_fcm_token_from_mobile_app"
}
```

#### Remove FCM Token
```http
DELETE /api/users/fcm-token
Authorization: Bearer {token}
```

## How It Works

### Automatic Push Notifications
When a notification is created via `/api/notifications`, the system automatically:
1. Saves the notification to the database
2. Sends it via Socket.IO for real-time updates
3. Sends a push notification to the user's device (if FCM token exists)

### Notification Payload Structure
```javascript
{
  title: "Notification Title",
  body: "Notification message",
  data: {
    type: "message", // notification type
    notificationId: "abc123",
    route: "/messages", // deep link route
    // ... custom data
  }
}
```

## Utility Functions

### Send Push Notification to Single User
```javascript
const { sendPushNotification } = require('./utils/fcmNotification');

await sendPushNotification(userId, {
  title: "New Message",
  body: "You have a new message",
  data: {
    type: "message",
    conversationId: "123"
  }
});
```

### Send Bulk Push Notifications
```javascript
const { sendBulkPushNotifications } = require('./utils/fcmNotification');

await sendBulkPushNotifications([userId1, userId2, userId3], {
  title: "System Announcement",
  body: "Server maintenance scheduled"
});
```

### Send to All Users by Role
```javascript
const { sendPushNotificationByRole } = require('./utils/fcmNotification');

await sendPushNotificationByRole('teacher', {
  title: "Teacher Meeting",
  body: "Meeting starts in 15 minutes"
});
```

### Send to All Users
```javascript
const { sendPushNotificationToAll } = require('./utils/fcmNotification');

await sendPushNotificationToAll({
  title: "Important Notice",
  body: "System update completed"
});
```

## Mobile App Integration

### Flutter Example
```dart
// Add firebase_messaging to pubspec.yaml
// Get FCM token
final fcmToken = await FirebaseMessaging.instance.getToken();

// Send to backend
await http.post(
  Uri.parse('$apiUrl/users/fcm-token'),
  headers: {'Authorization': 'Bearer $authToken'},
  body: {'fcmToken': fcmToken},
);

// Handle notifications
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Notification: ${message.notification?.title}');
  // Handle notification data
});
```

### React Native Example
```javascript
// Using @react-native-firebase/messaging
import messaging from '@react-native-firebase/messaging';

// Get FCM token
const fcmToken = await messaging().getToken();

// Send to backend
await fetch(`${API_URL}/users/fcm-token`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ fcmToken })
});

// Handle notifications
messaging().onMessage(async remoteMessage => {
  console.log('Notification:', remoteMessage.notification.title);
});
```

## Token Management

### Automatic Token Cleanup
The system automatically removes invalid FCM tokens when:
- Token is no longer registered
- Token is invalid or expired
- Push notification delivery fails

### Manual Token Removal
Users should remove their FCM token when:
- Logging out
- Uninstalling the app
- Switching accounts

## Testing Push Notifications

### Using Postman or cURL
```bash
# Create a notification (will trigger push notification)
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": "user_id_here",
    "type": "system",
    "title": "Test Notification",
    "message": "This is a test push notification"
  }'
```

### Using Firebase Console
1. Go to Firebase Console > Cloud Messaging
2. Click "Send your first message"
3. Enter notification details
4. Select target (use specific FCM token for testing)

## Troubleshooting

### FCM not working
- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT` is set correctly
- Check Firebase project has Cloud Messaging enabled
- Ensure mobile app has correct Firebase configuration
- Verify FCM token is being sent to backend correctly

### Invalid Token Errors
- These are automatically handled and invalid tokens are removed
- User needs to re-register their FCM token

### No notifications received
- Check user has an FCM token stored in database
- Verify mobile app has notification permissions enabled
- Check Firebase Console for delivery statistics

## Security Notes

- **Never commit** `firebase-service-account.json` to version control
- Use environment variables for production deployments
- Rotate service account keys periodically
- Implement rate limiting for notification endpoints
- Validate notification content before sending

## Production Deployment

### Environment Setup
For production, use the JSON string approach:
```bash
# Export service account as minified JSON string
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

### Cloud Platform Examples

**Heroku:**
```bash
heroku config:set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

**Vercel/Netlify:**
Add as environment variable in dashboard

**Docker:**
```dockerfile
ENV FIREBASE_SERVICE_ACCOUNT=${FIREBASE_SERVICE_ACCOUNT}
```

## Additional Resources
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
- [Best Practices for Push Notifications](https://firebase.google.com/docs/cloud-messaging/concept-options)

