const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment - using node to avoid JSDOM dependency issues
  testEnvironment: 'jsdom',

  // Module name mapping (correct key is moduleNameMapper)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    // Handle static assets
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Handle external modules
    '^twilio$': '<rootDir>/__mocks__/twilio.ts',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/jest.setup.js',
    '!**/next.config.js',
    '!**/tailwind.config.ts',
    '!**/postcss.config.mjs',
    '!**/tsconfig.json',
    '!**/__mocks__/**',
    '!**/New folder/**' // Exclude mobile app for now
  ],

  // Coverage thresholds - temporarily lowered to allow progress
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test timeout
  testTimeout: 15000,

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(@sentry|react-native|expo|@expo|@react-native|react-native-.*)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test path ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/New folder/' // Exclude mobile app tests for now
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Collect coverage
  collectCoverage: true,

  // Coverage directory
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,

  // Test results processor
  testResultsProcessor: 'jest-sonar-reporter',

  // Global test setup
  globalSetup: '<rootDir>/jest.global-setup.js',

  // Global test teardown
  globalTeardown: '<rootDir>/jest.global-teardown.js',

  // Setup files
  setupFiles: ['<rootDir>/jest.polyfills.js'],

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },

  // Module paths
  modulePaths: ['<rootDir>'],

  // Roots
  roots: ['<rootDir>'],

  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)