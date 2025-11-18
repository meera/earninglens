# MarketHawk TODO

## 🔥 HIGH PRIORITY - Web App (Stripe Subscription Flow)

### Setup Tasks (Required to enable payments)
- [ ] **Get Stripe Price ID from payment link dashboard**
  - Go to: https://dashboard.stripe.com/products
  - Find the $39/month product
  - Copy the Price ID (starts with `price_`)

- [ ] **Add STRIPE_STANDARD_PRICE_ID to Vercel environments**
  ```bash
  vercel env add STRIPE_STANDARD_PRICE_ID production preview development
  # Paste: price_xxxxxxxxxxxxx
  ```

- [ ] **Set up Stripe webhook endpoint**
  - Go to: https://dashboard.stripe.com/webhooks
  - Click "Add endpoint"
  - URL: `https://markethawkeye.com/api/auth/stripe/webhook`
  - Description: "Better Auth subscription webhooks"

- [ ] **Configure webhook events**
  - Select these events:
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.paid`
    - `invoice.payment_failed`
  - Save and copy the webhook signing secret (already in Vercel as `STRIPE_WEBHOOK_SECRET`)

### Testing Tasks (After setup complete)
- [ ] **Test subscription checkout flow end-to-end**
  - Sign in as test user
  - Click "Subscribe" button
  - Complete payment in Stripe
  - Verify redirect back to site

- [ ] **Verify webhook receives payment events**
  - Check Vercel logs for webhook events
  - Confirm `checkout.session.completed` event received

- [ ] **Confirm user subscriptionTier updates in database**
  - Query database: `SELECT email, subscriptionTier, stripeCustomerId FROM markethawkeye.user`
  - Verify `subscriptionTier` changed from `free` to `standard`

- [ ] **Test subscription cancellation flow**
  - Go to Stripe customer portal
  - Cancel subscription
  - Verify webhook updates user to `free` tier

---

## 🐛 BUGS TO FIX - Web App

### Google OAuth Error
- [ ] **Fix Google OAuth "invalid_code" error**
  - Go to: https://console.cloud.google.com/apis/credentials
  - Edit OAuth client: `705115709352-16lr9pg6228ub9909ldvgsgjigh2nj58`
  - Add authorized redirect URIs:
    - `https://markethawkeye.com/api/auth/callback/google`
    - `https://www.markethawkeye.com/api/auth/callback/google`
    - `http://localhost:3000/api/auth/callback/google`
  - Save changes

- [ ] **Fix GOOGLE_CLIENT_SECRET leading space in Vercel**
  ```bash
  vercel env rm GOOGLE_CLIENT_SECRET production
  vercel env add GOOGLE_CLIENT_SECRET production
  # Paste: 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 (no leading space!)
  ```

### Domain Redirect Issue
- [ ] **Fix www → non-www redirect loop**
  - Currently: `markethawkeye.com` redirects to `www.markethawkeye.com`
  - Expected: `www.markethawkeye.com` should redirect to `markethawkeye.com`
  - Check Vercel domain settings or DNS configuration

---

## 📋 FUTURE ENHANCEMENTS - Web App (Monetization Features - Deferred)

### Paywall Implementation
- [ ] Implement 50% audio/video playback limit for free users
- [ ] Create AudioPlayer component with playback restrictions
- [ ] Add AnonymousPaywall component (for non-logged-in users)
- [ ] Add FreeTierPaywall component (for daily limit reached)
- [ ] Create ViewCounter component
- [ ] Uncomment `earnings_call_views` table in schema
- [ ] Implement daily view tracking logic (10 calls/day for free tier)

### Premium Tier (Future)
- [ ] Add "Premium" tier ($99/month or custom pricing)
- [ ] Define Premium tier benefits
- [ ] Update pricing page with 3 tiers (Free, Standard, Premium)

### User Experience
- [ ] Add billing page (`/billing`) for subscription management
- [ ] Create Stripe customer portal integration
- [ ] Add email notifications for:
  - Welcome email on subscription
  - Payment receipt
  - Subscription renewal reminder
  - Cancellation confirmation

---

## 🎥 VIDEO PIPELINE TODO

### High Priority - Video Generation

#### Thumbnail Validation Agent
**Need**: Automated thumbnail validation to ensure quality before upload
**Requirements**:
- Check text readability (sufficient contrast with background)
- Verify MarketHawk branding is visible
- Verify company branding (logo/colors) is prominent
- Ensure thumbnail is visually attractive and engaging
- Flag thumbnails that don't meet quality standards

**Implementation Ideas**:
- Use image analysis (PIL/OpenCV) to check contrast ratios
- OCR to verify text is readable
- Brand color detection (check for company brand colors)
- Visual quality metrics (sharpness, composition)

**Priority**: High (quality control for YouTube thumbnails)

---

### Critical Issues - Video Pipeline

#### 1. Context Length Exceeded for Insights Extraction
**Error**: Transcript is 522k tokens, but OpenAI model limit is 128k tokens
**File**: `lens/extract_insights.py`
**Impact**: Cannot extract insights from full transcript

**Solutions to explore**:
1. **Chunk the transcript** - Process in smaller segments
2. **Use longer context model** - GPT-4 Turbo 128k or Claude 200k
3. **Summarize first** - Create summary, then extract insights
4. **Extract incrementally** - Process sections (revenue, EPS, guidance separately)

Make sure transcript.paragraphs.json is used to send to LLM.
**Priority**: Medium (MVP works without insights)

---

### MVP Completed - Video Pipeline
- [x] Download video
- [x] Parse metadata
- [x] Remove silence
- [x] Transcribe with Whisper
- [x] Create PLTR Q3 2025 composition
- [x] Audio playback in Remotion Studio
- [x] Simple banner overlay (next)
- [ ] Upload to YouTube

---

### Future Enhancements - Video Pipeline
- [ ] Fix SimpleBanner to use TailwindCSS instead of inline styles (currently using inline styles as workaround)
- [ ] Update all render commands to work from root directory (currently requires cd studio/)
- [ ] Fix rendering to work with symbolic links in public/audio/ (currently fails with 404 on Mac, may work on sushi)
- [ ] Fix context length issue for insights
- [ ] Add transcript subtitles overlay
- [ ] Add charts and visualizations
- [ ] Add speaker identification
- [ ] Add key quote highlights
- [ ] Generate thumbnail

---

## ✅ COMPLETED - Web App

- [x] Fix TypeScript error in dropdown-menu component
- [x] Add insights and transcripts columns to earnings_calls table
- [x] Rename artifacts → transcripts in database
- [x] Apply migrations to local and production databases
- [x] Add favicon with hawk logo
- [x] Configure Better Auth Stripe plugin
- [x] Update pricing page (Free vs Standard)
- [x] Add Pricing link to navigation
- [x] Add Subscribe button to user profile menu
- [x] Enable cross-subdomain cookies for auth
- [x] Remove .env.vercel from git (security fix)
- [x] Rename Premium → Standard subscription tier
- [x] Deploy to Vercel with environment variables

---

**Last Updated:** 2024-11-17
