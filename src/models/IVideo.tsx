// models/IVideo.ts
export interface IVideo {
    id: string;
    audioFile?: string;
    backgroundImage?: string;
    postId: string;
    type: 'scrolling' | 'scripted';
    language?: string; // for scripted videos

    fileName?: string;             // Original filename
    fileSize?: number;             // File size in bytes
    filePath?: string;             // Firebase storage path
    downloadUrl?: string;          // Public download URL
    duration?: number;             // Duration in seconds
    resolution?: string;           // e.g. "1080x1920"
    format?: string;               // e.g. "mp4"
    taskId?: string;              // Associated task ID
    

    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}