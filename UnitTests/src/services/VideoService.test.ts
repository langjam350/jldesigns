import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Mock VideoService for testing
class VideoService {
  public async createVideo(postId: string, type: string, language: string = 'en'): Promise<{ success: boolean; videoId?: string; error?: string }> {
    try {
      if (!postId || !type) {
        return { success: false, error: 'Missing required parameters' };
      }

      if (!['scripted', 'scrolling'].includes(type)) {
        return { success: false, error: 'Invalid video type' };
      }

      const response = await fetch('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type, language }),
      });

      if (!response.ok) {
        return { success: false, error: response.statusText };
      }

      const data = await response.json() as { videoId: string };
      return { success: true, videoId: data.videoId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  public async generateTextToSpeech(text: string, language: string = 'en', voice?: string): Promise<{ success: boolean; audioUrl?: string; duration?: number; error?: string }> {
    try {
      if (!text.trim()) {
        return { success: false, error: 'Text cannot be empty' };
      }

      const response = await fetch('/api/video/generateTextToSpeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language, voice }),
      });

      if (!response.ok) {
        return { success: false, error: response.statusText };
      }

      const data = await response.json() as { audioUrl: string; duration: number };
      return { 
        success: true, 
        audioUrl: data.audioUrl, 
        duration: data.duration 
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  public async generateScriptedVideo(config: any): Promise<{ success: boolean; taskId?: string; error?: string }> {
    try {
      const { postId, script, images, audioFile, durationInSeconds } = config;

      if (!postId || !script || !images || !audioFile) {
        return { success: false, error: 'Missing required configuration' };
      }

      if (!Array.isArray(images) || images.length === 0) {
        return { success: false, error: 'Images array cannot be empty' };
      }

      const response = await fetch('/api/video/generateScriptedVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        return { success: false, error: response.statusText };
      }

      const data = await response.json() as { taskId: string };
      return { success: true, taskId: data.taskId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('VideoService', () => {
  let videoService: VideoService;

  beforeEach(() => {
    videoService = new VideoService();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  describe('createVideo', () => {
    it('should successfully create a video request', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ videoId: 'video-123', status: 'pending' })
      } as any;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await videoService.createVideo('post-123', 'scripted', 'en');

      // Assert
      expect(result.success).toBe(true);
      expect(result.videoId).toBe('video-123');
      expect(mockFetch).toHaveBeenCalledWith('/api/video/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: 'post-123', type: 'scripted', language: 'en' })
      });
    });

    it('should return error for missing postId', async () => {
      // Act
      const result = await videoService.createVideo('', 'scripted');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters');
    });

    it('should return error for invalid video type', async () => {
      // Act
      const result = await videoService.createVideo('post-123', 'invalid-type');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid video type');
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        statusText: 'Internal Server Error'
      } as any;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await videoService.createVideo('post-123', 'scripted');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal Server Error');
    });
  });

  describe('generateTextToSpeech', () => {
    it('should successfully generate text-to-speech', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ 
          audioUrl: 'https://example.com/audio.mp3', 
          duration: 15.5 
        })
      } as any;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await videoService.generateTextToSpeech('Hello world', 'en', 'en-US-Wavenet-D');

      // Assert
      expect(result.success).toBe(true);
      expect(result.audioUrl).toBe('https://example.com/audio.mp3');
      expect(result.duration).toBe(15.5);
      expect(mockFetch).toHaveBeenCalledWith('/api/video/generateTextToSpeech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello world', language: 'en', voice: 'en-US-Wavenet-D' })
      });
    });

    it('should return error for empty text', async () => {
      // Act
      const result = await videoService.generateTextToSpeech('   ');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Text cannot be empty');
    });

    it('should use default language when not specified', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ audioUrl: 'test.mp3', duration: 10 })
      } as any;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      await videoService.generateTextToSpeech('Hello world');

      // Assert
      const callBody = JSON.parse((mockFetch.mock.calls[0][1] as any).body);
      expect(callBody.language).toBe('en');
    });
  });

  describe('generateScriptedVideo', () => {
    it('should successfully generate scripted video', async () => {
      // Arrange
      const config = {
        postId: 'post-123',
        script: 'This is a test script',
        images: ['image1.jpg', 'image2.jpg'],
        audioFile: 'audio.mp3',
        durationInSeconds: 30
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ taskId: 'task-456', status: 'processing' })
      } as any;
      mockFetch.mockResolvedValue(mockResponse);

      // Act
      const result = await videoService.generateScriptedVideo(config);

      // Assert
      expect(result.success).toBe(true);
      expect(result.taskId).toBe('task-456');
      expect(mockFetch).toHaveBeenCalledWith('/api/video/generateScriptedVideo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    });

    it('should return error for missing required fields', async () => {
      // Arrange
      const incompleteConfig = {
        postId: 'post-123',
        script: 'Test script'
        // Missing images and audioFile
      };

      // Act
      const result = await videoService.generateScriptedVideo(incompleteConfig);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required configuration');
    });

    it('should return error for empty images array', async () => {
      // Arrange
      const configWithEmptyImages = {
        postId: 'post-123',
        script: 'Test script',
        images: [],
        audioFile: 'audio.mp3'
      };

      // Act
      const result = await videoService.generateScriptedVideo(configWithEmptyImages);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Images array cannot be empty');
    });
  });
});