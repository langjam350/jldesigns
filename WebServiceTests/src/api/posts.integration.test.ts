import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';

describe('Posts API Integration Tests', () => {
  let testPostIds: string[] = [];

  afterAll(async () => {
    // Cleanup test data
    await global.testHelpers.cleanupTestData(testPostIds);
  });

  describe('POST /api/posts/addPost', () => {
    it('should successfully create a new post', async () => {
      // Arrange
      const testPost = global.testHelpers.generateTestPost({
        title: 'Integration Test Post',
        content: 'This post was created by integration tests'
      });

      // Act
      const response = await axios.post('/api/posts/addPost', testPost);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('postId');
      
      // Store for cleanup
      testPostIds.push(testPost.postId);
    });

    it('should return error for invalid post data', async () => {
      // Arrange
      const invalidPost = {
        // Missing required fields
        title: ''
      };

      // Act & Assert
      try {
        await axios.post('/api/posts/addPost', invalidPost);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
        expect(error.response.status).toBeLessThan(500);
      }
    });
  });

  describe('GET /api/posts/getAllPosts', () => {
    it('should return array of posts', async () => {
      // Act
      const response = await axios.get('/api/posts/getAllPosts');

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('posts');
      expect(Array.isArray(response.data.posts)).toBe(true);
    });

    it('should return posts with correct structure', async () => {
      // Act
      const response = await axios.get('/api/posts/getAllPosts');

      // Assert
      expect(response.status).toBe(200);
      if (response.data.posts.length > 0) {
        const post = response.data.posts[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('postId');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('URL');
        expect(post).toHaveProperty('videos');
        expect(Array.isArray(post.videos)).toBe(true);
      }
    });
  });

  describe('GET /api/posts/getPostsWithMetadata', () => {
    it('should return posts with metadata', async () => {
      // Act
      const response = await axios.get('/api/posts/getPostsWithMetadata');

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        const postWithMetadata = response.data[0];
        expect(postWithMetadata).toHaveProperty('videoCount');
        expect(typeof postWithMetadata.videoCount).toBe('number');
      }
    });
  });

  describe('GET /api/posts/getNextPostForVideoGeneration', () => {
    it('should return next post for video generation or null', async () => {
      // Act
      const response = await axios.get('/api/posts/getNextPostForVideoGeneration');

      // Assert
      expect(response.status).toBe(200);
      
      if (response.data) {
        expect(response.data).toHaveProperty('postId');
        expect(response.data).toHaveProperty('title');
        expect(response.data).toHaveProperty('content');
      }
    });
  });

  describe('POST /api/posts/addVideoToPost', () => {
    let testPostId: string;

    beforeAll(async () => {
      // Create a test post first
      const testPost = global.testHelpers.generateTestPost();
      const response = await axios.post('/api/posts/addPost', testPost);
      testPostId = testPost.postId;
      testPostIds.push(testPostId);
    });

    it('should successfully add video to existing post', async () => {
      // Arrange
      const videoId = global.testHelpers.generateRandomId();

      // Act
      const response = await axios.post('/api/posts/addVideoToPost', {
        postId: testPostId,
        videoId: videoId
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('message');
    });

    it('should return error for non-existent post', async () => {
      // Arrange
      const nonExistentPostId = 'non-existent-post-id';
      const videoId = global.testHelpers.generateRandomId();

      // Act & Assert
      try {
        await axios.post('/api/posts/addVideoToPost', {
          postId: nonExistentPostId,
          videoId: videoId
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /api/posts/addTopicToQueue', () => {
    it('should successfully add topic to queue', async () => {
      // Arrange
      const topic = `Test Topic ${Date.now()}`;

      // Act
      const response = await axios.post('/api/posts/addTopicToQueue', {
        topic: topic
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });

    it('should return error for empty topic', async () => {
      // Arrange
      const emptyTopic = '';

      // Act & Assert
      try {
        await axios.post('/api/posts/addTopicToQueue', {
          topic: emptyTopic
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /api/posts/approveVideoWithPostId', () => {
    let testPostId: string;

    beforeAll(async () => {
      // Create a test post first
      const testPost = global.testHelpers.generateTestPost();
      const response = await axios.post('/api/posts/addPost', testPost);
      testPostId = testPost.postId;
      testPostIds.push(testPostId);
    });

    it('should successfully approve post', async () => {
      // Act
      const response = await axios.post('/api/posts/approveVideoWithPostId', {
        postId: testPostId
      });

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('message');
    });

    it('should return error for non-existent post', async () => {
      // Arrange
      const nonExistentPostId = 'non-existent-post-id';

      // Act & Assert
      try {
        await axios.post('/api/posts/approveVideoWithPostId', {
          postId: nonExistentPostId
        });
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});