# Frontend AI Chat Integration Prompt

## Prompt for Frontend Developer / AI Assistant

```
Tôi cần implement tính năng AI Chat trong ứng dụng React Native (hoặc React) cho GreConnect. 
Backend đã được triển khai với Dify AI integration. Dưới đây là thông tin chi tiết:

## 1. API Endpoints

### Base URL: `{API_BASE_URL}/api/ai-chat`

### Get or Create AI Conversation (Luôn có sẵn cho mỗi user)
```
GET /api/ai-chat
Authorization: Bearer {accessToken}

Response:
{
  "conversation": {
    "_id": "string",
    "title": "string",
    "difyConversationId": "string | null",
    "messages": [
      {
        "_id": "string",
        "role": "user" | "assistant",
        "content": "string",
        "difyMessageId": "string | null",
        "metadata": { ... },
        "feedback": { "rating": "like" | "dislike" | null },
        "createdAt": "ISO date"
      }
    ],
    "isPinned": boolean,
    "lastMessageAt": "ISO date",
    "metadata": {
      "totalMessages": number,
      "totalTokensUsed": number
    }
  },
  "aiServiceAvailable": boolean
}
```

### Send Message to AI
```
POST /api/ai-chat/conversations/{conversationId}/messages
Authorization: Bearer {accessToken}
Content-Type: application/json

Body:
{
  "message": "string (required)",
  "inputs": { } // optional - additional context
}

Response:
{
  "conversation": {
    "_id": "string",
    "title": "string",
    "messages": [...], // last 2 messages
    "lastMessageAt": "ISO date"
  },
  "aiResponse": {
    "answer": "string",
    "messageId": "string",
    "metadata": { ... }
  },
  "aiServiceAvailable": boolean
}
```

### Streaming Response (SSE) - For real-time typing effect
```
POST /api/ai-chat/conversations/{conversationId}/messages/stream
Authorization: Bearer {accessToken}
Content-Type: application/json

Body: same as above

Response: Server-Sent Events
data: {"type": "chunk", "chunk": "partial text", "fullAnswer": "accumulated text"}
data: {"type": "complete", "answer": "full answer", "messageId": "..."}
data: {"type": "error", "error": "error message"}
```

### Other Endpoints
- GET /api/ai-chat/conversations - List all AI conversations
- POST /api/ai-chat/conversations - Create new conversation
- PUT /api/ai-chat/conversations/{id} - Update title/pin
- DELETE /api/ai-chat/conversations/{id} - Delete conversation
- POST /api/ai-chat/conversations/{id}/clear - Clear messages
- POST /api/ai-chat/messages/{messageId}/feedback - Submit like/dislike
- GET /api/ai-chat/messages/{messageId}/suggestions - Get follow-up suggestions
- GET /api/ai-chat/status - Check AI service status

## 2. TypeScript Interfaces

```typescript
// AI Chat Types
interface AIMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  difyMessageId?: string;
  metadata?: {
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    retrieverResources?: Array<{
      datasetId: string;
      datasetName: string;
      documentId: string;
      documentName: string;
      score: number;
      content: string;
    }>;
  };
  feedback?: {
    rating: 'like' | 'dislike' | null;
    submittedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AIConversation {
  _id: string;
  userId: string;
  difyConversationId?: string;
  title: string;
  messages: AIMessage[];
  isActive: boolean;
  isPinned: boolean;
  lastMessageAt: string;
  metadata: {
    totalMessages: number;
    totalTokensUsed: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SendMessageRequest {
  message: string;
  inputs?: Record<string, unknown>;
}

interface SendMessageResponse {
  conversation: {
    _id: string;
    title: string;
    messages: AIMessage[];
    lastMessageAt: string;
  };
  aiResponse?: {
    answer: string;
    messageId: string;
    metadata?: object;
  };
  aiServiceAvailable: boolean;
}

// Streaming chunk types
interface StreamChunk {
  type: 'chunk';
  chunk: string;
  fullAnswer: string;
  conversationId: string;
}

interface StreamComplete {
  type: 'complete';
  answer: string;
  conversationId: string;
  messageId: string;
}

interface StreamError {
  type: 'error';
  error: string;
}

type StreamEvent = StreamChunk | StreamComplete | StreamError;
```

## 3. Implementation Requirements

### A. AI Chat Screen
- Đây là conversation đầu tiên trong danh sách chat
- Có icon/badge đặc biệt để phân biệt với human chat
- Luôn xuất hiện ở đầu danh sách (pinned by default)
- Có welcome message từ AI khi lần đầu mở

### B. Message UI
- Hiển thị avatar AI khác biệt (bot icon)
- Typing indicator khi đang chờ AI response
- Streaming text effect (từng chữ hiện ra) cho UX tốt hơn
- Like/Dislike buttons cho AI messages
- Suggested follow-up questions buttons

### C. Features cần implement
1. **Auto-scroll** khi có message mới
2. **Pull to refresh** để reload conversation
3. **Loading state** khi gửi message
4. **Error handling** với retry button
5. **Offline indicator** khi AI service unavailable
6. **Message copy** - long press để copy
7. **Markdown rendering** - AI có thể trả về markdown
8. **Code syntax highlighting** - nếu AI trả về code

### D. UX Considerations
- Disable send button khi đang loading
- Show "AI is typing..." indicator
- Smooth scroll animation
- Haptic feedback on send
- Sound notification for new AI message (optional)

## 4. Example React Native Component Structure

```tsx
// screens/AIChatScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FlatList, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiChatAPI } from '../api/aiChat';

const AIChatScreen = () => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get or create conversation
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ai-conversation'],
    queryFn: aiChatAPI.getOrCreateConversation,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (msg: string) => 
      aiChatAPI.sendMessage(data?.conversation._id, msg),
    onMutate: () => setIsTyping(true),
    onSettled: () => setIsTyping(false),
    onSuccess: () => {
      refetch();
      flatListRef.current?.scrollToEnd();
    },
  });

  const handleSend = () => {
    if (!message.trim() || sendMutation.isPending) return;
    sendMutation.mutate(message);
    setMessage('');
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={data?.conversation.messages || []}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <MessageBubble message={item} isAI={item.role === 'assistant'} />
        )}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />
      
      {isTyping && <TypingIndicator />}
      
      <View style={styles.inputContainer}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Nhập tin nhắn..."
          multiline
        />
        <TouchableOpacity 
          onPress={handleSend}
          disabled={!message.trim() || sendMutation.isPending}
        >
          <Text>Gửi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

## 5. API Service Example

```typescript
// api/aiChat.ts
import { api } from './client';

export const aiChatAPI = {
  getOrCreateConversation: async () => {
    const response = await api.get('/ai-chat');
    return response.data;
  },

  sendMessage: async (conversationId: string, message: string) => {
    const response = await api.post(
      `/ai-chat/conversations/${conversationId}/messages`,
      { message }
    );
    return response.data;
  },

  // Streaming version using EventSource or fetch with readable stream
  sendMessageStreaming: async (
    conversationId: string,
    message: string,
    onChunk: (chunk: string) => void,
    onComplete: (data: StreamComplete) => void,
    onError: (error: string) => void
  ) => {
    const response = await fetch(
      `${API_BASE_URL}/ai-chat/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message }),
      }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
      
      for (const line of lines) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'chunk') onChunk(data.chunk);
        else if (data.type === 'complete') onComplete(data);
        else if (data.type === 'error') onError(data.error);
      }
    }
  },

  submitFeedback: async (messageId: string, rating: 'like' | 'dislike') => {
    const response = await api.post(
      `/ai-chat/messages/${messageId}/feedback`,
      { rating }
    );
    return response.data;
  },

  getSuggestions: async (messageId: string) => {
    const response = await api.get(
      `/ai-chat/messages/${messageId}/suggestions`
    );
    return response.data;
  },
};
```

## 6. Integration với Conversation List

Trong màn hình danh sách chat, AI Chat cần xuất hiện đầu tiên:

```typescript
// Khi render conversation list
const renderConversationList = () => {
  return (
    <>
      {/* AI Chat - Always first */}
      <AIChatListItem 
        onPress={() => navigation.navigate('AIChat')}
      />
      
      {/* Human conversations */}
      <FlatList
        data={humanConversations}
        renderItem={({ item }) => (
          <ConversationListItem conversation={item} />
        )}
      />
    </>
  );
};

// AIChatListItem component
const AIChatListItem = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.aiChatItem}>
    <View style={styles.aiAvatar}>
      <BotIcon />
    </View>
    <View style={styles.info}>
      <Text style={styles.title}>AI Assistant</Text>
      <Text style={styles.subtitle}>Hỏi bất cứ điều gì...</Text>
    </View>
    <AiBadge />
  </TouchableOpacity>
);
```

## 7. Design Guidelines

### Colors
- AI Avatar: Gradient blue/purple hoặc teal
- AI Message Bubble: Light blue/gray background
- User Message Bubble: Primary color (blue/green)
- AI Badge: Gradient badge với icon robot

### Typography
- AI messages: Regular weight, slightly larger line height
- Code blocks: Monospace font
- Links: Underlined, tappable

### Animations
- Message appear: Fade in + slide up
- Typing indicator: 3 dots bouncing
- Send button: Scale on press
- Like/Dislike: Heart animation

## 8. Error States

```typescript
// Handle different error scenarios
const ErrorMessage = ({ error, onRetry }) => {
  if (error === 'AI service not available') {
    return (
      <View style={styles.errorContainer}>
        <OfflineIcon />
        <Text>AI đang bảo trì. Vui lòng thử lại sau.</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.errorContainer}>
      <Text>Có lỗi xảy ra</Text>
      <TouchableOpacity onPress={onRetry}>
        <Text>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
};
```

Hãy implement đầy đủ các tính năng trên với production-ready code.
```

---

## Additional Notes for Frontend Team

### Environment Setup
Đảm bảo backend có các environment variables:
- `DIFY_API_KEY` - API key từ Dify dashboard
- `DIFY_BASE_URL` - Base URL của Dify API (mặc định: https://api.dify.ai/v1)

### Testing
1. Gọi `GET /api/ai-chat/status` để kiểm tra AI service
2. Nếu `available: false`, hiển thị thông báo cho user
3. Test với cả blocking và streaming endpoints

### Performance Tips
1. Cache conversation locally với AsyncStorage
2. Sử dụng optimistic updates khi gửi message
3. Implement infinite scroll cho conversations dài
4. Lazy load messages cũ

