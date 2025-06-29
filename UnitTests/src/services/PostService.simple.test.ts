import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Simple mock of PostService for testing
class PostService {
  async addPost(post: any): Promise<boolean> {
    if (!post.postId) return false;
    
    // Mock API call
    const response = await fetch('/api/posts/addPost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });
    
    return response.ok;
  }

  async getAllPosts(): Promise<any[]> {
    const response = await fetch('/api/posts/getAllPosts');
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.posts || [];
  }
}

// Setup mocks
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    service = new PostService();
    jest.clearAllMocks();
  });

  describe('addPost', () => {
    it('should return true when post is added successfully', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      const post = { postId: 'test-1', title: 'Test Post' };

      // Act
      const result = await service.addPost(post);

      // Assert
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/addPost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });
    });

    it('should return false when post is missing required fields', async () => {
      // Arrange
      const post = { title: 'Test Post' }; // Missing postId

      // Act
      const result = await service.addPost(post);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' })
      });

      const post = { postId: 'test-1', title: 'Test Post' };

      // Act
      const result = await service.addPost(post);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getAllPosts', () => {
    it('should return posts when API call succeeds', async () => {
      // Arrange
      const mockPosts = [
        { id: '1', postId: 'post-1', title: 'Post 1' },
        { id: '2', postId: 'post-2', title: 'Post 2' }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ posts: mockPosts })
      });

      // Act
      const result = await service.getAllPosts();

      // Assert
      expect(result).toEqual(mockPosts);
      expect(mockFetch).toHaveBeenCalledWith('/api/posts/getAllPosts');
    });

    it('should return empty array when API call fails', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      });

      // Act
      const result = await service.getAllPosts();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when response has no posts', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({})
      });

      // Act
      const result = await service.getAllPosts();

      // Assert
      expect(result).toEqual([]);
    });
  });
});