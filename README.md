# Beauty Crafter Platform

A comprehensive beauty services platform connecting licensed beauty professionals with clients. Built with Next.js 14, React 18, Prisma, and TypeScript.

## 🚀 Features

### Core Platform
- **Multi-role Authentication**: Client, Provider, and Admin roles
- **Service Management**: Comprehensive service catalog with booking system
- **Provider Verification**: License, insurance, and background check verification
- **Payment Processing**: Stripe integration with platform commission
- **Real-time Communication**: In-app messaging between clients and providers
- **Review System**: Verified reviews with fraud prevention
- **Compliance Monitoring**: Automated compliance tracking and alerts

### Technical Features
- **Security**: CSRF protection, rate limiting, threat detection
- **Performance**: OpenTelemetry tracing, performance monitoring
- **Accessibility**: WCAG 2.1 AA compliance, screen reader support
- **Mobile**: React Native mobile app with Expo
- **Testing**: Comprehensive test suite with Jest and Playwright
- **CI/CD**: Automated testing and deployment pipelines

## 🏗️ Architecture

```
beauty-crafter/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── provider/          # Provider dashboard
│   ├── client/            # Client dashboard
│   └── admin/             # Admin panel
├── components/            # Reusable React components
├── lib/                   # Utility libraries
├── prisma/                # Database schema and migrations
├── __tests__/             # Test files
├── New folder/            # React Native mobile app
└── scripts/               # Development scripts
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **Payment**: Stripe
- **Mobile**: React Native, Expo
- **Testing**: Jest, Playwright, Testing Library
- **Monitoring**: OpenTelemetry, Sentry
- **Security**: CSRF protection, rate limiting, threat detection

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis (optional, for caching)
- Stripe account (for payments)
- Google Cloud account (for maps and OAuth)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd beauty-crafter
npm install
```

### 2. Environment Setup

Copy the environment template and configure your values:

```bash
cp env.example .env
```

Update the following critical variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/beauty_crafter"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (for payments)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Setup

Run the automated setup script:

```bash
node scripts/setup-database.js
```

Or manually:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx tsx prisma/seed.ts
```

### 4. Start Development

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔑 Test Accounts

After seeding, you can use these test accounts:

- **Admin**: `admin@beautycrafter.com` / `admin123`
- **Provider**: `sarah@beautysalon.com` / `provider123`
- **Client**: `emma@email.com` / `client123`

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm test -- __tests__/lib/security-middleware.test.ts
npm test -- __tests__/lib/csrf.test.ts
```

### Test Coverage
```bash
npm run test:coverage
```

### E2E Tests
```bash
npm run test:e2e
```

## 📱 Mobile Development

The mobile app is located in `New folder/BeautyCrafterMobile/`:

```bash
cd "New folder/BeautyCrafterMobile"
npm install
npm start
```

## 🗄️ Database Schema

The platform uses a comprehensive database schema with:

- **Users**: Multi-role user management
- **Providers**: Professional profiles with verification
- **Services**: Service catalog with availability
- **Bookings**: Appointment scheduling system
- **Payments**: Transaction tracking with Stripe
- **Reviews**: Verified review system
- **Compliance**: License and certification tracking

## 🔒 Security Features

- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: Configurable request rate limiting
- **Threat Detection**: Automated threat detection and blocking
- **Input Validation**: Comprehensive input sanitization
- **Security Headers**: OWASP-compliant security headers
- **Authentication**: Secure session management with NextAuth

## 📊 Monitoring & Observability

- **OpenTelemetry**: Distributed tracing and metrics
- **Performance Monitoring**: Real-time performance tracking
- **Error Tracking**: Comprehensive error logging and alerting
- **Health Checks**: Automated health monitoring
- **Logging**: Structured logging with correlation IDs

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```bash
docker build -t beauty-crafter .
docker run -p 3000:3000 beauty-crafter
```

### Environment Variables for Production
Ensure all production environment variables are set:
- Database connection strings
- API keys and secrets
- Monitoring and logging endpoints
- Security configurations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests
- Use conventional commit messages
- Follow the established code style
- Document new features and APIs

## 📚 API Documentation

The platform provides comprehensive REST APIs:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/user/*`
- **Services**: `/api/services/*`
- **Bookings**: `/api/booking/*`
- **Payments**: `/api/payments/*`
- **Reviews**: `/api/reviews/*`

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env
   - Ensure database exists and is accessible

2. **Authentication Issues**
   - Verify NextAuth configuration
   - Check OAuth provider settings
   - Ensure session cookies are working

3. **Payment Issues**
   - Verify Stripe keys are correct
   - Check webhook configuration
   - Ensure proper error handling

4. **Test Failures**
   - Run `npm run test:coverage` to identify issues
   - Check test database configuration
   - Verify all dependencies are installed

### Getting Help

- Check the [Issues](../../issues) page
- Review the [Documentation](./docs/)
- Contact the development team

## 📄 License

This project is proprietary software owned by Kryst Investments LLC.

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Prisma team for the powerful ORM
- Stripe for payment processing
- The open-source community for various libraries

---

**Built with ❤️ by the Beauty Crafter Team**
