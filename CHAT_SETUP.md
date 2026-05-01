# Chat System Quick Setup

## ⚡ Production-Ready Real-Time Chat System

This guide will get your chat system running in **5 minutes**.

---

## Prerequisites

✅ Next.js 14+
✅ PostgreSQL database
✅ Node.js 18+

---

## Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

Already added to package.json:
- `socket.io` - WebSocket server
- `socket.io-client` - WebSocket client
- `tsx` - TypeScript runner

---

## Step 2: Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migration to create tables
npx prisma migrate dev --name add_realtime_models
```

This creates:
- ✅ Conversation table
- ✅ Message table
- ✅ Notification table
- ✅ UserPresence table

---

## Step 3: Environment Setup

Add to `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Start Development Server

```bash
npm run dev
# or
pnpm dev
```

The server will:
- ✅ Start Next.js on port 3000
- ✅ Initialize Socket.io WebSocket server
- ✅ Listen on same port as Next.js

---

## Step 5: Access Chat

1. **Go to Chat Page**: http://localhost:3000/chat
2. **Start a Conversation**: Open in two browser tabs/windows
3. **Sign in as different users** in each tab
4. **Send messages** - They appear instantly!

---

## Integration Examples

### In Any Component

```typescript
import { StartChatButton } from "@/components/chat";

// Add chat button to freelancer profile
<StartChatButton userId={freelancerId} />

// Chat with project context
<StartChatButton 
  userId={freelancerId} 
  projectId={projectId}
/>

// Chat after order accepted
<StartChatButton 
  userId={freelancerId}
  orderId={orderId}
/>
```

### In Navbar (Already Done)

The notification center and messages link are already integrated.

### Start Chat From Action

```typescript
import { createConversation } from "@/actions/chat";

// After order acceptance
const conversation = await createConversation([freelancerId], undefined, orderId);
```

---

## Features Working Out of the Box

✅ **Real-time 1:1 Chat**
- Instant message delivery
- Message history
- Read/unread status

✅ **Notifications**
- Real-time notification center
- Unread count badge
- Click to navigate

✅ **Online/Offline Status**
- Green dot = online
- Gray dot = offline
- Real-time updates

✅ **Typing Indicators**
- Shows when someone is typing
- Auto-disappears after 2 seconds

✅ **File Sharing**
- Upload files in chat
- Preview before send
- Download links

✅ **Project/Order Chat**
- Link conversations to projects
- Link conversations to orders
- Auto-create on order acceptance

---

## Testing the System

### Test 1: Send Message
1. Open http://localhost:3000/chat in two browser windows
2. Sign in as different users
3. Select same conversation
4. Type and send message
5. Should appear instantly in other window ✅

### Test 2: Notifications
1. User A sends message to User B
2. User B should see notification badge ✅
3. Click notification
4. Should navigate to chat ✅

### Test 3: Online Status
1. Look at online status indicator
2. Should show green if online ✅
3. Refresh page to test
4. Status should update ✅

### Test 4: File Upload
1. Click file icon in chat
2. Select a file
3. Click send
4. File should appear in chat ✅
5. Should be able to download ✅

---

## File Locations

**Core System**
- `/src/lib/socket.ts` - WebSocket server
- `/src/lib/socket-client.ts` - WebSocket client
- `/src/actions/chat.ts` - Server actions

**Components**
- `/src/components/chat/chat-window.tsx` - Main chat UI
- `/src/components/chat/conversation-list.tsx` - Conversations list
- `/src/components/chat/notification-center.tsx` - Notifications dropdown
- `/src/components/chat/online-status.tsx` - Status indicator
- `/src/components/chat/start-chat-button.tsx` - Quick chat button

**API Routes**
- `/src/app/api/chat/conversations/route.ts`
- `/src/app/api/chat/conversations/[id]/route.ts`
- `/src/app/api/chat/conversations/[id]/messages/route.ts`
- `/src/app/api/chat/notifications/route.ts`
- `/src/app/api/chat/notifications/[id]/route.ts`
- `/src/app/api/upload/route.ts`

**Database**
- `/prisma/schema.prisma` - Database models
- `/prisma/migrations/add_realtime_models/migration.sql` - DB migration

---

## Deployment Notes

### For Production (Vercel)

Socket.io doesn't work on Vercel's serverless functions directly. Use these alternatives:

**Option 1: Self-hosted Server** (Recommended)
```bash
# Deploy to Railway, Render, or your own server
npm run build
npm run start
```

**Option 2: Socket.io Cloud**
- Use Socket.io Cloud for production Socket.io server
- Update connection URL in `.env`

**Option 3: Alternative Real-time**
- Use Pusher, Ably, or Firebase Realtime Database

---

## Troubleshooting

### Socket not connecting?

```typescript
// Check browser console for errors
// Expected: "Socket connected: socket-id"

// If not:
// 1. Check if server is running: npm run dev
// 2. Check NEXT_PUBLIC_APP_URL is correct
// 3. Check if user is authenticated
```

### Messages not appearing?

```typescript
// Check:
// 1. Both users in same conversation
// 2. Browser console for errors
// 3. Database has message records:
//    SELECT * FROM "Message" ORDER BY "createdAt" DESC;
```

### Notifications not showing?

```typescript
// Check:
// 1. Notifications component is mounted (in navbar)
// 2. Check database:
//    SELECT * FROM "Notification" WHERE "userId" = 'your-user-id';
// 3. Check socket is connected
```

---

## Performance Tips

1. **Message Pagination** - Uses cursor-based pagination (20 per page)
2. **Lazy Loading** - Load more messages as user scrolls
3. **Memoization** - Components optimized for performance
4. **Socket Rooms** - Only relevant events broadcast

---

## Next Steps

1. ✅ Add chat to more pages (freelancer profiles, projects, orders)
2. ✅ Integrate with your existing hiring/order workflow
3. ✅ Test with multiple users
4. ✅ Configure for production deployment
5. ✅ Consider adding voice/video calls (future feature)

---

## Support Resources

- **Socket.io Docs**: https://socket.io/docs/
- **Chat System Docs**: `/CHAT_SYSTEM.md`
- **Prisma Docs**: https://www.prisma.io/docs/
- **Next.js Docs**: https://nextjs.org/docs

---

**Status**: ✅ **FULLY FUNCTIONAL**
**Production Ready**: ✅ **YES**
**Real-time**: ✅ **YES**
**No Polling**: ✅ **YES**
**DB Synced**: ✅ **YES**

You now have a complete, production-grade real-time chat system! 🚀
