# 🚀 Payment System Setup Guide

## Quick Start (5 minutes)

### 1. Get Stripe Keys
1. Sign up free at https://stripe.com
2. Go to Dashboard → Developers → API Keys
3. Copy both keys starting with `pk_test_` and `sk_test_`
4. Go to Webhooks → Add Endpoint
5. URL: `http://localhost:3000/api/webhooks/stripe` (local) or your domain
6. Events: Select all Stripe events
7. Copy webhook signing secret `whsec_...`

### 2. Update Environment
Edit `.env.local`:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migration
```bash
npx prisma migrate dev --name add_payment_system
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Start Development Server
```bash
npm run dev
```

### 7. Test Locally
```bash
# In another terminal:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Implementation Details

### Files Created

```
src/
├── actions/
│   └── payments.ts                 # Server actions
├── app/api/
│   ├── checkout/route.ts           # Create Stripe session
│   ├── admin/withdrawals/route.ts  # Approve withdrawals
│   └── webhooks/stripe/route.ts    # Webhook handler
└── components/payments/
    ├── purchase-button.tsx         # Buy template UI
    └── withdrawal.tsx              # Withdrawal UI

prisma/
└── schema.prisma                   # Updated with payment models
```

### Database Models Updated

1. **User** - Added Stripe customer/account IDs
2. **Order** - Added payment status, escrow, Stripe IDs
3. **TemplatePurchase** - Added payment tracking
4. **Transaction** - Enhanced with payment status
5. **WithdrawalRequest** - New model for withdrawals

---

## Integration Points

### For Template Purchase Page

```tsx
import { TemplatePurchaseButton } from '@/components/payments/purchase-button'

export default function TemplateDetailPage() {
  return (
    <div>
      {/* ... template info ... */}
      <TemplatePurchaseButton
        templateId={template.id}
        sellerId={template.creatorId}
        price={template.price}
        title={template.title}
      />
    </div>
  )
}
```

### For Freelancer Earnings Page

```tsx
import {
  WalletBalance,
  WithdrawalForm,
  WithdrawalHistory,
} from '@/components/payments/withdrawal'

export default function EarningsPage() {
  return (
    <div className="space-y-6">
      <WalletBalance />
      <WithdrawalForm />
      <WithdrawalHistory />
    </div>
  )
}
```

---

## API Reference

### Server Actions (use client-side or SSR)

```typescript
// Initiate purchase
const { url, error } = await initiateTemplatePayment(
  templateId,
  sellerId
)

// Get balance
const { balance, lastUpdated } = await getWalletBalance()

// Request withdrawal
const { success, withdrawalId } = await requestWithdrawal({
  amount: 100,
  bankAccount: '1234'
})

// Get history
const withdrawals = await getWithdrawalHistory()
const transactions = await getTransactionHistory()
const purchases = await getPurchaseHistory()
```

### API Routes

```typescript
// POST /api/checkout
// POST /api/webhooks/stripe
// POST /api/admin/withdrawals
```

---

## Security Checklist

- ✅ Webhook signature verified
- ✅ Session validation on all endpoints
- ✅ Zod schema validation
- ✅ Escrow protects both parties
- ✅ Admin approval for withdrawals
- ✅ Transaction logging
- ✅ Amount validation ($10-$10k)
- ✅ PCI compliance (no card storage)

---

## Testing

### Test Cards

| Card | Use Case |
|------|----------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Payment declined |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 5555 5555 5555 4444 | Mastercard success |

### Test a Full Payment

1. Navigate to template detail page
2. Click "Buy Now - $XX.XX"
3. Confirm purchase
4. Use test card 4242 4242 4242 4242
5. Future expiry date, any CVC (e.g., 12/25, 123)
6. Watch webhook terminal for events
7. Check database for TemplatePurchase record
8. Verify wallet updated for seller

### Monitor Webhooks

```bash
# Start local webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Output: Ready! Your webhook signing secret is: whsec_...
# Copy to .env.local as STRIPE_WEBHOOK_SECRET
```

---

## Troubleshooting

### Issue: "Webhook signature verification failed"
**Solution:** 
1. Ensure STRIPE_WEBHOOK_SECRET is set
2. Run `stripe listen` to forward webhooks
3. Copy the signing secret from output

### Issue: "TemplatePurchase payment succeeded but wallet not updated"
**Solution:**
1. Check webhook logs in terminal
2. Verify payment_intent.succeeded event fired
3. Check Transaction table for CREDIT entry
4. Confirm escrowStatus changed to RELEASED

### Issue: Stripe checkout redirects to 404
**Solution:**
1. Verify API route exists: `/api/checkout`
2. Check NEXTAUTH_URL is correct
3. Ensure user is authenticated

### Issue: Withdrawal button doesn't appear
**Solution:**
1. Verify user is FREELANCER role
2. Check wallet balance > $10
3. Ensure transaction history loads

---

## Production Deployment

### Before Going Live

1. **Get Live Keys**
   - Switch Stripe dashboard to Live mode
   - Copy live keys (start with `pk_live_`, `sk_live_`)

2. **Update Environment**
   ```bash
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```

3. **Configure Webhook**
   - Stripe Dashboard → Webhooks
   - Add endpoint: https://yourdomain.com/api/webhooks/stripe
   - Copy live signing secret

4. **Update .env**
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```

5. **Enable HTTPS**
   - All payment endpoints require HTTPS
   - Use Let's Encrypt (free)

6. **Test Stripe Test Mode First**
   - Keep test cards for testing
   - Monitor webhook logs
   - Verify transaction flow

7. **Legal**
   - Add payment terms to TOS
   - Privacy policy mentions Stripe
   - Escrow policy documentation

---

## Monitoring & Analytics

### Check Platform Payments

```sql
-- Total revenue in escrow
SELECT SUM(amount) FROM "TemplatePurchase" 
WHERE "escrowStatus" = 'HELD';

-- Released to freelancers
SELECT SUM(amount) FROM "TemplatePurchase" 
WHERE "escrowStatus" = 'RELEASED';

-- Pending withdrawals
SELECT SUM(amount) FROM "WithdrawalRequest" 
WHERE status = 'PENDING';
```

### Monitor via Stripe Dashboard

- Payments → Overview: See all transactions
- Logs → Events: Check webhook delivery
- Customers: View customer profiles
- Disputes: Handle chargebacks

---

## Support Resources

- **Stripe Docs:** https://stripe.com/docs/payments
- **API Reference:** https://stripe.com/docs/api
- **Test Mode:** https://stripe.com/docs/testing
- **Webhooks:** https://stripe.com/docs/webhooks
- **Support:** https://support.stripe.com

---

## Next Steps

1. ✅ Stripe integration complete
2. ✅ Webhook handlers ready
3. ✅ Escrow system active
4. ✅ Wallet auto-sync
5. ✅ Withdrawal system operational

### Optional Enhancements

- Stripe Connect for direct payouts
- Subscription support
- Advanced fraud detection
- Chargeback monitoring
- Revenue reporting dashboard
- Tax documentation export
- Payment reconciliation

---

**Your payment system is production-ready!** 🎉
