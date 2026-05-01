# Admin System - Quick Start Guide

## 🚀 GETTING STARTED

### 1. Run Database Migration

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_admin_system

# Or if migration is already in /migrations
npx prisma migrate deploy
```

### 2. Set Up Admin User

```bash
# Via database console (psql)
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@example.com';

# Or via Prisma Studio
npx prisma studio
```

### 3. Test Admin Access

1. Sign in with admin account
2. Navigate to `/admin`
3. Should see admin dashboard
4. All sidebar routes should work

### 4. Verify Data

Check that you can:
- [ ] See users list
- [ ] View template moderation queue
- [ ] Check active projects
- [ ] Monitor payments
- [ ] Review withdrawal requests
- [ ] View analytics
- [ ] Check audit logs

---

## 📊 ADMIN FEATURES

### Dashboard (`/admin`)
- Real-time platform metrics
- Revenue overview
- Active projects count
- Recent user signups
- Transaction history

### Users (`/admin/users`)
- Search and filter users
- Block/delete user accounts
- View user ratings
- User role management

### Templates (`/admin/templates`)
- Review pending templates
- Approve/Reject submissions
- Delete inappropriate content
- Monitor template marketplace

### Projects (`/admin/projects`)
- Monitor all projects
- Remove spam projects
- Track project status
- View project details

### Payments (`/admin/payments`)
- View all transactions
- Project order payments
- Template purchase payments
- Payment status tracking
- Escrow management

### Withdrawals (`/admin/withdrawals`)
- Review withdrawal requests
- Approve/Reject withdrawals
- Add admin notes
- Track payout status

### Analytics (`/admin/analytics`)
- Revenue metrics
- Growth tracking
- Top performer rankings
- Monthly trends

### Audit Logs (`/admin/logs`)
- Complete action history
- Admin accountability
- Filtering by action type
- Detailed action descriptions

---

## 🔐 SECURITY

✅ Only ADMIN role can access
✅ All actions logged
✅ Middleware protection
✅ No public access

### Making Someone Admin

```javascript
// In database or Prisma Studio
UPDATE "User" SET role = 'ADMIN' WHERE email = 'user@example.com';
```

---

## 🔧 API ENDPOINTS

All endpoints require ADMIN role.

### Dashboard
```
GET /api/admin/dashboard
```

### Users
```
GET /api/admin/users?page=1&limit=20&role=FREELANCER&search=john
POST /api/admin/users { userId, action: "block" | "delete" }
```

### Templates
```
GET /api/admin/templates?page=1&status=PENDING&search=react
POST /api/admin/templates { templateId, action: "approve" | "reject" | "delete" }
```

### Projects
```
GET /api/admin/projects?page=1&status=OPEN&search=website
POST /api/admin/projects { projectId, action: "remove" | "cancel" }
```

### Payments
```
GET /api/admin/payments?page=1
```

### Withdrawals
```
GET /api/admin/withdrawals?page=1&status=PENDING
POST /api/admin/withdrawals { withdrawalId, action: "approve" | "reject", adminNotes }
```

### Analytics
```
GET /api/admin/analytics
```

### Logs
```
GET /api/admin/logs?page=1&action=USER_DELETED
```

---

## 📊 DATABASE SCHEMA

### New Tables
- `AdminLog` - All admin actions
- `AdminNotification` - System notifications

### Updated Tables
- `Template` - Added status field
- `User` - Added adminLogs relation
- `Notification` - Added user relation
- `UserPresence` - Added user relation

---

## 🎯 TYPICAL WORKFLOWS

### Approve a Template

1. Go to `/admin/templates`
2. Filter by "Pending"
3. Review template
4. Click ✅ button
5. Template goes live

### Process Withdrawal

1. Go to `/admin/withdrawals`
2. Review amount
3. Click ✅ to approve
4. Stripe processes payout
5. Status becomes "COMPLETED"

### Block Spammer

1. Go to `/admin/users`
2. Search for suspicious user
3. Click Lock icon
4. User account blocked
5. Action logged

### Monitor Revenue

1. Go to `/admin/analytics`
2. View total revenue
3. Check monthly growth
4. Analyze top templates
5. Review top freelancers

---

## 🐛 TROUBLESHOOTING

### Admin Dashboard Returns 401

- Check that user has `role = 'ADMIN'`
- Verify session is active
- Clear browser cache and login again

### Pagination Not Working

- Check URL parameters (?page=X&limit=Y)
- Verify database has data
- Check for TypeScript errors

### Actions Not Being Logged

- Verify AdminLog table exists
- Check database connection
- Ensure session has user.id

### Analytics Data Missing

- Run analytics calculations
- Verify transactions exist in database
- Check order/template purchase records

---

## 📝 EXAMPLE: Create Admin User

```sql
-- PostgreSQL
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'admin@company.com';

-- Verify
SELECT id, email, role FROM "User" WHERE role = 'ADMIN';
```

---

## ✅ QUALITY CHECKLIST

- [x] All routes protected
- [x] Real-time data
- [x] Proper pagination
- [x] Error handling
- [x] Loading states
- [x] Audit logging
- [x] User feedback
- [x] Responsive design
- [x] No mock data
- [x] Production ready

---

## 📞 SUPPORT

For issues or questions:
1. Check the main README
2. Review ADMIN_SYSTEM.md
3. Check error messages in browser console
4. Verify database migrations ran

---

**Admin Panel Ready!** 🎉
