// src/dal/VideoDAL.ts
import axios from 'axios';
import { IVideo }  from '../models/IVideo';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
  ? 'http://localhost:4000' 
  : 'https://jldesigns.vercel.app';

export interface IVideoDAL {
  createVideo(videoData: Partial<IVideo>): Promise<string>;
  getVideoById(videoId: string): Promise<IVideo | null>;
  getVideosByPostId(postId: string): Promise<IVideo[]>;
  updateVideo(videoId: string, updates: Partial<IVideo>): Promise<boolean>;
}

export default class VideoDAL implements IVideoDAL {
  /**
   * Create a new video record in the database
   * @param videoData Video data to insert
   * @returns The ID of the created video
   */
  public async createVideo(videoData: Partial<IVideo>): Promise<string> {
    try {
      const response = await axios.post(`${BASE_URL}/api/video/create`, videoData);
      
      if (!response.data.success) {
        throw new Error(`Failed to create video record: ${response.data.message}`);
      }

      return response.data.videoId;
    } catch (error: any) {
      console.error('Error creating video record in DAL:', error);
      throw new Error(`Failed to create video: ${error.message}`);
    }
  }

  /**
   * Get video by ID
   * @param videoId Video ID to retrieve
   * @returns Video object or null if not found
   */
  public async getVideoById(videoId: string): Promise<IVideo | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/video/${videoId}`);
      
      if (!response.data.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get video: ${response.data.message}`);
      }
      
      return response.data.video;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error getting video by ID in DAL:', error);
      throw new Error(`Failed to get video: ${error.message}`);
    }
  }

  /**
   * Get videos by post ID
   * @param postId Post ID to query videos for
   * @returns Array of videos
   */
  public async getVideosByPostId(postId: string): Promise<IVideo[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/video/by-post/${postId}`);
      
      if (!response.data.success) {
        throw new Error(`Failed to get videos: ${response.data.message}`);
      }
      
      return response.data.videos || [];
    } catch (error: any) {
      console.error('Error getting videos by post ID in DAL:', error);
      throw new Error(`Failed to get videos: ${error.message}`);
    }
  }

  /**
   * Update video record
   * @param videoId Video ID to update
   * @param updates Fields to update
   * @returns Success status
   */
  public async updateVideo(videoId: string, updates: Partial<IVideo>): Promise<boolean> {
    try {
      const response = await axios.patch(`${BASE_URL}/api/video/${videoId}`, updates);
      
      if (!response.data.success) {
        throw new Error(`Failed to update video: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error updating video in DAL:', error);
      throw new Error(`Failed to update video: ${error.message}`);
    }
  }
}