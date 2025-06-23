export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';
import ICaptionTiming from "./ICaptionTiming";
// Add caption timing interface
export interface TaskConfig {
  script?: string;
  images?: Array<{
    url: string;
    title: string;
    source: string;
  }>;
  articleUrl?: string;
  audioFile: string;
  durationInSeconds: number;
  videoFile?: string;
  captions?: ICaptionTiming[];
  postId: string;
  language?: string;
}

export default interface ITask {
  id: string;
  type: string; // e.g., 'video-generation'
  status: TaskStatus;
  config: TaskConfig;
  result?: {
    videoUrl?: string;
    error?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  emailSent?: boolean;
    
}