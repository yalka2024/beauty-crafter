// Test database configuration
const testConfig = {
  // Test database URL - use a separate test database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beauty_crafter_test',
  
  // Redis URL for testing
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Test environment variables
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/beauty_crafter_test',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-testing-only',
    ENCRYPTION_MASTER_KEY: 'test-encryption-key-32-chars-long',
    NEXTAUTH_SECRET: 'test-nextauth-secret',
    NEXTAUTH_URL: 'http://localhost:3000',
    STRIPE_SECRET_KEY: 'sk_test_fake_key_for_testing',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_fake_key_for_testing',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_fake_webhook_secret',
    TWILIO_ACCOUNT_SID: 'test_account_sid',
    TWILIO_AUTH_TOKEN: 'test_auth_token',
    TWILIO_PHONE_NUMBER: '+1234567890',
    OPENAI_SECRET_KEY: 'sk-test-fake-openai-key',
    RESEND_API_KEY: 're_test_fake_resend_key',
    FROM_EMAIL: 'test@beautycrafter.com',
    SENTRY_DSN: 'https://test@sentry.io/test',
    LOG_LEVEL: 'error', // Reduce log noise in tests
    CSRF_ENABLED: 'false', // Disable CSRF in tests
    RATE_LIMIT_ENABLED: 'false', // Disable rate limiting in tests
    MFA_ENABLED: 'false', // Disable MFA in tests for simplicity
    ENCRYPTION_ENABLED: 'false', // Disable encryption in tests for simplicity
  }
}

module.exports = testConfig
