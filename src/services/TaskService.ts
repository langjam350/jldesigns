// src/services/TaskService.ts

import axios from 'axios';
import ITask, { TaskStatus, TaskConfig } from '../models/ITask';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
    ? 'https://dev.jlangdesigns.com' 
    : 'https://www.jlangdesigns.com';

export interface ITaskService {
    createTask(type: string, config: TaskConfig): Promise<ITask>;
    getTaskById(id: string): Promise<ITask | null>;
    updateTaskStatus(id: string, status: TaskStatus, result?: any): Promise<ITask | null>;
    getTasksByStatus(status: TaskStatus): Promise<ITask[]>;
    getTasksByPostId(postId: string): Promise<ITask[]>;
}

export default class TaskService implements ITaskService {
    constructor() {}

    public async createTask(type: string, config: TaskConfig): Promise<ITask> {
        console.log(`[TaskService] Creating task of type ${type}`);
        
        try {
            const response = await axios.post(
                `${BASE_URL}/api/task/create`,
                {
                    type,
                    config
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            if (!response.data || !response.data.success) {
                throw new Error('Failed to create task');
            }
            
            console.log(`[TaskService] Created task ${response.data.task.id}`);
            return response.data.task;
        } catch (error) {
            console.error('[TaskService] Error creating task:', error);
            throw error;
        }
    }

    public async getTaskById(id: string): Promise<ITask | null> {
        try {
            const response = await axios.get(`${BASE_URL}/api/task/${id}`);
            
            if (!response.data || !response.data.success) {
                console.log(`[TaskService] Task not found: ${id}`);
                return null;
            }
            
            return response.data.task;
        } catch (error) {
            console.error(`[TaskService] Error getting task ${id}:`, error);
            return null;
        }
    }

    public async updateTaskStatus(id: string, status: TaskStatus, result?: any): Promise<ITask | null> {
        try {
            const response = await axios.put(
                `${BASE_URL}/api/task/${id}/status`,
                {
                    status,
                    result
                },
                {
                    headers: { 'Content-Type': 'application/json' }
                }
            );
            
            if (!response.data || !response.data.success) {
                throw new Error(`Failed to update task status for task ${id}`);
            }
            
            console.log(`[TaskService] Updated task ${id} status to ${status}`);
            return response.data.task;
        } catch (error) {
            console.error(`[TaskService] Error updating task ${id} status:`, error);
            throw error;
        }
    }

    public async getTasksByStatus(status: TaskStatus): Promise<ITask[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/task?status=${status}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(`Failed to get tasks with status ${status}`);
            }
            
            return response.data.tasks;
        } catch (error) {
            console.error(`[TaskService] Error getting tasks with status ${status}:`, error);
            return [];
        }
    }

    public async getTasksByPostId(postId: string): Promise<ITask[]> {
        try {
            const response = await axios.get(`${BASE_URL}/api/tasks?postId=${postId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(`Failed to get tasks for post ${postId}`);
            }
            
            return response.data.tasks;
        } catch (error) {
            console.error(`[TaskService] Error getting tasks for post ${postId}:`, error);
            return [];
        }
    }
}