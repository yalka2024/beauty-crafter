# 🚀 **Production Deployment Checklist**

## ✅ **CRITICAL - Must Have Before Deployment**

### **1. Core Application Variables (REQUIRED)**
Add these to Vercel Dashboard → Settings → Environment Variables:

```bash
# Core App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXTAUTH_URL=https://your-domain.vercel.app

# Authentication (CRITICAL)
NEXTAUTH_SECRET=your-super-secure-random-string-here-32-chars-minimum

# Database (CRITICAL - Choose ONE option)
DATABASE_URL=postgresql://username:password@host:port/database
```

### **2. Database Options (Choose ONE)**

**Option A: Vercel Postgres (Recommended)**
```bash
DATABASE_URL=postgres://default:password@ep-hostname-pooler.us-east-1.postgres.vercel-storage.com/verceldb
```

**Option B: Supabase (Free Tier Available)**
```bash
DATABASE_URL=postgresql://postgres.projectref:password@aws-0-region.pooler.supabase.com:5432/postgres
```

**Option C: Railway/PlanetScale/Other**
```bash
DATABASE_URL=your-database-provider-connection-string
```

---

## 🔧 **OPTIONAL - For Full Functionality**

### **3. Payment Processing (For Booking/Payments)**
```bash
# Stripe (Recommended)
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### **4. Communication Services (For Notifications)**
```bash
# Email (SendGrid/Resend)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
RESEND_API_KEY=re_your_resend_api_key
FROM_EMAIL=noreply@your-domain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACyour_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### **5. AI Features (For Smart Recommendations)**
```bash
OPENAI_API_KEY=sk-your_openai_api_key
```

### **6. OAuth Providers (For Social Login)**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### **7. File Storage (For Image Uploads)**
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name
AWS_REGION=us-east-1
```

### **8. Monitoring (Recommended)**
```bash
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project-id
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-your_ga_id
```

---

## 🎯 **MINIMUM VIABLE DEPLOYMENT**

**For a basic working deployment, you ONLY need:**

1. ✅ `NODE_ENV=production`
2. ✅ `NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app`
3. ✅ `NEXTAUTH_URL=https://your-domain.vercel.app`
4. ✅ `NEXTAUTH_SECRET=your-secure-secret`
5. ✅ `DATABASE_URL=your-database-connection-string`

---

## 📋 **Pre-Deployment Steps**

### **Step 1: Set Up Database**
1. Choose a database provider (Vercel Postgres recommended)
2. Create database instance
3. Copy connection string to `DATABASE_URL`

### **Step 2: Generate Secrets**
```bash
# Generate NEXTAUTH_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **Step 3: Configure Vercel**
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the 5 critical variables above

### **Step 4: Deploy**
```bash
vercel --prod
```

---

## 🚨 **Current Status Check**

**Build Issues Fixed:** ✅
- ✅ Vercel configuration conflicts resolved
- ✅ Missing dependencies installed
- ✅ TailwindCSS configuration fixed
- ✅ Prisma client generation added to build

**Ready for Deployment:** 🟡 **PENDING ENVIRONMENT VARIABLES**

**Next Action:** Configure the 5 critical environment variables in Vercel Dashboard, then run `vercel --prod`

---

## 🔗 **Quick Setup Links**

- **Vercel Postgres:** https://vercel.com/dashboard/stores
- **Supabase:** https://supabase.com/dashboard/projects
- **Generate Secrets:** Use crypto.randomBytes() or https://generate-secret.vercel.app/
- **Vercel Env Vars:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

---

**🎉 Once you've added the 5 critical variables, the platform will be ready for production deployment!**
