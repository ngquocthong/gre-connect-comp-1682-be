# GreConnect Backend API

Node.js + Express backend for the GreConnect mobile application.

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.IO** - Real-time messaging
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Media storage
- **Agora** - Voice/video calls

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Cloudinary account
- Agora account

### Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your credentials:
```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/greconnect

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate

CLIENT_URL=http://localhost:8081
```

5. Start development server:
```bash
npm run dev
```

For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password
- `PUT /api/auth/fcm-token` - Update FCM token

### Users (Staff only)
- `GET /api/users` - Get all users
- `GET /api/users/pending` - Get pending users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PATCH /api/users/:id/toggle-status` - Toggle user status
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/approve` - Approve pending user
- `POST /api/users/:id/reject` - Reject pending user

### Conversations
- `GET /api/conversations` - Get user conversations
- `GET /api/conversations/search` - Search conversations
- `GET /api/conversations/:id` - Get conversation
- `POST /api/conversations` - Create conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Messages
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/read` - Mark messages as read

### Questions
- `GET /api/questions` - Get all questions
- `GET /api/questions/:id` - Get question
- `POST /api/questions` - Create question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question (Teacher/Staff)
- `PATCH /api/questions/:id/toggle-status` - Ban/unban question (Teacher/Staff)

### Answers
- `GET /api/answers/question/:questionId` - Get answers
- `POST /api/answers/question/:questionId` - Create answer
- `PUT /api/answers/:id` - Update answer
- `DELETE /api/answers/:id` - Delete answer
- `POST /api/answers/:id/upvote` - Toggle upvote

### Resources
- `GET /api/resources` - Get all resources
- `GET /api/resources/:id` - Get resource
- `POST /api/resources` - Upload resource
- `PUT /api/resources/:id` - Update resource
- `DELETE /api/resources/:id` - Delete resource
- `POST /api/resources/:id/download` - Increment download count

### Events (Teacher/Staff)
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event
- `POST /api/events` - Create event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread-count` - Get unread count
- `POST /api/notifications` - Create notification
- `POST /api/notifications/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### Calls
- `POST /api/calls/initiate` - Initiate call
- `POST /api/calls/:id/join` - Join call
- `POST /api/calls/:id/end` - End call
- `GET /api/calls/history/:conversationId` - Get call history

## Socket.IO Events

### Client -> Server
- `join-conversation` - Join conversation room
- `leave-conversation` - Leave conversation room
- `send-message` - Send message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `message-read` - Mark message as read
- `call-initiate` - Initiate call
- `call-accept` - Accept incoming call
- `call-reject` - Reject incoming call
- `call-end` - End call

### Server -> Client
- `new-message` - New message received
- `conversation-updated` - Conversation metadata updated
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `message-read-update` - Message read status updated
- `incoming-call` - Incoming call
- `call-accepted` - Call accepted
- `call-rejected` - Call rejected
- `call-ended` - Call ended

## Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   ├── cloudinary.js      # Cloudinary config
│   └── agora.js           # Agora token generation
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── conversationController.js
│   ├── messageController.js
│   ├── questionController.js
│   ├── answerController.js
│   ├── resourceController.js
│   ├── eventController.js
│   ├── notificationController.js
│   └── callController.js
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── roleCheck.js       # Role-based access control
│   └── validateRequest.js # Input validation
├── models/
│   ├── User.js
│   ├── Conversation.js
│   ├── Message.js
│   ├── Question.js
│   ├── Answer.js
│   ├── Resource.js
│   ├── Event.js
│   ├── Notification.js
│   └── Call.js
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── conversations.js
│   ├── messages.js
│   ├── questions.js
│   ├── answers.js
│   ├── resources.js
│   ├── events.js
│   ├── notifications.js
│   └── calls.js
├── socket/
│   └── socketHandler.js   # Socket.IO event handlers
├── utils/
│   ├── generateToken.js   # JWT token generation
│   └── cloudinaryUpload.js # Cloudinary upload helper
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── server.js              # Entry point
```

## Role-Based Access Control

### Student
- Create/edit own questions
- Answer questions
- Upload/edit own resources
- View events
- Send messages
- Make calls

### Teacher
- All student permissions
- Create events
- Manage Q&A (ban/delete questions)
- Upload resources

### Staff
- All permissions
- User management
- Approve/reject registrations
- Full CRUD on all resources

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Helmet.js security headers
- CORS configuration
- Input validation
- Role-based access control

## Testing

Run tests:
```bash
npm test
```

## Deployment

1. Set `NODE_ENV=production`
2. Use secure MongoDB connection (MongoDB Atlas)
3. Set strong JWT secret
4. Configure Cloudinary for production
5. Setup Agora for production
6. Use process manager (PM2)

```bash
npm install -g pm2
pm2 start server.js --name greconnect-api
```

## Support

For issues and questions, please contact the development team.

