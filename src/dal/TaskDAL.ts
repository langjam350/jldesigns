// src/dal/TaskDAL.ts
import axios from 'axios';
import ITask from '../models/ITask';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
  ? 'https://dev.wellnessworldwideweb.com' 
  : 'https://www.wellnessworldwideweb.com';

export interface ITaskDAL {
  createTask(taskType: string, config: any): Promise<ITask>;
  getTaskById(taskId: string): Promise<ITask | null>;
  getTasksByPostId(postId: string): Promise<ITask[]>;
  updateTaskStatus(taskId: string, status: string, result?: any): Promise<boolean>;
}

export default class TaskDAL implements ITaskDAL {
  /**
   * Create a new task record in the database
   * @param taskType Type of task to create
   * @param config Task configuration data
   * @returns The created task object
   */
  public async createTask(taskType: string, config: any): Promise<ITask> {
    try {
      const response = await axios.post(`${BASE_URL}/api/task/create`, {
        type: taskType,
        config
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to create task: ${response.data.message}`);
      }

      return response.data.task;
    } catch (error: any) {
      console.error('Error creating task record in DAL:', error);
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Get task by ID
   * @param taskId Task ID to retrieve
   * @returns Task object or null if not found
   */
  public async getTaskById(taskId: string): Promise<ITask | null> {
    try {
      const response = await axios.get(`${BASE_URL}/api/task/${taskId}`);
      
      if (!response.data.success) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to get task: ${response.data.message}`);
      }
      
      return response.data.task;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error('Error getting task by ID in DAL:', error);
      throw new Error(`Failed to get task: ${error.message}`);
    }
  }

  /**
   * Get tasks by post ID
   * @param postId Post ID to query tasks for
   * @returns Array of tasks
   */
  public async getTasksByPostId(postId: string): Promise<ITask[]> {
    try {
      const response = await axios.get(`${BASE_URL}/api/task/status?postId=${postId}`);
      
      if (!response.data.success) {
        throw new Error(`Failed to get tasks: ${response.data.message}`);
      }
      
      return response.data.tasks || [];
    } catch (error: any) {
      console.error('Error getting tasks by post ID in DAL:', error);
      throw new Error(`Failed to get tasks: ${error.message}`);
    }
  }

  /**
   * Update task status and result
   * @param taskId Task ID to update
   * @param status New task status
   * @param result Optional result data
   * @returns Success status
   */
  public async updateTaskStatus(taskId: string, status: string, result?: any): Promise<boolean> {
    try {
      const response = await axios.put(`${BASE_URL}/api/task/${taskId}`, {
        status,
        result
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to update task: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error updating task in DAL:', error);
      throw new Error(`Failed to update task: ${error.message}`);
    }
  }
}