# Troubleshooting: Calls and FCM Push Notifications

## Error: "Requested entity was not found"

### What this error means:
This Firebase error typically occurs when:
1. **User doesn't have an FCM token** - The user hasn't registered their device token
2. **FCM token is invalid/expired** - The token was revoked or is no longer valid
3. **User doesn't exist in database** - The userId being used doesn't match any user

### Important: Calls Still Work Without FCM! ✅

**The call functionality will work even if FCM fails!** The backend:
- ✅ Creates the call successfully
- ✅ Emits Socket.IO events (real-time notifications)
- ✅ Returns Agora tokens for video/audio
- ⚠️ Only FCM push notification fails (if user has no token)

---

## How to Fix FCM Issues

### Step 1: Check if Users Have FCM Tokens

```bash
# Connect to MongoDB and check
db.users.find({ fcmToken: { $exists: true, $ne: null } }).count()
```

### Step 2: Register FCM Token from Frontend

The frontend must send the FCM token to the backend:

```typescript
// React Native example
import messaging from '@react-native-firebase/messaging';

async function registerFCMToken() {
  try {
    // Request permission (iOS)
    const authStatus = await messaging().requestPermission();
    
    // Get FCM token
    const token = await messaging().getToken();
    
    // Send to backend
    await api.put('/api/auth/fcm-token', {
      fcmToken: token
    });
    
    console.log('FCM token registered:', token);
  } catch (error) {
    console.error('FCM registration error:', error);
  }
}
```

### Step 3: Test FCM Service

```bash
# Run the test script
npm run test:fcm
```

This will:
- Check if any users have FCM tokens
- Send test notifications
- Show detailed error messages

---

## Testing Call Functionality

### Test 1: Initiate Call (Should Work Even Without FCM)

```bash
POST /api/calls/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "conversationId": "<conversation_id>",
  "type": "video"
}
```

**Expected Response:**
```json
{
  "call": {
    "_id": "...",
    "type": "video",
    "status": "ongoing",
    "channelName": "conversation_...",
    ...
  },
  "agoraToken": "007eJxTYBBd...",
  "channelName": "conversation_...",
  "uid": 123456789,
  "appId": "your-agora-app-id"
}
```

### Test 2: Check Socket Events

The backend emits `incoming-call` event to:
- `user:<targetUserId>` - Personal room (auto-joined on connect)
- `conversation:<conversationId>` - Conversation room

**Frontend should listen:**
```typescript
socket.on('incoming-call', (data) => {
  const { conversationId, type, caller, callId } = data;
  // Show incoming call UI
  showIncomingCallModal({
    callId,
    callType: type,
    callerName: `${caller.firstName} ${caller.lastName}`,
    callerAvatar: caller.profilePicture
  });
});
```

---

## Common Issues and Solutions

### Issue 1: "Cannot calling" - Call endpoint returns error

**Check:**
1. ✅ User is authenticated (valid JWT token)
2. ✅ Conversation exists
3. ✅ User is a participant in the conversation
4. ✅ `conversationId` is valid MongoDB ObjectId
5. ✅ `type` is either "audio" or "video"

**Debug:**
```bash
# Check server logs for detailed error messages
# The backend now logs:
# - 📞 Initiate call request
# - ✅ Call initiated successfully
# - ❌ Initiate call error (with stack trace)
```

### Issue 2: FCM notification fails but call works

**This is normal!** FCM is optional. The call will work via Socket.IO.

**To fix FCM:**
1. Ensure users register FCM tokens from mobile app
2. Check Firebase configuration:
   ```bash
   # Verify Firebase is initialized
   # Check logs for: "Firebase Admin SDK initialized successfully"
   ```
3. Verify Firebase Service Account is correct:
   ```bash
   # Check .env has:
   FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-json>
   # OR
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```

### Issue 3: Socket events not received

**Check:**
1. ✅ Socket.IO connection is established
2. ✅ User is authenticated via socket (token in `socket.handshake.auth.token`)
3. ✅ User auto-joins `user:<userId>` room on connect
4. ✅ Frontend is listening to correct event names

**Debug Socket Connection:**
```typescript
// Frontend
socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('incoming-call', (data) => {
  console.log('Received incoming-call:', data);
});
```

---

## Backend Logging

The backend now provides detailed logging:

### Successful Call Initiation:
```
📞 Initiate call request: conversationId=..., type=video, caller=...
✅ Call ... initiated successfully. Type: video, Channel: conversation_...
📡 Socket events emitted: 1 direct + 1 conversation room
✅ Call initiated successfully: ...
```

### FCM Notification:
```
Sending call notification to 1 recipient(s) for call ...
Attempting to send FCM to user ... (has token: true)
✅ FCM notification sent successfully to user ... (...)
```

### Errors:
```
❌ Initiate call error: ...
Error stack: ...
```

---

## Environment Variables Required

```bash
# Agora (Required for calls)
AGORA_APP_ID=your-agora-app-id
AGORA_APP_CERTIFICATE=your-agora-app-certificate

# Firebase (Optional - for push notifications)
FIREBASE_SERVICE_ACCOUNT_BASE64=<base64-encoded-json>
# OR
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# MongoDB (Required)
MONGODB_URI=mongodb+srv://...

# JWT (Required)
JWT_SECRET=your-secret-key
```

---

## Summary

✅ **Calls work without FCM** - Socket.IO handles real-time notifications  
✅ **FCM is optional** - Only needed for push notifications when app is closed  
✅ **Better error handling** - Detailed logs help identify issues  
✅ **Non-blocking FCM** - Call creation doesn't fail if FCM fails  

**Next Steps:**
1. Test call initiation via Postman/API
2. Check Socket.IO events are received
3. Register FCM tokens from mobile app
4. Test FCM notifications separately

