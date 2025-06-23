// src/dal/FileDAL.ts
import axios from 'axios';
import IFile from '../models/IFile';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
  ? 'https://dev.wellnessworldwideweb.com' 
  : 'https://www.wellnessworldwideweb.com';

export interface IFileDAL {
  uploadFile(file: { name: string, data: string }, options?: { type?: string, category?: string }): Promise<{ url: string, fileName: string }>;
  getAllCategories(): Promise<string[]>;
  getAllPublicResources(category?: string): Promise<IFile[]>;
  getAudioFileForVideoID(videoId: string): Promise<string | null>;
  generateImages(prompt: string, n?: number): Promise<string[]>;
}

export default class FileDAL implements IFileDAL {
  public async uploadFile(file: { name: string, data: string }, options?: { type?: string, category?: string }): Promise<{ url: string, fileName: string }> {
    try {
      const response = await axios.post(`${BASE_URL}/api/file/uploadFile`, {
        file,
        options
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to upload file: ${response.data.message}`);
      }
      
      return {
        url: response.data.url,
        fileName: response.data.fileName
      };
    } catch (error: any) {
      console.error('Error uploading file in DAL:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  public async getAllCategories(): Promise<string[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/file/getAllCategories`);
      
      if (!response.data.success) {
        throw new Error(`Failed to get categories: ${response.data.message}`);
      }
      
      return response.data.categories || [];
    } catch (error: any) {
      console.error('Error getting categories in DAL:', error);
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  public async getAllPublicResources(category?: string): Promise<IFile[]> {
    try {
      let url = `${BASE_URL}/api/file/getAllPublicResources`;
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }
      
      const response = await axios.get(url);
      
      if (!response.data.success) {
        throw new Error(`Failed to get resources: ${response.data.message}`);
      }
      
      return response.data.resources || [];
    } catch (error: any) {
      console.error('Error getting resources in DAL:', error);
      throw new Error(`Failed to get resources: ${error.message}`);
    }
  }

  public async getAudioFileForVideoID(videoId: string): Promise<string | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/file/getAudioFileForVideoID?videoId=${videoId}`);
      
      if (!response.data.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get audio file: ${response.data.message}`);
      }
      
      return response.data.audioFileUrl || null;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error getting audio file in DAL:', error);
      throw new Error(`Failed to get audio file: ${error.message}`);
    }
  }

  public async generateImages(prompt: string, n: number = 1): Promise<string[]> {
    try {
      const response = await axios.post(`${BASE_URL}/api/file/generateImages`, {
        prompt,
        n
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to generate images: ${response.data.message}`);
      }
      
      return response.data.imageUrls || [];
    } catch (error: any) {
      console.error('Error generating images in DAL:', error);
      throw new Error(`Failed to generate images: ${error.message}`);
    }
  }
}