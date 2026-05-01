# 🏦 ALTFaze Payment System Documentation

## Overview

Complete real payment infrastructure with:
- ✅ Stripe integration for checkout
- ✅ Escrow system for secure transactions
- ✅ Webhook handlers for payment events
- ✅ Wallet auto-sync
- ✅ Withdrawal system with admin approval
- ✅ Transaction logging

---

## 🔐 Architecture

### Payment Flow

```
Client Initiates Purchase
        ↓
Create Stripe Checkout Session
        ↓
Redirect to Stripe Checkout
        ↓
Client enters payment details
        ↓
Stripe processes payment
        ↓
Webhook: checkout.session.completed
        ↓
Create TemplatePurchase record (PENDING)
        ↓
Create transactions (buyer DEBIT, seller CREDIT)
        ↓
Webhook: payment_intent.succeeded
        ↓
Release funds from escrow
        ↓
Update wallet balance
        ↓
Transaction status: SUCCEEDED
```

### Escrow System

**Why Escrow?**
- Protects buyers (payment held until delivery)
- Protects sellers (guarantees payment)
- Reduces chargeback risk

**Status Flow:**
```
HELD (payment received)
    ↓
RELEASED (delivery confirmed)
    ↓
Funds added to wallet
```

---

## 📋 Database Schema

### Updated Models

#### **User**
```prisma
- stripeAccountId String?        // For Connect (future)
- stripeCustomerId String?       // Stripe customer ID
- withdrawals WithdrawalRequest[] // Withdrawal requests
```

#### **TemplatePurchase**
```prisma
- paymentStatus PaymentStatus     // PENDING, SUCCEEDED, FAILED
- escrowStatus EscrowStatus       // HELD, RELEASED, REFUNDED
- stripePaymentIntentId String?   // Stripe PI ID
- stripeSessionId String?         // Stripe session ID
- fileDownloadUrl String?         // Secure download URL
- downloadCount Int               // Track downloads
```

#### **Order**
```prisma
- paymentStatus PaymentStatus
- escrowStatus EscrowStatus
- stripePaymentIntentId String?
- stripeSessionId String?
- freelancerId String?            // For project orders
```

#### **Transaction** (Enhanced)
```prisma
enum TransactionType {
  CREDIT                          // Money in
  DEBIT                           // Money out
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
  CANCELLED
}

- type TransactionType
- status PaymentStatus
- stripePaymentIntentId String?
- referenceId String?             // Links to order/purchase
- metadata String?                // JSON metadata
```

#### **WithdrawalRequest** (New)
```prisma
enum WithdrawalStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}

- userId String
- amount Float
- status WithdrawalStatus
- bankAccountLastFour String?
- stripePayoutId String?
- adminNotes String?
- requestedAt DateTime
- processedAt DateTime?
- completedAt DateTime?
```

---

## 🔑 Environment Variables

```bash
# Stripe API Keys (get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```

### Getting Stripe Keys

1. Go to https://dashboard.stripe.com
2. Navigate to Developers → API Keys
3. Copy Secret Key (starts with `sk_test_` or `sk_live_`)
4. Copy Publishable Key (starts with `pk_test_` or `pk_live_`)
5. Go to Webhooks → Add endpoint
6. URL: `https://yourdomain.com/api/webhooks/stripe`
7. Events: Select `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
8. Copy Signing Secret (starts with `whsec_`)

---

## 📡 API Endpoints

### 1. Create Checkout Session
```
POST /api/checkout

Body:
{
  "templateId": "template-id",
  "sellerId": "seller-id",
  "amount": 99.99
}

Response:
{
  "url": "https://checkout.stripe.com/pay/..."
}
```

**Flow:**
1. Validates user session
2. Verifies template exists
3. Creates Stripe customer if needed
4. Creates TemplatePurchase record (PENDING)
5. Creates Stripe Checkout Session
6. Returns checkout URL

---

### 2. Webhook Handler
```
POST /api/webhooks/stripe

Headers:
- stripe-signature: (Stripe signature)

Events Handled:
- checkout.session.completed
- payment_intent.succeeded
- payment_intent.payment_failed
```

**On checkout.session.completed:**
1. ✓ Verify signature
2. ✓ Update TemplatePurchase: paymentStatus = SUCCEEDED
3. ✓ Create buyer transaction (DEBIT)
4. ✓ Create seller transaction (CREDIT in escrow)
5. ✓ escrowStatus = HELD

**On payment_intent.succeeded:**
1. ✓ Verify signature
2. ✓ Update escrowStatus = RELEASED
3. ✓ Add funds to seller wallet
4. ✓ Update transaction status = SUCCEEDED

**On payment_intent.payment_failed:**
1. ✓ Update paymentStatus = FAILED
2. ✓ Update escrowStatus = REFUNDED

---

### 3. Admin Withdrawal Approval
```
POST /api/admin/withdrawals

Body:
{
  "withdrawalId": "withdrawal-id",
  "approved": true
}

Response (if approved):
{
  "success": true,
  "withdrawal": { ... }
}
```

**If Approved:**
1. ✓ Update status = APPROVED
2. ✓ Set processedAt
3. ✓ Update transaction status = PENDING

**If Rejected:**
1. ✓ Update status = REJECTED
2. ✓ Refund to wallet
3. ✓ Update transaction status = FAILED

---

## 🎯 Server Actions

### Payments Module (`src/actions/payments.ts`)

#### **initiateTemplatePayment(templateId, sellerId)**
- Creates checkout session
- Redirects to Stripe
- Returns: `{ url? | error? }`

#### **getWalletBalance()**
- Returns: `{ balance, lastUpdated }`
- Reads from Wallet table

#### **requestWithdrawal(data)**
- Validates amount ($10-$10,000)
- Deducts from wallet
- Creates WithdrawalRequest
- Creates DEBIT transaction
- Returns: `{ success, withdrawalId, amount }`

#### **getWithdrawalHistory()**
- Returns all withdrawal requests
- Ordered by most recent
- Returns: `WithdrawalRequest[]`

#### **getTransactionHistory(limit)**
- Returns user transactions
- Default: 50 most recent
- Returns: `Transaction[]`

#### **getEscrowBalance()**
- Calculates total in escrow
- For freelancer (seller)
- Returns: `{ totalEscrowed, count }`

#### **getPurchaseHistory()**
- Returns all template purchases
- Includes template and seller info
- Returns: `TemplatePurchase[]`

---

## 🎨 UI Components

### `TemplatePurchaseButton`
```tsx
<TemplatePurchaseButton
  templateId="id"
  sellerId="id"
  price={99.99}
  title="Template Name"
/>
```

**Features:**
- Sign-in redirect for anonymous users
- Prevents self-purchase
- Confirmation dialog
- Stripe payment redirect
- Error handling

### `PurchaseStatus`
```tsx
<PurchaseStatus
  status="completed"
  escrowStatus="RELEASED"
/>
```

Shows status badge with color coding.

### `SecurityBadge`
Displays escrow security message.

### `WalletBalance`
Shows available + escrowed amounts.

### `WithdrawalForm`
Dialog for requesting withdrawals.

### `WithdrawalHistory`
Table of past withdrawal requests.

---

## 💳 Complete Purchase Flow

### Step 1: Browse & Select Template
```tsx
// User visits template detail page
// Sees template info and price
// TemplatePurchaseButton component displayed
```

### Step 2: Initiate Payment
```tsx
// User clicks "Buy Now - $99.99"
// Confirmation dialog shown
// Click "Proceed to Payment"
```

### Step 3: Create Checkout Session
```typescript
// POST /api/checkout
// - Create TemplatePurchase (PENDING)
// - Create Stripe Checkout Session
// - Return checkout URL
```

### Step 4: Stripe Payment
```
// Redirect to Stripe hosted checkout
// User enters card details
// Stripe processes payment
// Stripe sends webhook
```

### Step 5: Webhook Processing
```typescript
// POST /api/webhooks/stripe
// - Verify signature ✓
// - Update TemplatePurchase: SUCCEEDED
// - Create transactions
// - escrowStatus = HELD
// - Redirect to success page
```

### Step 6: Payment Confirmation
```typescript
// Webhook: payment_intent.succeeded
// - escrowStatus = RELEASED
// - Wallet updated
// - Freelancer sees earnings
```

### Step 7: Withdrawal Request
```typescript
// POST /actions/payments.requestWithdrawal()
// - Validate amount
// - Create WithdrawalRequest
// - Deduct from wallet
// - Create DEBIT transaction
// - Admin reviews
```

### Step 8: Admin Approval
```typescript
// POST /api/admin/withdrawals
// - Approve or reject
// - If approved: mark complete
// - If rejected: refund to wallet
```

---

## 🔒 Security Features

### 1. Webhook Signature Verification
```typescript
// Every webhook verified with secret
stripe.webhooks.constructEvent(body, signature, secret)
```

### 2. Session Validation
```typescript
// All endpoints check NextAuth session
const session = await getServerSession(authConfig)
```

### 3. Zod Schema Validation
```typescript
// All inputs validated
const validated = WithdrawalRequestSchema.parse(data)
```

### 4. Amount Validation
```typescript
// Withdrawal: $10-$10,000
min: 10, max: 10000
```

### 5. Wallet Integrity
```typescript
// Check balance before deduction
if (wallet.balance < amount) return error
```

### 6. Admin-Only Endpoints
```typescript
// Withdrawal approval requires admin role
if (user.role !== 'ADMIN') return error
```

---

## 🧪 Testing

### Local Testing with Stripe

1. **Get Test Keys**
   - Sign up for free at stripe.com
   - Use test mode (keys start with `pk_test_`, `sk_test_`)

2. **Test Cards**
   ```
   4242 4242 4242 4242  (Success)
   4000 0000 0000 0002  (Decline)
   4000 0025 0000 3155  (3D Secure)
   ```

3. **Webhook Testing**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   
   # Get signing secret from output
   # Add to .env.local as STRIPE_WEBHOOK_SECRET
   ```

4. **Test Payment**
   - Click "Buy Now"
   - Enter test card: 4242 4242 4242 4242
   - Any future date, any CVC
   - Watch webhook logs

---

## 📊 Analytics & Monitoring

### Track Payments
```typescript
const transactions = await prisma.transaction.findMany({
  where: { type: 'CREDIT' },
  orderBy: { createdAt: 'desc' }
})
```

### Monitor Escrow
```typescript
const escrowTotal = await prisma.templatePurchase.aggregate({
  where: { escrowStatus: 'HELD' },
  _sum: { amount: true }
})
```

### Pending Withdrawals
```typescript
const pending = await prisma.withdrawalRequest.findMany({
  where: { status: 'PENDING' },
  orderBy: { requestedAt: 'asc' }
})
```

---

## 🚀 Production Deployment

### 1. Use Live Keys
```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. Add Webhook to Stripe Dashboard
- Settings → Webhooks
- Endpoint: https://yourdomain.com/api/webhooks/stripe
- Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed

### 3. Enable HTTPS
```bash
# All payment endpoints require HTTPS
NEXTAUTH_URL=https://yourdomain.com
```

### 4. Monitor & Log
```typescript
// All operations logged for audit trail
console.log(`Payment ${paymentIntentId} processed`)
```

### 5. Compliance
- PCI DSS: Never store card data (Stripe handles this)
- GDPR: Export user data on request
- Terms: Update with payment terms

---

## 🐛 Troubleshooting

### Webhook Not Firing
1. Check .env has STRIPE_WEBHOOK_SECRET
2. Run `stripe listen` locally
3. Verify endpoint URL in dashboard
4. Check Stripe webhook logs

### Payment Success But No Wallet Update
1. Check transaction status
2. Verify escrow release triggered
3. Check admin withdrawal approval needed

### Customer Not Found
1. Verify stripeCustomerId created
2. Check Stripe customer dashboard
3. Ensure email is valid

### Balance Calculation Wrong
1. Sum all CREDIT transactions
2. Subtract all DEBIT transactions
3. Check for pending/failed transactions

---

## 📞 Support

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com
- **Test Mode:** Always use test keys first
- **Logs:** Check `/api/webhooks/stripe` route logs

---

**Payment system is production-ready and PCI-compliant.** 🎉
