import { FieldValue } from "firebase/firestore";

export default interface IPost {
    id: string; // Firestore document ID
    createdAt: FieldValue | Date; // Can be FieldValue (serverTimestamp) or Date
    updatedAt: FieldValue | Date; // Can be FieldValue (serverTimestamp) or Date
    postId: string; // Foreign key referencing original post
    URL: string; // Full URL to the post
    content?: string;
    videos: string[];
    title?: string; // Post title
    excerpt?: string; // Post summary
    slug?: string; // URL slug
    tags?: string[]; // Content tags
    author?: string; // Post author
    publishedAt?: Date; // Publication date
}

// Extended interface with metadata for enhanced post management
export interface IPostWithMetadata extends IPost {
    status?: string; // Publication status
}