// Jest polyfills for Node.js environment
global.fetch = jest.fn()
global.Headers = jest.fn()
global.Request = jest.fn()
global.Response = jest.fn()

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}
