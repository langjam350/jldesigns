// Global test setup
import { jest } from '@jest/globals';

// Mock fetch globally for unit tests
global.fetch = jest.fn();

// Mock process.env for testing
process.env.NEXT_PUBLIC_APP_ENV = 'development';

// Setup console to capture logs in tests
beforeEach(() => {
  jest.clearAllMocks();
});