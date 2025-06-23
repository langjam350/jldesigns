// src/dal/DALFactory.ts
import VideoDAL, { IVideoDAL } from './VideoDAL';
import TaskDAL, { ITaskDAL } from './TaskDAL';
// We'll add more DAL imports here as they're created

/**
 * Factory for creating DAL instances
 * This pattern allows us to easily switch between Firebase and PostgreSQL implementations
 * without changing the service layer
 */
export default class DALFactory {
  // Singleton instances
  private static videoDAL: IVideoDAL;
  private static taskDAL: ITaskDAL;
  
  /**
   * Get Video DAL instance
   */
  public static getVideoDAL(): IVideoDAL {
    if (!this.videoDAL) {
      this.videoDAL = new VideoDAL();
    }
    return this.videoDAL;
  }

  /**
   * Get Task DAL instance
   */
  public static getTaskDAL(): ITaskDAL {
    if (!this.taskDAL) {
      this.taskDAL = new TaskDAL();
    }
    return this.taskDAL;
  }

  /**
   * Initialize PostgreSQL connection
   * This will be implemented when migrating to PostgreSQL
   */
  public static initPostgresConnection(): void {
    // TODO: Initialize PostgreSQL connection pool
    console.log('PostgreSQL connection initialized');
  }
}