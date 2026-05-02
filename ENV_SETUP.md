# ALTFaze Environment Setup Guide

Complete guide for setting up environment variables for ALTFaze platform.

## Quick Start

```bash
# Copy example file
cp .env.example .env.local

# Fill in required values
nano .env.local
```

## Required Variables

### Database

```env
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database
DATABASE_URL="postgresql://user:password@localhost:5432/altfaze"
```

**Setup:**
1. Create PostgreSQL database: `createdb altfaze`
2. Run migrations: `npx prisma migrate dev`

### Authentication

```env
# NextAuth.js secret - generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-key-here"

# Site URL (used for OAuth redirects)
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate Secret:**
```bash
openssl rand -base64 32
```

## Optional Variables

### OAuth Providers

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google`

```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

#### GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github`
   - `https://yourdomain.com/api/auth/callback/github`

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Payment Processing

#### Stripe

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
```

[Get Stripe Keys](https://dashboard.stripe.com/apikeys)

#### Razorpay

```env
NEXT_PUBLIC_RAZORPAY_KEY_ID="your-razorpay-key-id"
RAZORPAY_SECRET_KEY="your-razorpay-secret-key"
NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
```

[Get Razorpay Keys](https://dashboard.razorpay.com/#/app/keys)

### File Upload

#### Cloudinary

```env
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
```

[Get Cloudinary URL](https://cloudinary.com/console/settings/api-keys)

### Analytics

```env
# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Google Site Verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-verification-code"
```

### Email & Notifications

#### Resend (Recommended)

```env
RESEND_API_KEY="re_xxxxx"
```

[Get Resend API Key](https://resend.com/api-keys)

#### SMTP (Alternative)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Development

```env
# Enable debug logging
DEBUG="altfaze:*"

# Node environment
NODE_ENV="development"
```

## Environment by Stage

### Development (.env.local)

```env
# Database - Local or staging
DATABASE_URL="postgresql://user:password@localhost:5432/altfaze_dev"

# Auth
NEXTAUTH_SECRET="dev-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Providers (optional - add when ready)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Features (disabled in dev)
NODE_ENV="development"
```

### Staging (.env.staging)

```env
# Database - Staging DB
DATABASE_URL="postgresql://user:password@staging-db.example.com:5432/altfaze_staging"

# Auth
NEXTAUTH_SECRET="staging-secret-key-generated"
NEXTAUTH_URL="https://staging.altfaze.com"
NEXT_PUBLIC_APP_URL="https://staging.altfaze.com"

# All providers configured
GOOGLE_CLIENT_ID="staging-google-id"
GOOGLE_CLIENT_SECRET="staging-google-secret"
GITHUB_CLIENT_ID="staging-github-id"
GITHUB_CLIENT_SECRET="staging-github-secret"

# Payment - Test keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_SECRET_KEY="sk_test_xxxxx"

NODE_ENV="production"
```

### Production (.env.production)

```env
# Database - Production DB (use managed service)
DATABASE_URL="postgresql://prod_user:strong_password@prod-db.region.rds.amazonaws.com:5432/altfaze"

# Auth - Must use secure generation
NEXTAUTH_SECRET="production-generated-secret-very-long-and-random"
NEXTAUTH_URL="https://altfaze.com"
NEXT_PUBLIC_APP_URL="https://altfaze.com"

# All providers - Production keys
GOOGLE_CLIENT_ID="production-google-id"
GOOGLE_CLIENT_SECRET="production-google-secret"
GITHUB_CLIENT_ID="production-github-id"
GITHUB_CLIENT_SECRET="production-github-secret"

# Payment - Production keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxx"
STRIPE_SECRET_KEY="sk_live_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_prod_xxxxx"

# Analytics
NEXT_PUBLIC_GA_ID="G-PRODUCTION-ID"

# Email
RESEND_API_KEY="re_prod_xxxxx"

NODE_ENV="production"
```

## Vercel Deployment

1. Connect GitHub repository to Vercel
2. Add all environment variables in Vercel dashboard:
   - Settings → Environment Variables
3. For production, use different keys than staging

**Important:**
- Never commit `.env.local` to version control
- Use `.gitignore` to exclude env files
- Rotate secrets regularly

## Security Best Practices

1. **Never share secrets** - Keep all keys private
2. **Rotate regularly** - Update keys every 90 days
3. **Use different keys** per environment
4. **Limit permissions** - Grant minimal required access
5. **Store securely** - Use password manager or Vercel secrets
6. **Audit access** - Monitor who has access to secrets

## Testing Environment Variables

```bash
# Check if all required vars are set
npm run check-env

# Print (safe) environment info (won't show secrets)
npm run env:check

# Local development with all features
NODE_ENV=development npm run dev
```

## Troubleshooting

### "NEXTAUTH_SECRET is missing"
```bash
# Generate and add to .env.local
openssl rand -base64 32
```

### OAuth Redirect Mismatch
- Ensure `NEXTAUTH_URL` matches domain
- Check OAuth app settings for correct callback URLs
- For dev: use `http://localhost:3000/api/auth/callback/[provider]`

### Database Connection Failed
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Run migrations
npx prisma migrate dev
```

### Cloudinary Upload Issues
- Verify `CLOUDINARY_URL` format
- Check folder permissions in Cloudinary dashboard
- Ensure upload preset is created

## Migration Helpers

```bash
# Reset database (dev only!)
npm run db:reset

# Create new migration
npx prisma migrate dev --name add_feature

# Check pending migrations
npx prisma migrate status

# Apply migrations to staging/prod
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Support

For issues:
1. Check `.env.example` for correct format
2. Verify service credentials are active
3. Check service status pages
4. Review application logs in `/logs`

---

**Last Updated:** May 2, 2026
**Maintained by:** ALTFaze Team
