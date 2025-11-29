# GreConnect Backend - Quick Setup Guide

## ✅ What Has Been Created

Complete Node.js + Express backend with:

### Core Features
- ✅ JWT Authentication
- ✅ User Management (Student, Teacher, Staff roles)
- ✅ Real-time Messaging (Socket.IO)
- ✅ Q&A System
- ✅ Resource Management
- ✅ Calendar & Events
- ✅ Notifications
- ✅ Audio/Video Calls (Agora)
- ✅ File Upload (Cloudinary)

### Technical Stack
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Cloudinary** - Media storage
- **Agora** - Voice/Video calls

### File Structure
```
backend/
├── config/               # Configuration files
│   ├── db.js            # MongoDB connection
│   ├── cloudinary.js    # Cloudinary setup
│   └── agora.js         # Agora token generation
│
├── models/              # MongoDB schemas
│   ├── User.js
│   ├── Conversation.js
│   ├── Message.js
│   ├── Question.js
│   ├── Answer.js
│   ├── Resource.js
│   ├── Event.js
│   ├── Notification.js
│   └── Call.js
│
├── controllers/         # Business logic
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
│
├── routes/              # API endpoints
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
│
├── middleware/          # Express middleware
│   ├── auth.js         # JWT verification
│   ├── roleCheck.js    # Role-based access
│   └── validateRequest.js
│
├── socket/              # Socket.IO handlers
│   └── socketHandler.js
│
├── utils/               # Helper functions
│   ├── generateToken.js
│   └── cloudinaryUpload.js
│
├── scripts/             # Utility scripts
│   ├── seed.js         # Populate test data
│   └── clearDB.js      # Clear database
│
├── server.js            # Main entry point
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── API_DOCUMENTATION.md
└── DEPLOYMENT.md
```

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (macOS)
brew install mongodb-community
brew services start mongodb-community

# Or download from: https://www.mongodb.com/try/download/community
```

**Option B: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string

### Step 3: Get API Keys

#### Cloudinary (Required for image upload)
1. Go to https://cloudinary.com
2. Sign up for free account
3. Get: Cloud Name, API Key, API Secret

#### Agora (Required for video calls)
1. Go to https://www.agora.io
2. Sign up for free account
3. Create project
4. Get: App ID, App Certificate

### Step 4: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
nano .env
```

Update with your values:

```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/greconnect
# OR Atlas: mongodb+srv://username:password@cluster.mongodb.net/greconnect

# JWT (generate random 32+ character string)
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Agora
AGORA_APP_ID=your_app_id
AGORA_APP_CERTIFICATE=your_certificate

# Client URL (your React Native app)
CLIENT_URL=http://localhost:8081
```

### Step 5: Seed Database (Optional but Recommended)

```bash
npm run seed
```

This creates test accounts:
- **Staff**: admin@greconnect.edu / Admin123!
- **Teacher**: teacher1@greconnect.edu / Teacher123!
- **Student**: student1@greconnect.edu / Student123!

### Step 6: Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

Server runs on: **http://localhost:5000**

### Step 7: Test API

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@greconnect.edu",
    "password": "Student123!"
  }'
```

## 📱 Connect Frontend to Backend

### React Native App Configuration

Update your frontend to point to backend:

```typescript
// Create config file: config/api.ts
export const API_URL = 'http://localhost:5000/api';
export const SOCKET_URL = 'http://localhost:5000';

// For iOS simulator
// export const API_URL = 'http://localhost:5000/api';

// For Android emulator
// export const API_URL = 'http://10.0.2.2:5000/api';

// For physical device (use your computer's IP)
// export const API_URL = 'http://192.168.1.100:5000/api';
```

### Example API Usage

```typescript
import axios from 'axios';
import { API_URL } from './config/api';

// Login
const login = async (email: string, password: string) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password
  });
  
  const { token, user } = response.data;
  // Save token for future requests
  return { token, user };
};

// Get questions with auth
const getQuestions = async (token: string) => {
  const response = await axios.get(`${API_URL}/questions`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  return response.data;
};
```

### Socket.IO Connection

```typescript
import io from 'socket.io-client';
import { SOCKET_URL } from './config/api';

const connectSocket = (token: string) => {
  const socket = io(SOCKET_URL, {
    auth: { token }
  });
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('new-message', (message) => {
    console.log('New message:', message);
  });
  
  return socket;
};
```

## 🧪 Testing

### Test Accounts

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Staff | admin@greconnect.edu | Admin123! |
| Teacher | teacher1@greconnect.edu | Teacher123! |
| Student | student1@greconnect.edu | Student123! |

### Test Scenarios

#### 1. Authentication Flow
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "role": "student"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student1@greconnect.edu",
    "password": "Student123!"
  }'
```

#### 2. Create Question
```bash
curl -X POST http://localhost:5000/api/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "How to use MongoDB?",
    "content": "I need help with MongoDB queries",
    "tags": ["mongodb", "database"]
  }'
```

#### 3. Get Resources
```bash
curl http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Test Cases Coverage

This backend supports all 55 test cases from TEST_CASES.md:

✅ **Authentication (6 tests)**
- Registration, Login, Pending approval, Password reset

✅ **User Management (7 tests)**
- View users, Edit, Delete, Approve/Reject pending

✅ **Messaging (6 tests)**
- Send messages, Attachments, Real-time sync, Delete

✅ **Q&A System (7 tests)**
- Ask questions, Answer, Upvote, Search, Ban/Delete

✅ **Resources (5 tests)**
- Upload, View, Download, Filter, Delete

✅ **Calendar & Events (5 tests)**
- Create events, View, Filter, Recurring events

✅ **Notifications (4 tests)**
- Receive, Mark as read, In-app popup

✅ **RBAC (6 tests)**
- Role-based access control for all features

✅ **Integration (4 tests)**
- End-to-end flows

✅ **Performance (5 tests)**
- Query optimization, Real-time sync

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ Input validation
- ✅ Role-based access control
- ✅ SQL injection prevention (Mongoose)

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start with auto-reload

# Production
npm start                # Start server

# Database
npm run seed             # Populate test data
npm run clear            # Clear all data

# Testing
npm test                 # Run tests

# Monitoring (after installing PM2)
pm2 start server.js --name greconnect-api
pm2 logs greconnect-api
pm2 status
```

## 📝 API Endpoints Summary

### Public
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login
- POST `/api/auth/forgot-password` - Reset password

### Authenticated (All users)
- GET `/api/auth/profile` - Get profile
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/change-password` - Change password

### Conversations & Messages
- GET `/api/conversations` - List conversations
- POST `/api/conversations` - Create conversation
- GET `/api/messages/:conversationId` - Get messages
- POST `/api/messages` - Send message

### Questions & Answers
- GET `/api/questions` - List questions
- POST `/api/questions` - Ask question
- GET `/api/answers/question/:id` - Get answers
- POST `/api/answers/question/:id` - Post answer
- POST `/api/answers/:id/upvote` - Upvote answer

### Resources
- GET `/api/resources` - List resources
- POST `/api/resources` - Upload resource
- GET `/api/resources/:id` - Get resource
- POST `/api/resources/:id/download` - Download

### Events (Teacher/Staff)
- GET `/api/events` - List events
- POST `/api/events` - Create event

### User Management (Staff)
- GET `/api/users` - List users
- GET `/api/users/pending` - Pending users
- POST `/api/users/:id/approve` - Approve
- POST `/api/users/:id/reject` - Reject

See `API_DOCUMENTATION.md` for complete reference.

## 🚨 Troubleshooting

### MongoDB Connection Error
```bash
# Check MongoDB is running
mongosh

# Or check service
brew services list
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
PORT=5001
```

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Cannot Connect from Mobile Device
```bash
# Use computer's IP address
ipconfig getifaddr en0  # macOS
ifconfig                # Linux

# Update CLIENT_URL in .env
CLIENT_URL=http://192.168.1.100:8081
```

## 📚 Documentation

- `README.md` - Project overview
- `API_DOCUMENTATION.md` - Complete API reference
- `DEPLOYMENT.md` - Production deployment guide
- `SETUP_GUIDE.md` - This file

## 🎯 Next Steps

1. ✅ Backend is ready
2. 🔄 Update frontend to use this API
3. ✅ Test all features
4. 🚀 Deploy to production

## 💡 Tips

- Use Postman or Insomnia to test APIs
- Check server logs for debugging
- Use MongoDB Compass to view database
- Enable MongoDB logging for queries
- Use PM2 for production deployment

## 📞 Support

For issues:
1. Check logs: `npm run dev`
2. Verify .env configuration
3. Test with curl commands
4. Check MongoDB connection
5. Review API_DOCUMENTATION.md

---

**Backend is complete and ready to use! 🎉**

