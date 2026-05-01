# Chat System - Troubleshooting & FAQ

## Common Issues & Solutions

---

## 🔴 Socket Connection Issues

### Problem: "Socket not connecting" or "Socket disconnected immediately"

**Symptoms**: 
- Browser console shows error connecting
- Chat page shows loading spinner forever
- No "Socket connected" message

**Solutions**:

1. **Check if server is running**
   ```bash
   npm run dev
   # Should show: Ready on http://localhost:3000
   # Should show: Socket.io server initialized
   ```

2. **Check NEXT_PUBLIC_APP_URL**
   ```env
   # .env.local
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Check user authentication**
   - Must be signed in before socket connects
   - Check if session exists: `console.log(session)`

4. **Check browser console**
   ```javascript
   // Should see:
   // "Socket connected: socket-id"
   // NOT "Connection error"
   ```

5. **Clear browser cache**
   - Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
   - Clear cookies for localhost

6. **Check firewall**
   - WebSocket might be blocked by firewall
   - Try different port if needed

---

## 🔴 Messages Not Appearing

### Problem: Send message, nothing happens

**Symptoms**:
- Click send, message doesn't appear
- No error message
- Other window shows nothing

**Debugging**:

1. **Check if socket is connected**
   ```typescript
   const { socket, isConnected } = useSocket();
   console.log("Socket connected:", isConnected);
   ```

2. **Check conversation participants**
   ```sql
   SELECT * FROM "Conversation" WHERE id = 'conv-id';
   -- Should have both user IDs in participantIds
   ```

3. **Check if user is in conversation**
   ```sql
   SELECT * FROM "Message" WHERE "conversationId" = 'conv-id';
   -- Should see message records
   ```

4. **Check browser console for errors**
   - Look for any red error messages
   - Check Network tab for failed requests

5. **Verify database connection**
   ```bash
   # Test Prisma connection
   npx prisma db execute --stdin
   # Type: SELECT 1;
   ```

6. **Check Socket.io logs**
   ```typescript
   // Add to server.ts
   io.on("connection", (socket) => {
     console.log("User connected:", socket.userId);
   });
   ```

---

## 🔴 Notifications Not Working

### Problem: No notifications appear

**Symptoms**:
- Notification badge doesn't appear
- Click notification center, it's empty
- No notifications in database

**Solutions**:

1. **Check if NotificationCenter component is mounted**
   ```typescript
   // In navbar.tsx - must include:
   import { NotificationCenter } from "@/components/chat";
   
   <NotificationCenter /> {/* Inside navbar */}
   ```

2. **Check notifications in database**
   ```sql
   SELECT * FROM "Notification" 
   WHERE "userId" = 'your-user-id'
   ORDER BY "createdAt" DESC;
   ```

3. **Check Socket.io event listener**
   ```typescript
   socket.on("notification:new", (notification) => {
     console.log("Notification received:", notification);
   });
   ```

4. **Manually trigger notification**
   ```bash
   # Insert test notification
   INSERT INTO "Notification" ("userId", "type", "message")
   VALUES ('your-user-id', 'MESSAGE', 'Test');
   ```

5. **Check user is receiving events**
   - User must be connected to Socket.io
   - User must be in their user room: `user:{userId}`

---

## 🔴 File Upload Issues

### Problem: File upload fails

**Symptoms**:
- Upload button does nothing
- File preview shows but send fails
- No file appears in message

**Solutions**:

1. **Check uploads directory exists**
   ```bash
   # Linux/Mac
   ls -la public/uploads/
   
   # Windows
   dir public\uploads\
   ```

2. **Create directory if missing**
   ```bash
   mkdir -p public/uploads
   ```

3. **Check file permissions**
   ```bash
   chmod 755 public/uploads
   ```

4. **Check file size**
   - Default limit: Depends on Next.js config
   - Large files might timeout
   - Try smaller file first

5. **Check API response**
   ```javascript
   // In browser, test upload:
   const file = new File(["test"], "test.txt");
   const formData = new FormData();
   formData.append("file", file);
   
   fetch("/api/upload", { method: "POST", body: formData })
     .then(r => r.json())
     .then(data => console.log(data));
   ```

6. **Check disk space**
   ```bash
   df -h /
   ```

---

## 🔴 Database Migration Issues

### Problem: Migration fails

**Symptoms**:
- `npx prisma migrate dev` shows error
- "Table already exists" error
- "Migration not found" error

**Solutions**:

1. **Check migration status**
   ```bash
   npx prisma migrate status
   ```

2. **Reset database (development only)**
   ```bash
   npx prisma migrate reset
   # Warning: Deletes all data!
   ```

3. **Manually run migration**
   ```bash
   npx prisma migrate deploy
   ```

4. **Check if tables exist**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

5. **Regenerate Prisma client**
   ```bash
   npx prisma generate
   ```

---

## 🔴 Typing Indicator Issues

### Problem: Typing indicator not showing

**Symptoms**:
- Start typing, other user doesn't see "typing..."
- Typing indicator shows permanently

**Solutions**:

1. **Check if socket is connected**
   - Both users must have connected socket

2. **Verify typing events are emitted**
   ```typescript
   socket.emit("typing:start", conversationId);
   // Should see in server logs
   ```

3. **Check timeout is working**
   - Typing should auto-stop after 2 seconds
   - Verify JavaScript timeout isn't blocked

4. **Check room subscription**
   - Both users must be in same conversation room
   - Verify via: `socket.emit("conversation:join", convId)`

---

## 🔴 Online Status Not Updating

### Problem: Online indicator doesn't change

**Symptoms**:
- Shows offline when online
- Shows online when offline
- Status never updates

**Solutions**:

1. **Check UserPresence table**
   ```sql
   SELECT * FROM "UserPresence";
   ```

2. **Check if user online event fires**
   ```typescript
   socket.on("user:online", ({ userId }) => {
     console.log("User online:", userId);
   });
   ```

3. **Manually update presence**
   ```bash
   INSERT INTO "UserPresence" ("userId", "isOnline")
   VALUES ('user-id', true);
   ```

4. **Check if disconnect handler runs**
   ```typescript
   socket.on("disconnect", () => {
     console.log("User disconnected");
   });
   ```

---

## 🟡 Performance Issues

### Problem: Chat is slow or laggy

**Symptoms**:
- Messages appear with delay
- UI freezes when loading messages
- Network tab shows slow requests

**Solutions**:

1. **Check database query performance**
   ```sql
   -- Show slow queries
   SELECT * FROM "Message" 
   WHERE "conversationId" = 'id'
   ORDER BY "createdAt" DESC
   LIMIT 50;
   ```

2. **Check message count**
   ```sql
   SELECT COUNT(*) FROM "Message" 
   WHERE "conversationId" = 'id';
   ```

3. **Verify pagination is working**
   ```typescript
   // Should use cursor-based pagination
   /api/chat/conversations/[id]/messages?cursor=message-id
   ```

4. **Check network latency**
   - Open DevTools → Network tab
   - Look for slow API requests
   - Check WebSocket connection

5. **Reduce message history**
   ```typescript
   // Load fewer messages initially
   const messages = await db.message.findMany({
     take: 20, // Instead of 50
   });
   ```

---

## 🟡 Production Deployment Issues

### Problem: Can't deploy to Vercel/Serverless

**Reason**: Socket.io doesn't work on serverless platforms

**Solutions**:

1. **Self-host on traditional server**
   - Render.com
   - Railway.app
   - DigitalOcean
   - AWS EC2
   - Your own server

2. **Use Socket.io Cloud**
   - https://socket.io/cloud/
   - Managed Socket.io service

3. **Use alternative real-time service**
   - Pusher
   - Ably
   - Firebase Realtime Database

4. **Deployment steps (self-hosted)**
   ```bash
   # Build
   npm run build
   
   # Deploy
   npm run start
   
   # Or use PM2
   pm2 start "npm run start"
   ```

---

## ❓ FAQ

### Q: Can I use this in production?
**A**: Yes! The system is production-ready. However, Socket.io doesn't work on Vercel (serverless). Self-host or use alternatives.

### Q: How do I scale to many users?
**A**: Use Redis adapter for Socket.io:
```typescript
import { createAdapter } from "@socket.io/redis-adapter";
io.adapter(createAdapter(pubClient, subClient));
```

### Q: Where are files stored?
**A**: In `/public/uploads/` by default. For production, use cloud storage (S3, Cloudinary).

### Q: Can I have group chat?
**A**: Current implementation is 1:1. To add group chat, update schema to support `isGroup` and multiple participants.

### Q: How do I backup messages?
**A**: They're in PostgreSQL. Regular database backups will preserve all messages.

### Q: Can I search messages?
**A**: Yes! Add full-text search to database queries. See CHAT_INTEGRATION_EXAMPLES.md

### Q: How do I handle user bans?
**A**: Add `isBanned` field to User model, check before establishing Socket connection.

### Q: What about message encryption?
**A**: Add encryption library (e.g., `TweetNaCl.js`) to encrypt messages before sending.

### Q: Can I have read by X timestamp?
**A**: Yes! `Message.readAt` already tracks this. Update UI to show it.

### Q: How to add voice calls?
**A**: Use WebRTC. Libraries: PeerJS, Twilio.

### Q: Performance: How many concurrent users?
**A**: Single server handles 10,000+ concurrent Socket.io connections. Scale with Redis for more.

### Q: Do messages sync across devices?
**A**: Yes! Same user ID = same conversations across all devices.

### Q: Message history limit?
**A**: No limit! Pagination handles any number of messages.

---

## 🔧 Development Tips

### Quick debugging:
```typescript
// Add to socket handler
console.log("Event received:", eventName, data);

// Check sender
console.log("User ID:", socket.userId);

// Check database impact
console.log("Message saved:", message.id);
```

### Test with multiple users:
1. Open in incognito window (different session)
2. Or use two different browsers
3. Or two different machines on same network

### Simulate latency:
```typescript
// Browser DevTools → Network → Throttle
// Useful for testing on slow connections
```

### Monitor Socket.io connections:
```typescript
// Socket.io has built-in admin UI
io.engine.generateId = () => customId++;
```

---

## 📞 Getting Help

1. **Check documentation**:
   - CHAT_SYSTEM.md - Complete guide
   - CHAT_SETUP.md - Quick start
   - CHAT_INTEGRATION_EXAMPLES.md - Examples

2. **Check browser console**:
   - F12 or Cmd+Option+I
   - Look for error messages

3. **Check server logs**:
   - Terminal where you ran `npm run dev`
   - Look for Socket.io messages

4. **Check database**:
   ```bash
   npx prisma studio
   ```

5. **Stack Overflow**:
   - Tag: socket.io, prisma, next.js

6. **Socket.io Docs**:
   - https://socket.io/docs/

---

**Still having issues?** Check all guides in the repository or open an issue with:
- What you're trying to do
- What happened
- Console errors
- Database state
- Network requests
