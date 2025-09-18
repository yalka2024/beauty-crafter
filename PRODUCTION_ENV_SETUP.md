# 🔑 Production Environment Variables Setup

## 🚨 **CRITICAL - Required for Production**

### **Add these to Vercel Dashboard > Settings > Environment Variables:**

```bash
# 1. Authentication (CRITICAL)
NEXTAUTH_SECRET=33e797d0d7ff4a1f4fa160480f2e2907ba879a7c3e6301d6e0e2406ff7a6258a
NEXTAUTH_URL=https://beauty-crafter.vercel.app

# 2. Application URLs (CRITICAL)
NEXT_PUBLIC_APP_URL=https://beauty-crafter.vercel.app
NODE_ENV=production

# 3. Database (CRITICAL - Choose one)
# Option A: Vercel Postgres (Recommended)
DATABASE_URL=postgres://default:password@ep-hostname-pooler.us-east-1.postgres.vercel-storage.com/verceldb

# Option B: Supabase (Free)
# DATABASE_URL=postgresql://postgres.projectref:password@aws-0-region.pooler.supabase.com:5432/postgres

# Option C: PlanetScale (Free)
# DATABASE_URL=mysql://username:password@aws.connect.psdb.cloud/database-name?sslaccept=strict
```

## 💰 **PAYMENTS - Required for Financial Features**

```bash
# Stripe (Global Payments)
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal (Optional - Americas/Europe)
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

## 📧 **COMMUNICATIONS - Required for Notifications**

```bash
# Email (SendGrid - Recommended)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@beauty-crafter.com

# SMS (Twilio - Global SMS)
TWILIO_ACCOUNT_SID=ACyour_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🤖 **AI FEATURES - Optional but Recommended**

```bash
# OpenAI (AI Recommendations)
OPENAI_API_KEY=sk-your_openai_api_key

# Google Maps (Location Services)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 📊 **MONITORING - Optional but Recommended**

```bash
# Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-your_ga_id

# Error Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
```

## 🔒 **SECURITY - Optional Overrides**

```bash
# Security Configuration
CSRF_SECRET=your_csrf_secret_key
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
ALLOWED_ORIGINS=https://beauty-crafter.vercel.app,https://beauty-crafter.com
```

## 🎯 **MINIMUM REQUIRED FOR PRODUCTION**

**Just these 4 variables will make your platform work:**

```bash
NEXTAUTH_SECRET=33e797d0d7ff4a1f4fa160480f2e2907ba879a7c3e6301d6e0e2406ff7a6258a
NEXTAUTH_URL=https://beauty-crafter.vercel.app
NEXT_PUBLIC_APP_URL=https://beauty-crafter.vercel.app
DATABASE_URL=your_database_connection_string
```

## 🚀 **Setup Steps**

### **1. Database Setup (Choose one):**

#### **🌟 Vercel Postgres (Recommended):**
1. Go to Vercel Dashboard > Storage
2. Click "Create Database" > PostgreSQL
3. Copy the connection string
4. Add as `DATABASE_URL`

#### **🆓 Supabase (Free Alternative):**
1. Go to supabase.com > New Project
2. Settings > Database > Connection String
3. Use the pooled connection string
4. Add as `DATABASE_URL`

### **2. Add Environment Variables:**
1. Go to Vercel Dashboard
2. Select your beauty-crafter project
3. Settings > Environment Variables
4. Add each variable with "All Environments" selected

### **3. Deploy:**
```bash
vercel --prod
```

## 📊 **Expected Results After Setup**

### **✅ With Minimum Config:**
- ✅ Platform loads globally
- ✅ User authentication works
- ✅ Database connectivity
- ✅ Basic functionality

### **✅ With Full Config:**
- ✅ Payment processing
- ✅ Email notifications
- ✅ SMS notifications
- ✅ AI features
- ✅ Analytics tracking
- ✅ Error monitoring

## 🎯 **Priority Order**

1. **🔴 Critical**: Database + Auth (Required)
2. **🟡 Important**: Payments (For transactions)
3. **🟢 Optional**: AI, Analytics, Monitoring

**Start with the 4 critical variables and deploy - your platform will work globally immediately!**
