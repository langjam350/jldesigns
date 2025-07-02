// Global test setup for API integration tests
import axios from 'axios';

// Base URL for DEV environment
export const BASE_URL = process.env.TEST_BASE_URL || 'https://dev.jlangdesigns.com';

// Configure axios defaults
axios.defaults.baseURL = BASE_URL;
axios.defaults.timeout = 30000;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Global test helpers
global.testHelpers = {
  generateRandomId: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  generateTestPost: (overrides: any = {}) => ({
    postId: global.testHelpers.generateRandomId(),
    title: 'Test Post',
    content: 'This is a test post for API integration testing',
    slug: 'test-post-slug',
    tags: ['test', 'api'],
    author: 'Test Author',
    isPublic: false,
    status: 'draft',
    ...overrides
  }),
  cleanupTestData: async (postIds: string[]) => {
    // Helper to cleanup test data after tests
    for (const postId of postIds) {
      try {
        await axios.delete(`/api/posts/${postId}`);
      } catch (error) {
        console.warn(`Failed to cleanup test post ${postId}:`, error);
      }
    }
  }
};

// Setup and teardown
beforeEach(() => {
  // Reset any state before each test
});

afterEach(() => {
  // Cleanup after each test if needed
});