// src/dal/AuthDAL.ts
import axios from 'axios';
import IUserInfo from '../models/IUserInfo';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
  ? 'https://dev.jlangdesigns.com' 
  : 'https://www.jlangdesigns.com';

export interface IAuthDAL {
  createUser(email: string, password: string, displayName: string): Promise<{ userId: string; email: string }>;
  signIn(email: string, password: string): Promise<{ userId: string; email: string; token: string }>;
  signOut(): Promise<boolean>;
  getCurrentUser(): Promise<{ userId: string; email: string } | null>;
  getUserInfo(userId: string): Promise<IUserInfo | null>;
  updateUserInfo(userId: string, userInfo: Partial<IUserInfo>): Promise<IUserInfo>;
}

export default class AuthDAL implements IAuthDAL {
  public async createUser(email: string, password: string, displayName: string): Promise<{ userId: string; email: string }> {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/createUser`, {
        email,
        password,
        displayName
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to create user: ${response.data.message}`);
      }
      
      return {
        userId: response.data.userId,
        email: response.data.email
      };
    } catch (error: any) {
      console.error('Error creating user in DAL:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  public async signIn(email: string, password: string): Promise<{ userId: string; email: string; token: string }> {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/signin`, {
        email,
        password
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to sign in: ${response.data.message}`);
      }
      
      return {
        userId: response.data.userId,
        email: response.data.email,
        token: response.data.token
      };
    } catch (error: any) {
      console.error('Error signing in user in DAL:', error);
      throw new Error(`Failed to sign in: ${error.message}`);
    }
  }

  public async signOut(): Promise<boolean> {
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/signout`);
      
      if (!response.data.success) {
        throw new Error(`Failed to sign out: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error signing out user in DAL:', error);
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }

  public async getCurrentUser(): Promise<{ userId: string; email: string } | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/user`);
      
      if (!response.data.success) {
        if (response.data.message === 'No authenticated user') {
          return null;
        }
        throw new Error(`Failed to get current user: ${response.data.message}`);
      }
      
      return {
        userId: response.data.userId,
        email: response.data.email
      };
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        return null;
      }
      console.error('Error getting current user in DAL:', error);
      throw new Error(`Failed to get current user: ${error.message}`);
    }
  }

  public async getUserInfo(userId: string): Promise<IUserInfo | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/userinfo?userId=${userId}`);
      
      if (!response.data.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get user info: ${response.data.message}`);
      }
      
      return response.data.userInfo;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error getting user info in DAL:', error);
      throw new Error(`Failed to get user info: ${error.message}`);
    }
  }

  public async updateUserInfo(userId: string, userInfo: Partial<IUserInfo>): Promise<IUserInfo> {
    try {
      const response = await axios.put(`${BASE_URL}/api/auth/userinfo`, {
        userId,
        ...userInfo
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to update user info: ${response.data.message}`);
      }
      
      return response.data.userInfo;
    } catch (error: any) {
      console.error('Error updating user info in DAL:', error);
      throw new Error(`Failed to update user info: ${error.message}`);
    }
  }
}