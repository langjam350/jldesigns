import IFile from '../models/IFile';

export interface IFileService {
  getCategories(): Promise<string[]>;
  uploadFile(file: { name: string; data: string }, metadata: Partial<IFile>): Promise<{ success: boolean; url?: string }>;
  getFileMetadata(fileId: string): Promise<IFile>;
  deleteFile(fileId: string): Promise<boolean>;
  getUploadedFiles(): Promise<IFile[]>; // New method added
}

export default class FileService implements IFileService {
  private BASE_URL: string;

  constructor() {
    this.BASE_URL =
      process.env.NEXT_PUBLIC_APP_ENV === 'development'
        ? 'https://dev.jlangdesigns.com'
        : 'https://www.jlangdesigns.com';
  }

  public async getCategories(): Promise<string[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/file/getAllCategories`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  public async uploadFile(
    file: { name: string; data: string },
    metadata: Partial<IFile>
  ): Promise<{ success: boolean; url?: string }> {
    try {
      const payload = { file, metadata };
      const response = await fetch(`${this.BASE_URL}/api/file/uploadFile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'File upload failed');
      }
  
      const data = await response.json();
      return {
        success: true,
        url: data.url
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false
      };
    }
  }

  public async getFileMetadata(fileId: string): Promise<IFile> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/file/metadata/${fileId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch file metadata');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching file metadata:', error);
      throw error;
    }
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/file/delete/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete file');
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  public async getUploadedFiles(): Promise<IFile[]> {
    try {
      const response = await fetch(`${this.BASE_URL}/api/file/getAllPublicResources`);
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
  
      const files: IFile[] = await response.json();
      return files;
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  }
 
}