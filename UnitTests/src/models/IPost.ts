// Copy of IPost interface for testing
import { FieldValue } from 'firebase/firestore';

export default interface IPost {
  id: string;
  createdAt: FieldValue | Date;
  updatedAt: FieldValue | Date;
  postId: string;
  URL: string;
  content?: string;
  videos: string[];
  title?: string;
  excerpt?: string;
  slug?: string;
  tags?: string[];
  author?: string;
  publishedAt?: Date;
  isPublic?: boolean;
  status?: string;
}

export interface IPostWithMetadata extends IPost {
  videoCount: number;
  lastVideoCreated?: Date;
}