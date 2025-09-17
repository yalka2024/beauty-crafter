const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^react-native$': '<rootDir>/__mocks__/react-native.js',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    '^twilio$': '<rootDir>/__mocks__/twilio.ts',
  },

  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],

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
    '!**/New folder/**'
  ],

  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },

  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  testTimeout: 15000,
  
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  transformIgnorePatterns: [
    '/node_modules/(?!(@sentry|react-native|expo|@expo|@react-native|react-native-.*)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/build/',
    '<rootDir>/New folder/'
  ],

  clearMocks: true,
  restoreMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  
  testResultsProcessor: 'jest-sonar-reporter',
  globalSetup: '<rootDir>/jest.global-setup.js',
  globalTeardown: '<rootDir>/jest.global-teardown.js',
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  
  testEnvironmentOptions: {
    url: 'http://localhost:3000'
  },

  modulePaths: ['<rootDir>'],
  roots: ['<rootDir>'],
  
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}

module.exports = createJestConfig(customJestConfig)
