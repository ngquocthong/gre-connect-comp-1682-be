# GreConnect API - Frontend Integration Guide

Use this document as a prompt for AI to generate React Native code.

## Base Configuration

```typescript
const API_BASE_URL = "https://gre-be.iotek.dev/api";
```

---

## TypeScript Types/Interfaces

### User Types

```typescript
type UserRole = "student" | "teacher" | "staff";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profilePicture: string;
  bio: string;
  role: UserRole;
  isActive: boolean;
  isPending: boolean;
  lastActive: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role?: UserRole;
}
```

### Conversation Types

```typescript
type ConversationType = "direct" | "group";

interface Conversation {
  _id: string;
  name?: string;
  type: ConversationType;
  participants: User[];
  lastMessage: string;
  lastMessageTime: string; // ISO date string
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateConversationRequest {
  participantIds: string[];
  name?: string; // Required for group
  type: ConversationType;
}
```

### Message Types

```typescript
type MessageType = "text" | "image" | "file" | "system";

interface Attachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

interface Message {
  _id: string;
  conversationId: string;
  senderId: User;
  content: string;
  type: MessageType;
  isDeleted: boolean;
  attachments: Attachment[];
  readBy: string[]; // User IDs
  createdAt: string;
  updatedAt: string;
}

interface SendMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachments?: Attachment[];
}
```

### Question Types

```typescript
interface Question {
  _id: string;
  userId: User;
  title: string;
  content: string;
  tags: string[];
  views: number;
  isActive: boolean;
  attachments: Attachment[];
  answersCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateQuestionRequest {
  title: string;
  content: string;
  tags?: string[];
  attachments?: Attachment[];
}
```

### Answer Types

```typescript
interface Answer {
  _id: string;
  questionId: string;
  authorId: User;
  content: string;
  reactions: string[]; // User IDs who reacted
  upvotes: number;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

interface CreateAnswerRequest {
  content: string;
  attachments?: Attachment[];
}
```

### Resource Types

```typescript
type ResourceType = "document" | "video" | "link";

interface Resource {
  _id: string;
  uploadedBy: User;
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  thumbnail?: string;
  tags: string[];
  downloads: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateResourceRequest {
  title: string;
  description: string;
  type: ResourceType;
  url: string;
  thumbnail?: string;
  tags?: string[];
}
```

### Event Types

```typescript
type EventType = "academic" | "social" | "sports" | "other";
type Recurrence = "none" | "daily" | "weekly" | "monthly";

interface Event {
  _id: string;
  createdBy: User;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  location?: string;
  type: EventType;
  color: string; // Hex color
  recurrence: Recurrence;
  participants: User[];
  createdAt: string;
  updatedAt: string;
}

interface CreateEventRequest {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  type?: EventType;
  color?: string;
  recurrence?: Recurrence;
}
```

### Notification Types

```typescript
type NotificationType =
  | "message"
  | "announcement"
  | "event"
  | "assignment"
  | "system";

interface Notification {
  _id: string;
  recipientId: string;
  senderId?: User;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  avatar?: string;
  route?: string;
  createdAt: string;
  updatedAt: string;
}

interface UnreadCountResponse {
  count: number;
}
```

### Call Types

```typescript
type CallType = "audio" | "video";
type CallStatus =
  | "initiated"
  | "ringing"
  | "ongoing"
  | "ended"
  | "missed"
  | "declined";

interface Call {
  _id: string;
  conversationId: string;
  callerId: User;
  type: CallType;
  status: CallStatus;
  participants: User[];
  duration?: number; // seconds
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface InitiateCallRequest {
  conversationId: string;
  type: CallType;
}

interface InitiateCallResponse {
  call: Call;
  agoraToken: string;
  channelName: string;
}
```

---

## API Endpoints

### Auth Endpoints

```typescript
// POST /api/auth/register
// Request: RegisterRequest
// Response: { message: string, user: User }

// POST /api/auth/login
// Request: LoginRequest
// Response: AuthResponse

// GET /api/auth/profile
// Headers: Authorization: Bearer <token>
// Response: User

// PUT /api/auth/profile
// Headers: Authorization: Bearer <token>
// Request: { firstName?: string, lastName?: string, bio?: string, profilePicture?: string }
// Response: User

// PUT /api/auth/change-password
// Headers: Authorization: Bearer <token>
// Request: { currentPassword: string, newPassword: string }
// Response: { message: string }

// PUT /api/auth/fcm-token
// Headers: Authorization: Bearer <token>
// Request: { fcmToken: string }
// Response: { message: string }
```

### Users Endpoints (Staff only for most)

```typescript
// GET /api/users
// Headers: Authorization: Bearer <token>
// Query: ?role=student|teacher|staff&search=<term>
// Response: User[]

// GET /api/users/pending
// Headers: Authorization: Bearer <token>
// Response: User[]

// GET /api/users/:id
// Headers: Authorization: Bearer <token>
// Response: User

// PUT /api/users/:id (Staff only)
// Headers: Authorization: Bearer <token>
// Request: UpdateUserRequest
// Response: User
// Errors: 400 (Email/Username already in use), 404 (User not found)

// PATCH /api/users/:id/toggle-status (Staff only)
// Headers: Authorization: Bearer <token>
// Response: User

// DELETE /api/users/:id (Staff only)
// Headers: Authorization: Bearer <token>
// Response: { message: string }
// Errors: 400 (Cannot delete yourself), 404 (User not found)

// POST /api/users/:id/approve (Staff only)
// Headers: Authorization: Bearer <token>
// Response: { message: string, user: User }

// POST /api/users/:id/reject (Staff only)
// Headers: Authorization: Bearer <token>
// Response: { message: string }

// POST /api/users/fcm-token
// Headers: Authorization: Bearer <token>
// Request: { fcmToken: string }
// Response: { message: string, user: User }

// DELETE /api/users/fcm-token
// Headers: Authorization: Bearer <token>
// Response: { message: string, user: User }
```

```typescript
// UpdateUserRequest - Staff can update any user
interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string; // Must be unique
  username?: string; // Must be unique
  bio?: string;
  profilePicture?: string;
  role?: UserRole; // Staff cannot change their own role
  isActive?: boolean;
}
```

### Conversations Endpoints

```typescript
// GET /api/conversations
// Headers: Authorization: Bearer <token>
// Response: Conversation[]

// GET /api/conversations/search?query=<searchTerm>
// Headers: Authorization: Bearer <token>
// Response: Conversation[]

// GET /api/conversations/:id
// Headers: Authorization: Bearer <token>
// Response: Conversation

// POST /api/conversations
// Headers: Authorization: Bearer <token>
// Request: CreateConversationRequest
// Response: Conversation

// DELETE /api/conversations/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }
```

### Messages Endpoints

```typescript
// GET /api/messages/:conversationId
// Headers: Authorization: Bearer <token>
// Response: Message[]

// POST /api/messages
// Headers: Authorization: Bearer <token>
// Request: SendMessageRequest
// Response: Message

// DELETE /api/messages/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }

// POST /api/messages/read
// Headers: Authorization: Bearer <token>
// Request: { messageIds: string[] }
// Response: { message: string }
```

### Questions Endpoints

```typescript
// GET /api/questions
// Headers: Authorization: Bearer <token>
// Query: ?search=<term>&tags=<tag>&status=<active|inactive>
// Response: Question[]

// GET /api/questions/:id
// Headers: Authorization: Bearer <token>
// Response: Question

// POST /api/questions
// Headers: Authorization: Bearer <token>
// Request: CreateQuestionRequest
// Response: Question

// PUT /api/questions/:id
// Headers: Authorization: Bearer <token>
// Request: CreateQuestionRequest
// Response: Question

// DELETE /api/questions/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }
```

### Answers Endpoints

```typescript
// GET /api/answers/question/:questionId
// Headers: Authorization: Bearer <token>
// Response: Answer[]

// POST /api/answers/question/:questionId
// Headers: Authorization: Bearer <token>
// Request: CreateAnswerRequest
// Response: Answer

// PUT /api/answers/:id
// Headers: Authorization: Bearer <token>
// Request: { content: string }
// Response: Answer

// DELETE /api/answers/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }

// POST /api/answers/:id/upvote
// Headers: Authorization: Bearer <token>
// Response: Answer
```

### Resources Endpoints

```typescript
// GET /api/resources
// Headers: Authorization: Bearer <token>
// Response: Resource[]

// GET /api/resources/:id
// Headers: Authorization: Bearer <token>
// Response: Resource

// POST /api/resources
// Headers: Authorization: Bearer <token>
// Request: CreateResourceRequest
// Response: Resource

// PUT /api/resources/:id
// Headers: Authorization: Bearer <token>
// Request: Partial<CreateResourceRequest>
// Response: Resource

// DELETE /api/resources/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }

// POST /api/resources/:id/download
// Headers: Authorization: Bearer <token>
// Response: Resource
```

### Events Endpoints

```typescript
// GET /api/events
// Headers: Authorization: Bearer <token>
// Response: Event[]

// GET /api/events/:id
// Headers: Authorization: Bearer <token>
// Response: Event

// POST /api/events
// Headers: Authorization: Bearer <token>
// Request: CreateEventRequest
// Response: Event

// PUT /api/events/:id
// Headers: Authorization: Bearer <token>
// Request: Partial<CreateEventRequest>
// Response: Event

// DELETE /api/events/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }
```

### Notifications Endpoints

```typescript
// GET /api/notifications
// Headers: Authorization: Bearer <token>
// Response: Notification[]

// GET /api/notifications/unread-count
// Headers: Authorization: Bearer <token>
// Response: UnreadCountResponse

// POST /api/notifications/read
// Headers: Authorization: Bearer <token>
// Request: { notificationIds: string[] }
// Response: { message: string }

// POST /api/notifications/read-all
// Headers: Authorization: Bearer <token>
// Response: { message: string }

// DELETE /api/notifications/:id
// Headers: Authorization: Bearer <token>
// Response: { message: string }
```

### Calls Endpoints

```typescript
// POST /api/calls/initiate
// Headers: Authorization: Bearer <token>
// Request: InitiateCallRequest
// Response: InitiateCallResponse

// POST /api/calls/:id/join
// Headers: Authorization: Bearer <token>
// Response: { call: Call, agoraToken: string }

// POST /api/calls/:id/end
// Headers: Authorization: Bearer <token>
// Response: Call

// GET /api/calls/history/:conversationId
// Headers: Authorization: Bearer <token>
// Response: Call[]
```

---

## Socket.IO Events

```typescript
// Connection
const socket = io(API_BASE_URL.replace("/api", ""), {
  auth: { token: accessToken },
});

// Chat Events
socket.emit("join-conversation", conversationId);
socket.emit("leave-conversation", conversationId);
socket.emit("send-message", { conversationId, content, type, attachments });
socket.emit("typing-start", conversationId);
socket.emit("typing-stop", conversationId);
socket.emit("message-read", { messageId, conversationId });

socket.on("new-message", (message: Message) => {});
socket.on("conversation-updated", (conversation: Conversation) => {});
socket.on("user-typing", ({ userId, username }) => {});
socket.on("user-stopped-typing", ({ userId }) => {});
socket.on("message-read-update", ({ messageId, userId }) => {});

// Call Events
socket.emit("call-initiate", { conversationId, type, participants });
socket.emit("call-accept", { conversationId, callerId });
socket.emit("call-reject", { conversationId, callerId });
socket.emit("call-end", { conversationId, participants });

socket.on("incoming-call", ({ conversationId, type, caller }) => {});
socket.on("call-accepted", ({ conversationId, acceptedBy }) => {});
socket.on("call-rejected", ({ conversationId, rejectedBy }) => {});
socket.on("call-ended", ({ conversationId, endedBy }) => {});
```

---

## Example React Native API Service

```typescript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://gre-be.iotek.dev/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (data: LoginRequest) => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegisterRequest) => api.post("/auth/register", data),
  getProfile: () => api.get<User>("/auth/profile"),
  updateProfile: (data: Partial<User>) => api.put<User>("/auth/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/change-password", data),
};

// Users API (Staff management)
export const usersAPI = {
  getAll: (params?: { role?: string; search?: string }) =>
    api.get<User[]>("/users", { params }),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getPending: () => api.get<User[]>("/users/pending"),
  update: (id: string, data: UpdateUserRequest) =>
    api.put<User>(`/users/${id}`, data),
  toggleStatus: (id: string) => api.patch<User>(`/users/${id}/toggle-status`),
  delete: (id: string) => api.delete(`/users/${id}`),
  approve: (id: string) => api.post(`/users/${id}/approve`),
  reject: (id: string) => api.post(`/users/${id}/reject`),
  updateFcmToken: (fcmToken: string) =>
    api.post("/users/fcm-token", { fcmToken }),
  removeFcmToken: () => api.delete("/users/fcm-token"),
};

// Conversations API
export const conversationsAPI = {
  getAll: () => api.get<Conversation[]>("/conversations"),
  getById: (id: string) => api.get<Conversation>(`/conversations/${id}`),
  create: (data: CreateConversationRequest) =>
    api.post<Conversation>("/conversations", data),
  delete: (id: string) => api.delete(`/conversations/${id}`),
  search: (query: string) =>
    api.get<Conversation[]>(`/conversations/search?query=${query}`),
};

// Messages API
export const messagesAPI = {
  getByConversation: (conversationId: string) =>
    api.get<Message[]>(`/messages/${conversationId}`),
  send: (data: SendMessageRequest) => api.post<Message>("/messages", data),
  delete: (id: string) => api.delete(`/messages/${id}`),
  markAsRead: (messageIds: string[]) =>
    api.post("/messages/read", { messageIds }),
};

// Questions API
export const questionsAPI = {
  getAll: (params?: { search?: string; tags?: string }) =>
    api.get<Question[]>("/questions", { params }),
  getById: (id: string) => api.get<Question>(`/questions/${id}`),
  create: (data: CreateQuestionRequest) =>
    api.post<Question>("/questions", data),
  update: (id: string, data: Partial<CreateQuestionRequest>) =>
    api.put<Question>(`/questions/${id}`, data),
  delete: (id: string) => api.delete(`/questions/${id}`),
};

// Answers API
export const answersAPI = {
  getByQuestion: (questionId: string) =>
    api.get<Answer[]>(`/answers/question/${questionId}`),
  create: (questionId: string, data: CreateAnswerRequest) =>
    api.post<Answer>(`/answers/question/${questionId}`, data),
  update: (id: string, content: string) =>
    api.put<Answer>(`/answers/${id}`, { content }),
  delete: (id: string) => api.delete(`/answers/${id}`),
  toggleUpvote: (id: string) => api.post<Answer>(`/answers/${id}/upvote`),
};

// Resources API
export const resourcesAPI = {
  getAll: () => api.get<Resource[]>("/resources"),
  getById: (id: string) => api.get<Resource>(`/resources/${id}`),
  create: (data: CreateResourceRequest) =>
    api.post<Resource>("/resources", data),
  update: (id: string, data: Partial<CreateResourceRequest>) =>
    api.put<Resource>(`/resources/${id}`, data),
  delete: (id: string) => api.delete(`/resources/${id}`),
  download: (id: string) => api.post<Resource>(`/resources/${id}/download`),
};

// Events API
export const eventsAPI = {
  getAll: () => api.get<Event[]>("/events"),
  getById: (id: string) => api.get<Event>(`/events/${id}`),
  create: (data: CreateEventRequest) => api.post<Event>("/events", data),
  update: (id: string, data: Partial<CreateEventRequest>) =>
    api.put<Event>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get<Notification[]>("/notifications"),
  getUnreadCount: () =>
    api.get<UnreadCountResponse>("/notifications/unread-count"),
  markAsRead: (notificationIds: string[]) =>
    api.post("/notifications/read", { notificationIds }),
  markAllAsRead: () => api.post("/notifications/read-all"),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Calls API
export const callsAPI = {
  initiate: (data: InitiateCallRequest) =>
    api.post<InitiateCallResponse>("/calls/initiate", data),
  join: (id: string) => api.post(`/calls/${id}/join`),
  end: (id: string) => api.post<Call>(`/calls/${id}/end`),
  getHistory: (conversationId: string) =>
    api.get<Call[]>(`/calls/history/${conversationId}`),
};

export default api;
```

---

## Prompt for AI (React Native)

When generating React Native code, use this prompt:

```
I'm building a React Native app with Expo that connects to the GreConnect API.

API Base URL: https://gre-be.iotek.dev/api
Authentication: Bearer token in Authorization header
Storage: AsyncStorage for token

Please use the types and API structure defined in API_TYPES_FOR_FRONTEND.md

Requirements:
1. Use axios for HTTP requests
2. Use socket.io-client for real-time features
3. Handle loading and error states
4. Store auth token in AsyncStorage
5. Use TypeScript for type safety
```
