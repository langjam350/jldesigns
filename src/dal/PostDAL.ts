// src/dal/PostDAL.ts
import axios from 'axios';
import IPost, { IPostWithMetadata } from '../models/IPost';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
  ? 'http://localhost:4000' 
  : 'https://jldesigns.vercel.app';

export interface IPostDAL {
  addPost(post: Partial<IPost>): Promise<IPost>;
  getAllPosts(): Promise<IPost[]>;
  getPostsWithMetadata(): Promise<IPostWithMetadata[]>;
  getNextPostForVideoGeneration(): Promise<IPostWithMetadata | null>;
  addVideoToPost(postId: string, videoId: string): Promise<boolean>;
  updatePostToVideoGenerated(postId: string): Promise<boolean>;
  approveVideoWithPostId(postId: string): Promise<boolean>;
  addTopicToQueue(topic: string): Promise<boolean>;
}

export default class PostDAL implements IPostDAL {
  public async addPost(post: Partial<IPost>): Promise<IPost> {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts/addPost`, post);
      
      if (!response.data.success) {
        throw new Error(`Failed to add post: ${response.data.message}`);
      }
      
      return response.data.post;
    } catch (error: any) {
      console.error('Error adding post in DAL:', error);
      throw new Error(`Failed to add post: ${error.message}`);
    }
  }

  public async getAllPosts(): Promise<IPost[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/posts/getAllPosts`);
      
      if (!response.data.success) {
        throw new Error(`Failed to get posts: ${response.data.message}`);
      }
      
      return response.data.posts || [];
    } catch (error: any) {
      console.error('Error getting posts in DAL:', error);
      throw new Error(`Failed to get posts: ${error.message}`);
    }
  }

  public async getPostsWithMetadata(): Promise<IPostWithMetadata[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/posts/getPostsWithMetadata`);
      
      if (!response.data.success) {
        throw new Error(`Failed to get posts with metadata: ${response.data.message}`);
      }
      
      return response.data.posts || [];
    } catch (error: any) {
      console.error('Error getting posts with metadata in DAL:', error);
      throw new Error(`Failed to get posts with metadata: ${error.message}`);
    }
  }

  public async getNextPostForVideoGeneration(): Promise<IPostWithMetadata | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/posts/getNextPostForVideoGeneration`);
      
      if (!response.data.success) {
        if (response.data.message === 'No posts available for video generation') {
          return null;
        }
        throw new Error(`Failed to get next post: ${response.data.message}`);
      }
      
      return response.data.post || null;
    } catch (error: any) {
      console.error('Error getting next post in DAL:', error);
      throw new Error(`Failed to get next post: ${error.message}`);
    }
  }

  public async addVideoToPost(postId: string, videoId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts/addVideoToPost`, {
        postId,
        videoId
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to add video to post: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error adding video to post in DAL:', error);
      throw new Error(`Failed to add video to post: ${error.message}`);
    }
  }

  public async updatePostToVideoGenerated(postId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts/updatePostToVideoGenerated`, {
        postId
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to update post: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error updating post in DAL:', error);
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  public async approveVideoWithPostId(postId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts/approveVideoWithPostId`, {
        postId
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to approve video: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error approving video in DAL:', error);
      throw new Error(`Failed to approve video: ${error.message}`);
    }
  }

  public async addTopicToQueue(topic: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BASE_URL}/api/posts/addTopicToQueue`, {
        topic
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to add topic: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error adding topic in DAL:', error);
      throw new Error(`Failed to add topic: ${error.message}`);
    }
  }
}