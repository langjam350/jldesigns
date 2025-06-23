// src/utils/taskManager.ts
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { TaskStatus } from '../models/ITask';

export async function updateTaskStatus(taskId: string, status: TaskStatus, result?: any) {
  try {
    // Find the task document
    const tasksCollection = collection(db, 'tasks');
    const q = query(tasksCollection, where('id', '==', taskId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`[TaskManager] Task ${taskId} not found, cannot update status`);
      return { success: false, message: 'Task not found' };
    }
    
    const taskDoc = querySnapshot.docs[0];
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (result) {
      updateData.result = result;
    }
    
    // Update the task
    await updateDoc(doc(db, 'tasks', taskDoc.id), updateData);
    console.log(`[TaskManager] Updated task ${taskId} status to ${status}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[TaskManager] Error updating task ${taskId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getTaskById(taskId: string) {
  try {
    const tasksCollection = collection(db, 'tasks');
    const q = query(tasksCollection, where('id', '==', taskId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return { ...querySnapshot.docs[0].data(), id: taskId };
  } catch (error) {
    console.error(`[TaskManager] Error getting task ${taskId}:`, error);
    return null;
  }
}