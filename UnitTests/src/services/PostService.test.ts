import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import PostService from './PostService';
import IPost from '../models/IPost';
import { createMockResponse } from '../test-helpers';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('PostService', () => {
  let postService: PostService;

  beforeEach(() => {
    postService = new PostService();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  describe('addPost', () => {
    it('should successfully add a post', async () => {
      // Arrange
      const mockPost: Partial<IPost> = {
        postId: 'test-post-1',
        title: 'Test Post',
        content: 'This is a test post',
        slug: 'test-post'
      };

      const mockResponse = createMockResponse({ success: true });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.addPost(mockPost);

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/addPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"postId":"test-post-1"')
      });
    });

    it('should return false when API call fails', async () => {
      // Arrange
      const mockPost: Partial<IPost> = {
        postId: 'test-post-1',
        title: 'Test Post'
      };

      const mockResponse = createMockResponse({}, false, 'Internal Server Error');
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.addPost(mockPost);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockPost: Partial<IPost> = {
        postId: 'test-post-1',
        title: 'Test Post'
      };

      mockFetch.mockRejectedValue(new Error('Network error'));

      // Act
      const result = await postService.addPost(mockPost);

      // Assert
      expect(result).toBe(false);
    });

    it('should set default values for new posts', async () => {
      // Arrange
      const mockPost: Partial<IPost> = {
        postId: 'test-post-1',
        title: 'Test Post'
      };

      const mockResponse = createMockResponse({ success: true });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await postService.addPost(mockPost);

      // Assert
      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody).toMatchObject({
        postId: 'test-post-1',
        title: 'Test Post',
        videos: [],
        URL: expect.stringContaining('localhost:4000/posts/test-post-1')
      });
      expect(callBody.createdAt).toBeDefined();
      expect(callBody.updatedAt).toBeDefined();
    });
  });

  describe('getAllPosts', () => {
    it('should fetch and return all posts', async () => {
      // Arrange
      const mockPosts: IPost[] = [
        {
          id: '1',
          postId: 'post-1',
          title: 'Post 1',
          URL: 'http://localhost:4000/posts/post-1',
          videos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          postId: 'post-2', 
          title: 'Post 2',
          URL: 'http://localhost:4000/posts/post-2',
          videos: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockResponse = createMockResponse({ posts: mockPosts });
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.getAllPosts();

      // Assert
      expect(result).toEqual(mockPosts);
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/getAllPosts');
    });

    it('should return empty array when API call fails', async () => {
      // Arrange
      const mockResponse = createMockResponse({}, false, 'Not Found');
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.getAllPosts();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getPostById', () => {
    it('should fetch and return a specific post', async () => {
      // Arrange
      const postId = 'test-post-1';
      const mockPost: IPost = {
        id: '1',
        postId: postId,
        title: 'Test Post',
        URL: 'http://localhost:4000/posts/test-post-1',
        videos: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ post: mockPost })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.getPostById(postId);

      // Assert
      expect(result).toEqual(mockPost);
      expect(mockFetch).toHaveBeenCalledWith(`/api/posts/getPostById?postId=${postId}`);
    });

    it('should return null when post not found', async () => {
      // Arrange
      const postId = 'non-existent-post';
      const mockResponse = createMockResponse({}, false, 'Not Found');
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.getPostById(postId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('addVideoToPost', () => {
    it('should successfully add video to post', async () => {
      // Arrange
      const postId = 'test-post-1';
      const videoId = 'test-video-1';
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          success: true, 
          message: 'Video added successfully' 
        })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.addVideoToPost(postId, videoId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Video added successfully');
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/addVideoToPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, videoId })
      });
    });

    it('should handle API errors when adding video to post', async () => {
      // Arrange
      const postId = 'test-post-1';
      const videoId = 'test-video-1';
      const mockResponse = createMockResponse({}, false, 'Internal Server Error');
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await postService.addVideoToPost(postId, videoId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});