# Environment Variables for Chat System

## Required Variables

Add these to your `.env.local` file:

```env
# Application URL (for Socket.io CORS and client connection)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/altfaze"

# Auth (existing)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Stripe (existing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## Development vs Production

### Development
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Production (Self-Hosted)
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Production (Vercel Note)
⚠️ **Socket.io doesn't work on Vercel** because of serverless limitations.

Use alternatives:
- Self-host the server separately
- Use Socket.io Cloud
- Use Pusher or Ably

---

## Socket.io Configuration

The Socket.io server uses:
- Port: Same as Next.js server (default 3000)
- Transports: WebSocket + polling fallback
- CORS: Configured to allow requests from NEXT_PUBLIC_APP_URL

---

## File Uploads

Files are stored in `/public/uploads/`

For production, consider:
```env
# Optional: Use cloud storage
NEXT_PUBLIC_UPLOAD_API=https://api.cloudinary.com
UPLOAD_API_KEY=your-key
```

---

**No additional configuration needed!** The system is fully configured out of the box. 🎉
