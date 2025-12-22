# GreConnect Postman Collection

This folder contains the Postman collection and environment files for testing the GreConnect API.

## Files

- `GreConnect.postman_collection.json` - Complete API collection with all endpoints
- `GreConnect.postman_environment.json` - Environment variables for the collection

## How to Import

### Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Drag and drop `GreConnect.postman_collection.json` or click "Upload Files"
4. The collection will appear in your Collections sidebar

### Import Environment

1. Click the **Environments** tab (left sidebar)
2. Click **Import** button
3. Select `GreConnect.postman_environment.json`
4. The environment will appear in your Environments list

### Activate Environment

1. Click the environment dropdown (top right corner)
2. Select "GreConnect Environment"

## Collection Structure

```
GreConnect API/
├── Auth/
│   ├── Register
│   ├── Login
│   ├── Forgot Password
│   ├── Get Profile
│   ├── Update Profile
│   ├── Change Password
│   └── Update FCM Token
├── Users/
│   ├── Get All Users (Staff)
│   ├── Get Pending Users (Staff)
│   ├── Get User by ID
│   ├── Update User (Staff)
│   ├── Toggle User Status (Staff)
│   ├── Delete User (Staff)
│   ├── Approve User (Staff)
│   ├── Reject User (Staff)
│   ├── Update FCM Token
│   └── Remove FCM Token
├── Conversations/
│   ├── Get My Conversations
│   ├── Search Conversations
│   ├── Get Conversation by ID
│   ├── Create Direct Conversation
│   ├── Create Group Conversation
│   └── Delete Conversation
├── Messages/
│   ├── Get Messages
│   ├── Send Text Message
│   ├── Send Message with Attachment
│   ├── Delete Message
│   └── Mark Messages as Read
├── Calls/
│   ├── Initiate Call
│   ├── Join Call
│   ├── End Call
│   └── Get Call History
├── Questions/
│   ├── Get All Questions
│   ├── Get Questions with Filters
│   ├── Get Question by ID
│   ├── Create Question
│   ├── Update Question
│   ├── Delete Question (Teacher/Staff)
│   └── Toggle Question Status (Teacher/Staff)
├── Answers/
│   ├── Get Answers for Question
│   ├── Create Answer
│   ├── Update Answer
│   ├── Delete Answer
│   └── Toggle Upvote
├── Resources/
│   ├── Get All Resources
│   ├── Get Resource by ID
│   ├── Create Resource
│   ├── Update Resource
│   ├── Delete Resource
│   └── Increment Download Count
├── Events/
│   ├── Get All Events
│   ├── Get Event by ID
│   ├── Create Event (Teacher/Staff)
│   ├── Update Event (Teacher/Staff)
│   └── Delete Event (Teacher/Staff)
├── Notifications/
│   ├── Get My Notifications
│   ├── Get Unread Count
│   ├── Create Notification
│   ├── Mark as Read
│   ├── Mark All as Read
│   └── Delete Notification
└── Health Check/
    └── Health Check
```

## Getting Started

### 1. Start the Server

```bash
npm run dev
```

### 2. Seed Database (Optional)

```bash
npm run seed
```

### 3. Login First

1. Run the **Login** request in the Auth folder
2. The test script will automatically save the `accessToken` to environment variables
3. All subsequent requests will use this token for authentication

### Default Test Account

```json
{
  "email": "staff@greenwich.edu",
  "password": "password123"
}
```

## Environment Variables

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `baseUrl` | API base URL (default: http://localhost:5000/api) | No |
| `accessToken` | JWT token for authentication | Yes (on login) |
| `userId` | Current user ID | Yes (on login) |
| `conversationId` | Last accessed conversation ID | Yes |
| `messageId` | Last accessed message ID | Yes |
| `questionId` | Last accessed question ID | Yes |
| `answerId` | Last accessed answer ID | Yes |
| `resourceId` | Last accessed resource ID | Yes |
| `eventId` | Last accessed event ID | Yes |
| `notificationId` | Last accessed notification ID | Yes |
| `callId` | Last accessed call ID | Yes |
| `pendingUserId` | Pending user ID for approval | Yes |

## Test Scripts

Each request includes test scripts that:

1. ✅ Verify correct status codes
2. ✅ Validate response structure
3. ✅ Auto-save IDs to environment variables

## Role-Based Access

| Role | Permissions |
|------|-------------|
| **student** | Basic CRUD on own resources, Q&A, messaging |
| **teacher** | + Create events, manage questions |
| **staff** | + User management, approve/reject users |

## Tips

1. **Run Login first** to get the access token
2. **Use Collection Runner** to run all tests at once
3. **Check Console** for detailed request/response logs
4. **Update baseUrl** if server runs on different port

