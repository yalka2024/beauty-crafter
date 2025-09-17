# Development Setup Guide

This guide will help you set up the Beauty Crafter platform for local development.

## 🚀 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **PostgreSQL 14+** - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

## 📋 Initial Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd beauty-crafter
```

### 2. Install Dependencies

```bash
npm install
```

**Note**: If you encounter dependency conflicts, try:
```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration

Create your local environment file:

```bash
cp env.example .env
```

Edit `.env` and configure these essential variables:

```env
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/beauty_crafter"

# NextAuth (Required)
NEXTAUTH_SECRET="your-development-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Development Settings
NODE_ENV="development"
NEXT_PUBLIC_DEBUG_MODE="true"
```

## 🗄️ Database Setup

### 1. Create Database

Connect to PostgreSQL and create the database:

```sql
CREATE DATABASE beauty_crafter;
CREATE USER beauty_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE beauty_crafter TO beauty_user;
```

### 2. Run Database Setup

Use the automated setup script:

```bash
node scripts/setup-database.js
```

This script will:
- Generate Prisma client
- Run database migrations
- Seed the database with sample data

### 3. Manual Database Setup (Alternative)

If the automated script fails:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx tsx prisma/seed.ts
```

### 4. Verify Database Connection

```bash
npx prisma studio
```

This opens Prisma Studio in your browser where you can view and edit data.

## 🧪 Testing Setup

### 1. Run Tests

```bash
# All tests
npm test

# Specific test file
npm test -- __tests__/lib/security-middleware.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### 2. Test Database

Tests use a separate test database. Ensure your `.env` includes:

```env
# Test database (separate from development)
TEST_DATABASE_URL="postgresql://username:password@localhost:5432/beauty_crafter_test"
```

## 🚀 Development Server

### 1. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 2. Development Features

- **Hot Reload**: Automatic page refresh on file changes
- **TypeScript**: Real-time type checking
- **ESLint**: Code quality checks
- **Prettier**: Code formatting

## 📱 Mobile Development

### 1. Setup React Native

```bash
cd "New folder/BeautyCrafterMobile"
npm install
```

### 2. Start Mobile Development

```bash
npm start
```

This opens Expo DevTools where you can:
- Run on iOS Simulator
- Run on Android Emulator
- Run on physical device via Expo Go app

## 🔧 Development Tools

### 1. VS Code Extensions

Install these recommended extensions:

- **ES7+ React/Redux/React-Native snippets**
- **Prisma**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **ESLint**
- **Prettier**

### 2. VS Code Settings

Add to your `.vscode/settings.json`:

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## 📊 Monitoring & Debugging

### 1. OpenTelemetry Tracing

The platform includes comprehensive tracing. View traces in your browser's developer tools.

### 2. Performance Monitoring

Check the Performance tab in browser dev tools for:
- Component render times
- API call performance
- Bundle analysis

### 3. Error Tracking

Errors are logged to the console and can be viewed in:
- Browser console
- Network tab
- Application tab

## 🧹 Development Workflow

### 1. Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

### 2. Pre-commit Hooks

The project uses Husky for pre-commit hooks:
- Automatic linting
- Type checking
- Test running

### 3. Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## 🔒 Security Development

### 1. CSRF Testing

Test CSRF protection:

```bash
npm test -- __tests__/lib/csrf.test.ts
```

### 2. Security Middleware

Test security features:

```bash
npm test -- __tests__/lib/security-middleware.test.ts
```

### 3. Rate Limiting

Test rate limiting in development by making rapid API calls.

## 📚 API Development

### 1. API Routes

API routes are located in `app/api/`. Each route includes:
- Input validation with Zod
- Error handling
- Response formatting
- Security checks

### 2. Testing APIs

Test your APIs using:
- **Postman** or **Insomnia**
- **Thunder Client** (VS Code extension)
- **Browser dev tools**

### 3. API Documentation

Document your APIs using JSDoc comments:

```typescript
/**
 * @api {post} /api/booking Create booking
 * @apiName CreateBooking
 * @apiGroup Booking
 * @apiParam {String} serviceId Service ID
 * @apiParam {String} scheduledAt Appointment time
 * @apiSuccess {Object} booking Created booking object
 */
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U username -d beauty_crafter
```

#### 2. Port Conflicts

If port 3000 is in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Dependency Issues

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific failing test
npm test -- --testNamePattern="should generate CSRF tokens"
```

### Getting Help

1. Check the [Issues](../../issues) page
2. Review the [Documentation](./)
3. Check the [README](../README.md)
4. Contact the development team

## 🚀 Next Steps

After completing setup:

1. **Explore the Codebase**: Familiarize yourself with the project structure
2. **Run the Application**: Start the dev server and explore the UI
3. **Review Tests**: Understand the testing patterns
4. **Check Database**: Use Prisma Studio to explore the data
5. **Make Changes**: Start developing your features

## 📝 Development Standards

- **Code Style**: Follow the established patterns
- **Testing**: Write tests for new functionality
- **Documentation**: Document new features and APIs
- **Commits**: Use conventional commit messages
- **PRs**: Include tests and documentation updates

---

**Happy Coding! 🎉**
