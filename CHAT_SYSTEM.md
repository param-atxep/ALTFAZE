# Real-Time Chat System Documentation

## Overview

This document explains the complete real-time communication system implemented for ALTFaze. The system includes 1:1 chat, notifications, online/offline presence, file sharing, and project collaboration messaging.

---

## Architecture

### Tech Stack
- **WebSockets**: Socket.io 4.7.2
- **Backend**: Next.js 14 with custom server (server.ts)
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React 18 with Next.js App Router
- **Real-time State**: Socket.io events + React hooks

### Data Flow

```
Client (React) 
  ↓
Socket.io WebSocket Connection
  ↓
Custom Node.js Server (server.ts)
  ↓
Socket.io Handler (src/lib/socket.ts)
  ↓
Prisma + PostgreSQL
  ↓
Broadcast back to all connected clients
```

---

## Database Models

### Conversation
```prisma
model Conversation {
  id: String (primary key)
  participantIds: String[] (user IDs)
  projectId: String? (optional project link)
  orderId: String? (optional order link)
  lastMessage: String?
  lastMessageAt: DateTime?
  messages: Message[]
  notifications: Notification[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Message
```prisma
model Message {
  id: String (primary key)
  conversationId: String (FK)
  senderId: String (FK to User)
  text: String
  fileUrl: String?
  fileName: String?
  isRead: Boolean
  readAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Notification
```prisma
model Notification {
  id: String (primary key)
  userId: String (FK to User)
  type: NotificationType (MESSAGE, ORDER_ACCEPTED, HIRE_REQUEST, etc.)
  message: String
  actionUrl: String?
  isRead: Boolean
  readAt: DateTime?
  conversationId: String? (FK)
  createdAt: DateTime
}
```

### UserPresence
```prisma
model UserPresence {
  id: String (primary key)
  userId: String (unique, FK to User)
  isOnline: Boolean
  lastSeenAt: DateTime
}
```

---

## Key Components

### 1. Socket Client Hook (`src/lib/socket-client.ts`)
Initializes and manages WebSocket connection on the client side.

```typescript
const { socket, isConnected } = useSocket();

// The hook handles:
// - Auto-connection on session load
// - Reconnection with exponential backoff
// - Error handling
```

### 2. Chat Window (`src/components/chat/chat-window.tsx`)
The main chat UI component.

```typescript
<ChatWindow 
  conversationId={id}
  participantIds={participants}
/>

// Features:
// - Real-time message display
// - Typing indicators
// - File upload/preview
// - Message read receipts
// - Auto-scroll to latest message
```

### 3. Conversation List (`src/components/chat/conversation-list.tsx`)
Displays all conversations for the user.

```typescript
<ConversationList 
  onSelectConversation={handleSelect}
  selectedConversationId={selected}
/>

// Features:
// - List all conversations
// - Show last message preview
// - Timestamp of last message
// - Real-time updates
```

### 4. Notification Center (`src/components/chat/notification-center.tsx`)
Dropdown for notifications.

```typescript
<NotificationCenter />

// Features:
// - Shows unread count badge
// - List all notifications
// - Mark as read
// - Navigate to relevant pages
// - Real-time notification updates
```

### 5. Start Chat Button (`src/components/chat/start-chat-button.tsx`)
Quick action to start a conversation.

```typescript
<StartChatButton 
  userId={freelancerId}
  projectId={projectId}
  orderId={orderId}
/>
```

### 6. Online Status (`src/components/chat/online-status.tsx`)
Shows user online/offline status.

```typescript
<OnlineStatus userId={userId} />

// Shows green dot if online, gray if offline
```

---

## API Routes

### GET/POST `/api/chat/conversations`
- **GET**: List all conversations for current user
- **POST**: Create new conversation

```typescript
// POST body
{
  participantIds: ["user-id"],
  projectId?: "project-id",
  orderId?: "order-id"
}
```

### GET `/api/chat/conversations/[id]`
Get conversation with messages

```typescript
// Response
{
  id: "conv-id",
  participantIds: ["user-1", "user-2"],
  messages: [...],
  ...
}
```

### GET `/api/chat/conversations/[id]/messages`
Paginated message history

```typescript
// Query: ?cursor=message-id

// Response
{
  messages: [...],
  nextCursor?: "next-message-id"
}
```

### GET/PATCH `/api/chat/notifications/[id]`
- **GET**: List notifications
- **PATCH**: Mark as read

### POST `/api/chat/auto-create`
Auto-create conversation when order/project starts

```typescript
{
  orderId?: "order-id",
  projectId?: "project-id",
  freelancerId?: "freelancer-id"
}
```

### POST `/api/upload`
Upload files for sharing in chat

---

## Socket Events

### Client → Server

#### `message:send`
```typescript
socket.emit("message:send", {
  conversationId: "conv-id",
  text: "message text",
  fileUrl?: "url",
  fileName?: "name"
});
```

#### `conversation:join`
```typescript
socket.emit("conversation:join", "conv-id");
```

#### `conversation:leave`
```typescript
socket.emit("conversation:leave", "conv-id");
```

#### `typing:start`
```typescript
socket.emit("typing:start", "conv-id");
```

#### `typing:stop`
```typescript
socket.emit("typing:stop", "conv-id");
```

#### `message:read`
```typescript
socket.emit("message:read", "message-id");
```

### Server → Client

#### `message:new`
```typescript
socket.on("message:new", (message) => {
  // {
  //   id, conversationId, senderId, senderName, 
  //   senderImage, text, fileUrl, fileName, createdAt
  // }
});
```

#### `typing:active`
```typescript
socket.on("typing:active", ({ userId }) => {
  // Show typing indicator
});
```

#### `typing:stopped`
```typescript
socket.on("typing:stopped", ({ userId }) => {
  // Hide typing indicator
});
```

#### `user:online`
```typescript
socket.on("user:online", ({ userId }) => {
  // Show user as online
});
```

#### `user:offline`
```typescript
socket.on("user:offline", ({ userId }) => {
  // Show user as offline
});
```

#### `notification:new`
```typescript
socket.on("notification:new", (notification) => {
  // {
  //   type, message, conversationId, 
  //   messageId, senderId
  // }
});
```

---

## Integration Guide

### 1. In Freelancer Profile
```typescript
import { StartChatButton } from "@/components/chat";

export function FreelancerCard({ freelancer }) {
  return (
    <div>
      <h3>{freelancer.name}</h3>
      <StartChatButton 
        userId={freelancer.id}
      />
    </div>
  );
}
```

### 2. After Order Acceptance
```typescript
// In your order acceptance action
import { createConversation } from "@/actions/chat";

async function acceptOrder(orderId: string, freelancerId: string) {
  // Update order status
  await updateOrder(orderId, "ACCEPTED");
  
  // Create conversation
  await createConversation([freelancerId], undefined, orderId);
  
  // Send notification
  await sendNotification(
    freelancerId,
    "ORDER_ACCEPTED",
    "Your order has been accepted!",
    "/chat"
  );
}
```

### 3. In Project Details
```typescript
import { StartChatButton, OnlineStatus } from "@/components/chat";

export function ProjectDetail({ project, freelancer }) {
  return (
    <div>
      <h2>{project.title}</h2>
      <div className="flex items-center gap-2">
        <OnlineStatus userId={freelancer.id} />
        <span>{freelancer.name}</span>
      </div>
      <StartChatButton 
        userId={freelancer.id}
        projectId={project.id}
      />
    </div>
  );
}
```

### 4. In Dashboard
```typescript
import { ChatLayout, NotificationCenter } from "@/components/chat";

export function DashboardLayout() {
  return (
    <div>
      <header>
        <NotificationCenter />
      </header>
      <main>
        <ChatLayout />
      </main>
    </div>
  );
}
```

### 5. In Navbar (Already Integrated)
The notification center is already added to the navbar at `src/components/navigation/navbar.tsx`.

---

## Hooks Usage

### useSocket()
```typescript
const { socket, isConnected } = useSocket();

// socket: Socket.io instance
// isConnected: Boolean indicating connection status
```

### useConversation(conversationId)
```typescript
const {
  messages,
  isLoading,
  typingUsers,
  sendMessage,
  markAsRead,
  loadMessages
} = useConversation(conversationId);

// Send message
sendMessage("Hello!", fileUrl, fileName);

// Mark as read
markAsRead(messageId);
```

### useConversations()
```typescript
const {
  conversations,
  isLoading,
  loadConversations
} = useConversations();
```

### useNotifications()
```typescript
const {
  notifications,
  unreadCount,
  loadNotifications,
  markAsRead
} = useNotifications();
```

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

Required packages are already added:
- `socket.io`: ^4.7.2
- `socket.io-client`: ^4.7.2
- `tsx`: ^4.7.0

### 2. Run Migrations
```bash
npx prisma migrate dev --name add_realtime_models
```

This creates the necessary tables:
- Conversation
- Message
- Notification
- UserPresence

### 3. Update Environment Variables
```env
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start the Development Server
```bash
npm run dev
# or
pnpm dev
```

The custom server (server.ts) will:
- Start Next.js server
- Initialize Socket.io on HTTP server
- Handle WebSocket connections

### 5. Access Chat
- Navigate to `/chat` to see the full chat interface
- Use `<StartChatButton>` to initiate conversations from anywhere
- Notifications appear in the navbar

---

## Real-Time Features

### 1. Instant Messaging ✅
- Messages sent via Socket.io
- Instant delivery to all participants
- Persisted in database

### 2. Typing Indicators ✅
- Show when someone is typing
- Auto-hide after 2 seconds of inactivity
- Real-time across all clients

### 3. Online/Offline Status ✅
- User status tracked in UserPresence table
- Broadcast to all connected clients
- Green dot for online, gray for offline

### 4. Read Receipts ✅
- Track which messages are read
- Automatic marking as read when viewed
- Show read status in UI

### 5. File Sharing ✅
- Upload files to `/api/upload`
- Files stored in `/public/uploads`
- File URL shared in message
- Download links in chat

### 6. Notifications ✅
- Push notifications via Socket.io
- Stored in database
- Mark as read/unread
- Show count badge
- Navigate to relevant page

### 7. Conversation Grouping ✅
- Link to projects
- Link to orders
- Auto-create on order acceptance
- Per-project communication

### 8. Message History ✅
- Lazy load with pagination
- Cursor-based pagination
- Load 50 messages per page
- Smooth infinite scroll

---

## Performance Optimization

### 1. Lazy Loading
- Messages loaded on demand
- Pagination with cursor
- Reduces initial load time

### 2. Memoization
- Components memoized where needed
- Prevent unnecessary re-renders

### 3. Socket Events
- Specific room subscriptions
- Only relevant messages sent to user
- Efficient broadcasting

### 4. Database Indexes
- Indexes on frequently queried fields
- Fast lookups for conversations
- Quick message retrieval

---

## Security

### 1. Authentication
- Socket.io middleware verifies user
- Token-based authentication
- Session validation

### 2. Authorization
- Verify user is participant before sending
- Check ownership before accessing
- Prevent unauthorized access

### 3. Data Validation
- Validate all inputs
- Sanitize messages
- Check file types

### 4. Rate Limiting
- Consider adding rate limiting for production
- Prevent message spam
- Limit file uploads

---

## Troubleshooting

### Socket Connection Issues
```typescript
// Check in browser console
// Should see "Socket connected" message
// If not, check:
// 1. Server is running (npm run dev)
// 2. NEXT_PUBLIC_APP_URL is set correctly
// 3. User is authenticated
```

### Messages Not Appearing
```typescript
// Check:
// 1. Both users are in same conversation
// 2. Socket is connected (isConnected === true)
// 3. No errors in console
// 4. Check database for message records
```

### Notifications Not Working
```typescript
// Check:
// 1. Notification Center component is mounted
// 2. Socket listener is active
// 3. Notifications table has data
// 4. User ID is correct
```

### File Upload Issues
```typescript
// Check:
// 1. /public/uploads directory exists
// 2. File size is reasonable
// 3. File type is allowed
// 4. Disk space available
```

---

## Future Enhancements

1. **Message Reactions**: Add emoji reactions to messages
2. **Voice/Video Calls**: Integrate WebRTC for calls
3. **Message Search**: Full-text search in conversations
4. **Message Encryption**: End-to-end encryption
5. **Message Pinning**: Pin important messages
6. **Group Chat**: Support for group conversations
7. **Message Editing**: Edit previously sent messages
8. **Message Deletion**: Delete messages from chat
9. **Cloud Storage**: Integration with S3/Cloudinary
10. **Analytics**: Track chat metrics

---

## Support

For issues or questions, check:
1. Browser console for errors
2. Server logs for connection issues
3. Database for data persistence
4. Socket.io documentation: https://socket.io/docs/

---

**Last Updated**: May 1, 2026
**System Version**: 1.0.0
**Production Ready**: Yes ✅
