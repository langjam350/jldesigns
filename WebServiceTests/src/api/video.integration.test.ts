import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios from 'axios';

describe('Video API Integration Tests', () => {
  let testPostIds: string[] = [];

  afterAll(async () => {
    // Cleanup test data
    await global.testHelpers.cleanupTestData(testPostIds);
  });

  describe('POST /api/video/create', () => {
    let testPostId: string;

    beforeAll(async () => {
      // Create a test post first
      const testPost = global.testHelpers.generateTestPost({
        title: 'Video Test Post',
        content: 'This post is for video generation testing'
      });
      const response = await axios.post('/api/posts/addPost', testPost);
      testPostId = testPost.postId;
      testPostIds.push(testPostId);
    });

    it('should successfully create video generation request', async () => {
      // Arrange
      const videoRequest = {
        postId: testPostId,
        type: 'scripted',
        language: 'en'
      };

      // Act
      const response = await axios.post('/api/video/create', videoRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('videoId');
      expect(response.data).toHaveProperty('status');
    });

    it('should return error for invalid video request', async () => {
      // Arrange
      const invalidRequest = {
        postId: 'invalid-post-id',
        type: 'invalid-type'
      };

      // Act & Assert
      try {
        await axios.post('/api/video/create', invalidRequest);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /api/video/generateTextToSpeech', () => {
    it('should successfully generate text-to-speech', async () => {
      // Arrange
      const ttsRequest = {
        text: 'This is a test text for speech generation',
        language: 'en',
        voice: 'en-US-Wavenet-D'
      };

      // Act
      const response = await axios.post('/api/video/generateTextToSpeech', ttsRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('audioUrl');
      expect(response.data).toHaveProperty('duration');
    });

    it('should return error for empty text', async () => {
      // Arrange
      const invalidRequest = {
        text: '',
        language: 'en'
      };

      // Act & Assert
      try {
        await axios.post('/api/video/generateTextToSpeech', invalidRequest);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /api/video/generateScriptedVideo', () => {
    let testPostId: string;

    beforeAll(async () => {
      // Create a test post first
      const testPost = global.testHelpers.generateTestPost({
        title: 'Scripted Video Test Post',
        content: 'This post is for scripted video generation testing with a longer content to ensure we have enough text for video generation.'
      });
      const response = await axios.post('/api/posts/addPost', testPost);
      testPostId = testPost.postId;
      testPostIds.push(testPostId);
    });

    it('should successfully create scripted video generation request', async () => {
      // Arrange
      const scriptedVideoRequest = {
        postId: testPostId,
        script: 'This is a test script for video generation',
        images: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg'
        ],
        audioFile: 'https://example.com/audio.mp3',
        durationInSeconds: 30
      };

      // Act
      const response = await axios.post('/api/video/generateScriptedVideo', scriptedVideoRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('taskId');
      expect(response.data).toHaveProperty('status');
    });

    it('should return error for missing required fields', async () => {
      // Arrange
      const invalidRequest = {
        postId: testPostId
        // Missing script, images, etc.
      };

      // Act & Assert
      try {
        await axios.post('/api/video/generateScriptedVideo', invalidRequest);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });

  describe('POST /api/video/generateScrollingVideo', () => {
    let testPostId: string;

    beforeAll(async () => {
      // Create a test post first
      const testPost = global.testHelpers.generateTestPost({
        title: 'Scrolling Video Test Post',
        content: 'This post is for scrolling video generation testing'
      });
      const response = await axios.post('/api/posts/addPost', testPost);
      testPostId = testPost.postId;
      testPostIds.push(testPostId);
    });

    it('should successfully create scrolling video generation request', async () => {
      // Arrange
      const scrollingVideoRequest = {
        postId: testPostId,
        content: 'This is test content for scrolling video generation',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        fontSize: 24,
        durationInSeconds: 15
      };

      // Act
      const response = await axios.post('/api/video/generateScrollingVideo', scrollingVideoRequest);

      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('taskId');
      expect(response.data).toHaveProperty('status');
    });

    it('should return error for missing content', async () => {
      // Arrange
      const invalidRequest = {
        postId: testPostId,
        backgroundColor: '#ffffff'
        // Missing content
      };

      // Act & Assert
      try {
        await axios.post('/api/video/generateScrollingVideo', invalidRequest);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});