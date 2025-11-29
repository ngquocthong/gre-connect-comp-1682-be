# GreConnect API Documentation

Complete API reference for the GreConnect backend.

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.greconnect.com/api
```

## Authentication

Most endpoints require authentication using JWT tokens.

### Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Getting a Token

Login to receive a JWT token:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "user@example.com",
    "role": "student"
  }
}
```

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "message": "Validation failed",
  "errors": [...]
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied. Insufficient permissions."
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Endpoints

### Authentication

#### Register User

```http
POST /api/auth/register
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123!",
  "role": "student"
}
```

**Response (201):**
```json
{
  "message": "Registration submitted for approval",
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "isPending": true
  }
}
```

#### Login

```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### Get Profile

```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "role": "student",
  "profilePicture": "...",
  "bio": "..."
}
```

#### Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer <token>
```

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Updated bio",
  "profilePicture": "https://..."
}
```

#### Change Password

```http
PUT /api/auth/change-password
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

### Users (Staff Only)

#### Get All Users

```http
GET /api/users?role=student&search=john
Authorization: Bearer <token>
```

**Query Parameters:**
- `role` (optional): Filter by role (student, teacher, staff, all)
- `search` (optional): Search in name, email, username

**Response (200):**
```json
[
  {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "student",
    "isActive": true
  }
]
```

#### Get Pending Users

```http
GET /api/users/pending
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "firstName": "Pending",
    "lastName": "User",
    "email": "pending@example.com",
    "isPending": true
  }
]
```

#### Approve User

```http
POST /api/users/:id/approve
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "User approved successfully",
  "user": { ... }
}
```

#### Reject User

```http
POST /api/users/:id/reject
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "User rejected and removed"
}
```

#### Update FCM Token

Register or update the user's FCM token for push notifications.

```http
POST /api/users/fcm-token
Authorization: Bearer <token>
```

**Body:**
```json
{
  "fcmToken": "device_fcm_token_from_firebase_messaging"
}
```

**Response (200):**
```json
{
  "message": "FCM token updated successfully",
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "fcmToken": "device_fcm_token..."
  }
}
```

#### Remove FCM Token

Remove the user's FCM token (e.g., when logging out).

```http
DELETE /api/users/fcm-token
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "FCM token removed successfully",
  "user": {
    "_id": "...",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Conversations

#### Get User Conversations

```http
GET /api/conversations
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "name": "John Doe",
    "type": "direct",
    "participants": [...],
    "lastMessage": "Hello!",
    "lastMessageTime": "2024-11-29T..."
  }
]
```

#### Create Conversation

```http
POST /api/conversations
Authorization: Bearer <token>
```

**Body:**
```json
{
  "participantIds": ["userId1", "userId2"],
  "name": "Study Group",
  "type": "group"
}
```

**Response (201):**
```json
{
  "_id": "...",
  "name": "Study Group",
  "type": "group",
  "participants": [...]
}
```

### Messages

#### Get Messages

```http
GET /api/messages/:conversationId?limit=50&before=2024-11-29T...
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `before` (optional): Get messages before this timestamp

**Response (200):**
```json
[
  {
    "_id": "...",
    "conversationId": "...",
    "senderId": { ... },
    "content": "Hello!",
    "type": "text",
    "createdAt": "2024-11-29T...",
    "readBy": [...]
  }
]
```

#### Send Message

```http
POST /api/messages
Authorization: Bearer <token>
```

**Body:**
```json
{
  "conversationId": "...",
  "content": "Hello!",
  "type": "text",
  "attachments": []
}
```

**Response (201):**
```json
{
  "_id": "...",
  "conversationId": "...",
  "senderId": { ... },
  "content": "Hello!",
  "type": "text",
  "createdAt": "2024-11-29T..."
}
```

#### Delete Message

```http
DELETE /api/messages/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "isDeleted": true,
  "content": "This message was deleted"
}
```

### Questions

#### Get Questions

```http
GET /api/questions?search=firebase&tags=react-native&status=active
Authorization: Bearer <token>
```

**Query Parameters:**
- `search` (optional): Search in title/content
- `tags` (optional): Filter by tags (comma-separated)
- `status` (optional): active, banned, or all

**Response (200):**
```json
[
  {
    "_id": "...",
    "userId": { ... },
    "title": "How to implement Firebase?",
    "content": "...",
    "tags": ["firebase", "react-native"],
    "views": 42,
    "isActive": true,
    "answerCount": 3,
    "createdAt": "2024-11-29T..."
  }
]
```

#### Create Question

```http
POST /api/questions
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "How to implement Firebase?",
  "content": "I need help with...",
  "tags": ["firebase", "react-native"],
  "attachments": []
}
```

**Response (201):**
```json
{
  "_id": "...",
  "userId": { ... },
  "title": "How to implement Firebase?",
  "content": "I need help with...",
  "tags": ["firebase", "react-native"],
  "views": 0,
  "isActive": true
}
```

#### Update Question

```http
PUT /api/questions/:id
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content",
  "tags": ["updated", "tags"]
}
```

#### Delete Question (Teacher/Staff)

```http
DELETE /api/questions/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Question and answers deleted successfully"
}
```

#### Ban/Unban Question (Teacher/Staff)

```http
PATCH /api/questions/:id/toggle-status
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "isActive": false
}
```

### Answers

#### Get Answers

```http
GET /api/answers/question/:questionId
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "questionId": "...",
    "authorId": { ... },
    "content": "Here's the answer...",
    "upvotes": 5,
    "reactions": [...],
    "createdAt": "2024-11-29T..."
  }
]
```

#### Create Answer

```http
POST /api/answers/question/:questionId
Authorization: Bearer <token>
```

**Body:**
```json
{
  "content": "Here's the answer...",
  "attachments": []
}
```

**Response (201):**
```json
{
  "_id": "...",
  "questionId": "...",
  "authorId": { ... },
  "content": "Here's the answer...",
  "upvotes": 0
}
```

#### Toggle Upvote

```http
POST /api/answers/:id/upvote
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "upvotes": 6,
  "reactions": [...]
}
```

### Resources

#### Get Resources

```http
GET /api/resources?type=document&search=algorithms
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): document, video, link, or all
- `search` (optional): Search in title/description
- `tags` (optional): Filter by tags

**Response (200):**
```json
[
  {
    "_id": "...",
    "uploadedBy": { ... },
    "title": "Algorithms Lecture Notes",
    "description": "...",
    "type": "document",
    "url": "https://...",
    "downloads": 15,
    "views": 45,
    "createdAt": "2024-11-29T..."
  }
]
```

#### Upload Resource

```http
POST /api/resources
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Algorithms Lecture Notes",
  "description": "Comprehensive notes...",
  "type": "document",
  "url": "https://...",
  "thumbnail": "https://...",
  "tags": ["algorithms", "computer-science"]
}
```

**Response (201):**
```json
{
  "_id": "...",
  "uploadedBy": { ... },
  "title": "Algorithms Lecture Notes",
  "downloads": 0,
  "views": 0
}
```

#### Increment Download

```http
POST /api/resources/:id/download
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "downloads": 16
}
```

### Events (Teacher/Staff)

#### Get Events

```http
GET /api/events?startDate=2024-11-01&endDate=2024-11-30&type=academic
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `type` (optional): academic, social, sports, other, or all

**Response (200):**
```json
[
  {
    "_id": "...",
    "createdBy": { ... },
    "title": "Midterm Exam",
    "description": "...",
    "date": "2024-12-15T...",
    "startTime": "09:00",
    "endTime": "11:00",
    "location": "Room 301",
    "type": "academic",
    "recurrence": "none"
  }
]
```

#### Create Event

```http
POST /api/events
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Midterm Exam",
  "description": "Topics: Data Structures...",
  "date": "2024-12-15",
  "startTime": "09:00",
  "endTime": "11:00",
  "location": "Room 301",
  "type": "academic",
  "recurrence": "none"
}
```

**Response (201):**
```json
{
  "_id": "...",
  "createdBy": { ... },
  "title": "Midterm Exam",
  "participants": [...]
}
```

### Notifications

#### Get Notifications

```http
GET /api/notifications?limit=50
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "...",
    "recipientId": "...",
    "senderId": { ... },
    "type": "message",
    "title": "New Message",
    "message": "John sent you a message",
    "isRead": false,
    "createdAt": "2024-11-29T..."
  }
]
```

#### Create Notification

Create a new notification and automatically send push notification to recipient.

```http
POST /api/notifications
Authorization: Bearer <token>
```

**Body:**
```json
{
  "recipientId": "user_id",
  "type": "message",
  "title": "New Message",
  "message": "You have a new message",
  "data": {},
  "avatar": "https://...",
  "route": "/messages"
}
```

**Response (201):**
```json
{
  "_id": "...",
  "recipientId": "...",
  "senderId": { ... },
  "type": "message",
  "title": "New Message",
  "message": "You have a new message",
  "isRead": false,
  "createdAt": "2024-11-29T..."
}
```

**Note:** Push notification is automatically sent to the recipient's device if they have registered an FCM token.

#### Get Unread Count

```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "count": 5
}
```

#### Mark as Read

```http
POST /api/notifications/read
Authorization: Bearer <token>
```

**Body:**
```json
{
  "notificationIds": ["id1", "id2"]
}
```

**Response (200):**
```json
{
  "message": "Notifications marked as read"
}
```

### Calls

#### Initiate Call

```http
POST /api/calls/initiate
Authorization: Bearer <token>
```

**Body:**
```json
{
  "conversationId": "...",
  "type": "video"
}
```

**Response (201):**
```json
{
  "call": {
    "_id": "...",
    "conversationId": "...",
    "type": "video",
    "status": "ongoing",
    "channelName": "..."
  },
  "token": "agora_token",
  "channelName": "call_...",
  "uid": 12345
}
```

#### Join Call

```http
POST /api/calls/:id/join
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "call": { ... },
  "token": "agora_token",
  "channelName": "call_...",
  "uid": 12345
}
```

#### End Call

```http
POST /api/calls/:id/end
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "...",
  "status": "ended",
  "duration": 300
}
```

## Socket.IO Events

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Client Events

#### Join Conversation
```javascript
socket.emit('join-conversation', conversationId);
```

#### Send Message
```javascript
socket.emit('send-message', {
  conversationId: '...',
  content: 'Hello!',
  type: 'text',
  attachments: []
});
```

#### Typing Indicator
```javascript
socket.emit('typing-start', conversationId);
socket.emit('typing-stop', conversationId);
```

### Server Events

#### New Message
```javascript
socket.on('new-message', (message) => {
  console.log('Received:', message);
});
```

#### User Typing
```javascript
socket.on('user-typing', ({ userId, username }) => {
  console.log(`${username} is typing...`);
});
```

#### Incoming Call
```javascript
socket.on('incoming-call', ({ conversationId, type, caller }) => {
  console.log(`${caller.name} is calling...`);
});
```

## Rate Limiting

API has rate limiting enabled:
- **100 requests per 15 minutes** per IP address

Exceeded rate limit returns:
```json
{
  "message": "Too many requests, please try again later."
}
```

## CORS

CORS is enabled for configured client URLs. Update `CLIENT_URL` in `.env` for production.

## Testing

Use provided test accounts:
- **Staff**: admin@greconnect.edu / Admin123!
- **Teacher**: teacher1@greconnect.edu / Teacher123!
- **Student**: student1@greconnect.edu / Student123!

## Postman Collection

Import this base collection to test all endpoints:

```json
{
  "info": {
    "name": "GreConnect API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

