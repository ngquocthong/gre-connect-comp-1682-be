# Backend Architecture

## Overview
The backend follows a layered architecture pattern with clear separation of concerns:
- **Controllers**: Handle HTTP requests/responses
- **Services**: Contain business logic
- **Models**: Define data structures and database schemas
- **Middleware**: Handle authentication, validation, and authorization
- **Utils**: Provide utility functions
- **Config**: Manage configuration settings

## Folder Structure

```
backend/
├── config/          # Configuration files
│   ├── agora.js
│   ├── cloudinary.js
│   ├── db.js
│   └── firebase.js
├── controllers/     # HTTP request handlers (thin layer)
│   ├── answerController.js
│   ├── authController.js
│   ├── callController.js
│   ├── conversationController.js
│   ├── eventController.js
│   ├── messageController.js
│   ├── notificationController.js
│   ├── questionController.js
│   ├── resourceController.js
│   └── userController.js
├── services/        # Business logic layer
│   ├── answerService.js
│   ├── callService.js
│   ├── conversationService.js
│   ├── eventService.js
│   ├── fcmService.js
│   ├── messageService.js
│   ├── notificationService.js
│   ├── questionService.js
│   ├── resourceService.js
│   └── userService.js
├── models/          # Database schemas
│   ├── Answer.js
│   ├── Call.js
│   ├── Conversation.js
│   ├── Event.js
│   ├── Message.js
│   ├── Notification.js
│   ├── Question.js
│   ├── Resource.js
│   └── User.js
├── middleware/      # Request processing middleware
│   ├── auth.js
│   ├── roleCheck.js
│   └── validateRequest.js
├── routes/          # API route definitions
│   ├── answers.js
│   ├── auth.js
│   ├── calls.js
│   ├── conversations.js
│   ├── events.js
│   ├── messages.js
│   ├── notifications.js
│   ├── questions.js
│   ├── resources.js
│   └── users.js
├── utils/           # Utility functions
│   ├── cloudinaryUpload.js
│   ├── fcmNotification.js (deprecated - use services/fcmService.js)
│   └── generateToken.js
├── socket/          # WebSocket handlers
│   └── socketHandler.js
└── server.js        # Application entry point
```

## Architecture Layers

### 1. Controllers Layer
**Purpose**: Handle HTTP request/response cycle

**Responsibilities**:
- Validate request parameters
- Extract data from request
- Call appropriate service methods
- Format and send responses
- Handle HTTP status codes
- Convert service errors to HTTP errors

**Example**:
```javascript
const userService = require('../services/userService');

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const users = await userService.getUsers({ role, search });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

### 2. Services Layer
**Purpose**: Contain all business logic

**Responsibilities**:
- Implement business rules
- Orchestrate model operations
- Handle transactions
- Throw meaningful errors
- Maintain data integrity

**Example**:
```javascript
class UserService {
  async getUsers(filters = {}) {
    const { role, search } = filters;
    let query = { isPending: false };
    
    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    return await User.find(query).select('-password');
  }
}
```

### 3. Models Layer
**Purpose**: Define data structure and database interaction

**Responsibilities**:
- Define MongoDB schemas
- Add validation rules
- Define indexes
- Add virtual fields and methods
- Handle pre/post hooks

### 4. Routes Layer
**Purpose**: Define API endpoints

**Responsibilities**:
- Map HTTP methods to controller functions
- Apply middleware (auth, validation, role checks)
- Group related endpoints

## Design Patterns

### 1. Service Layer Pattern
All business logic is encapsulated in service classes, making it:
- **Testable**: Easy to unit test without HTTP layer
- **Reusable**: Services can be called from controllers, Socket.IO, or scheduled jobs
- **Maintainable**: Clear separation of concerns

### 2. Singleton Pattern
Services are exported as singleton instances:
```javascript
class UserService { ... }
module.exports = new UserService();
```

### 3. Error Handling Pattern
Services throw errors, controllers catch and convert to HTTP responses:
```javascript
// Service
if (!user) {
  throw new Error('User not found');
}

// Controller
catch (error) {
  if (error.message === 'User not found') {
    return res.status(404).json({ message: error.message });
  }
  res.status(500).json({ message: error.message });
}
```

## Data Flow

```
Client Request
    ↓
Route (with middleware)
    ↓
Controller (validates, extracts data)
    ↓
Service (business logic)
    ↓
Model (database operations)
    ↓
Service (processes result)
    ↓
Controller (formats response)
    ↓
Client Response
```

## Service Descriptions

### UserService
Manages user operations: CRUD, authentication, FCM tokens, user approval/rejection.

### NotificationService
Handles in-app notifications with automatic FCM push notification integration.

### FCMService
Manages Firebase Cloud Messaging for push notifications to mobile devices.

### ConversationService
Manages chat conversations (direct and group).

### MessageService
Handles message operations within conversations.

### QuestionService
Manages Q&A forum questions with answer count aggregation.

### AnswerService
Handles answers to questions, including upvote system.

### ResourceService
Manages educational resources (documents, videos, links).

### EventService
Handles calendar events with role-based access control.

### CallService
Manages voice/video calls with Agora integration.

## Best Practices

### 1. Keep Controllers Thin
Controllers should only:
- Extract data from request
- Call service methods
- Return formatted responses

### 2. Services Contain Business Logic
All validation, processing, and business rules go in services.

### 3. Error Handling
- Services throw descriptive errors
- Controllers catch and convert to appropriate HTTP status codes

### 4. Async/Await
Use async/await for all asynchronous operations.

### 5. Database Queries
All database queries should be in services, never in controllers.

### 6. Reusability
Services can be called from:
- Controllers (HTTP endpoints)
- Socket handlers (WebSocket events)
- Scheduled jobs
- Other services

## Testing Strategy

### Unit Tests
Test services in isolation:
```javascript
describe('UserService', () => {
  it('should get users with filters', async () => {
    const users = await userService.getUsers({ role: 'student' });
    expect(users).toBeDefined();
  });
});
```

### Integration Tests
Test controllers with mocked services:
```javascript
describe('GET /api/users', () => {
  it('should return users list', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(200);
  });
});
```

## Security Considerations

- Authentication middleware protects routes
- Role-based access control in services
- Input validation at controller level
- SQL/NoSQL injection prevention via Mongoose
- XSS protection via sanitization
- CORS configuration
- Rate limiting
- JWT token management

## Performance Optimization

- Database indexes on frequently queried fields
- Lean queries for read-only operations
- Pagination for large datasets
- Caching strategies (future)
- Connection pooling

## Future Enhancements

- Add request/response logging service
- Implement caching layer (Redis)
- Add event-driven architecture (event bus)
- Implement repository pattern for data access
- Add API versioning
- Implement GraphQL layer
- Add comprehensive test coverage
- Add API documentation with Swagger/OpenAPI

