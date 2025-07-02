import IPost from '../models/IPost';
import { IPostWithMetadata } from '../models/IPost';

export interface IPostService {
    addPost(post: Partial<IPost>): Promise<boolean>;
    getNextPost(): Promise<IPost | null>;
    getAllPosts(): Promise<IPost[]>;
    getPostById(postId: string): Promise<IPost | null>;
    addVideoToPost(postId: string, videoId: string): Promise<{ success: boolean; message: string; error?: string }>;
    approvePost(post: IPost): Promise<{ success: boolean; message: string; error?: string }>;
    addTopicToQueue(topic: string): Promise<boolean>;
    getAllPostsWithMetadata(): Promise<IPostWithMetadata[]>;
    getCategories(): Promise<string[]>;
    generatePosts(topic: string, numPosts: number, category: string): Promise<IPost[]>;
    deleteExperimentalPost(postId: string): Promise<boolean>;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
    ? 'http://localhost:4000' 
    : 'https://jlangdesigns.vercel.app';

export default class PostService implements IPostService {
    public async addPost(post: Partial<IPost>): Promise<boolean> {
        try {
            // Create a new post with default values
            const newPost: Partial<IPost> = {
                ...post,
                createdAt: new Date(),
                updatedAt: new Date(),
                videos: post.videos || [], // Initialize empty videos array if not provided
                URL: post.URL || `${BASE_URL}/posts/${post.slug || post.postId}`,
            };

            // Send the new post to the API endpoint
            const response = await fetch('/api/posts/addPost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newPost),
            });

            if (!response.ok) {
                console.error('Failed to add post:', response.statusText);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error adding post:', error);
            return false;
        }
    }

    public async getNextPost(): Promise<IPost | null> {
        try {
            const response = await fetch(`${BASE_URL}/api/posts/getNextPostForVideoGeneration`);
            
            if (!response.ok) {
                console.error(`Error fetching next post: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const data = await response.json();
            
            // Check if we have valid data
            if (!data) {
                console.log('No posts available for video generation');
                return null;
            }
            
            return data as IPost;
        } catch (error) {
            console.error('Error in getNextPost:', error);
            return null;
        }
    }

    // Get all posts for dropdown selection
    public async getAllPosts(): Promise<IPost[]> {
        try {
            const response = await fetch('/api/posts/getAllPosts');
            
            if (!response.ok) {
                console.error(`Error fetching all posts: ${response.status} ${response.statusText}`);
                return [];
            }
            
            const data = await response.json() as { posts?: IPost[] };
            
            if (!data || !data.posts) {
                console.error('No posts found in response');
                return [];
            }
            
            return data.posts;
        } catch (error) {
            console.error('Error in getAllPosts:', error);
            return [];
        }
    }

    // Get specific post by ID
    public async getPostById(postId: string): Promise<IPost | null> {
        try {
            const response = await fetch(`/api/posts/getPostById?postId=${postId}`);
            
            if (!response.ok) {
                console.error(`Error fetching post by ID: ${response.status} ${response.statusText}`);
                return null;
            }
            
            const data = await response.json() as { post?: IPost };
            
            if (!data || !data.post) {
                console.log(`No post found with ID: ${postId}`);
                return null;
            }
            
            return data.post;
        } catch (error) {
            console.error('Error in getPostById:', error);
            return null;
        }
    }
    
    // Add video ID to post's videos array
    public async addVideoToPost(postId: string, videoId: string): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await fetch('/api/posts/addVideoToPost', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    postId,
                    videoId
                }),
            });
            
            const data = await response.json() as { message?: string; error?: string };
            
            if (!response.ok) {
                console.error(`Failed to add video to post: ${response.status} ${response.statusText}`);
                return {
                    success: false,
                    message: data.message || 'Failed to add video to post',
                    error: data.error || response.statusText
                };
            }
            
            return {
                success: true,
                message: data.message || 'Video added to post successfully'
            };
        } catch (error: any) {
            console.error('Error adding video to post:', error);
            return {
                success: false,
                message: 'Network error occurred',
                error: error.message || 'Unknown error'
            };
        }
    }

    public async approvePost(post: IPost): Promise<{ success: boolean; message: string; error?: string }> {
        try {
            const response = await fetch('/api/posts/approveVideoWithPostId', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.postId }),
            });
            
            const data = await response.json() as { message?: string; error?: string };
            
            if (!response.ok) {
                console.error(`Failed to approve post: ${response.status} ${response.statusText}`);
                return {
                    success: false,
                    message: data.message || 'Failed to approve post',
                    error: data.error || response.statusText
                };
            }
            
            return {
                success: true,
                message: data.message || 'Post approved successfully'
            };
        } catch (error: any) {
            console.error('Error approving post:', error);
            return {
                success: false,
                message: 'Network error occurred',
                error: error.message || 'Unknown error'
            };
        }
    }

    public async addTopicToQueue(topic: string): Promise<boolean> {
        try {
            const response = await fetch('/api/posts/addTopicToQueue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });

            if (!response.ok) {
                console.error(`Failed to add topic to queue: ${response.status} ${response.statusText}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error(`Error adding topic to queue: ${error}`);
            return false;
        }
    }

    // Get all posts with metadata for dashboard
    public async getAllPostsWithMetadata(): Promise<IPostWithMetadata[]> {
        try {
            const response = await fetch('/api/posts/getPostsWithMetadata');
            
            if (!response.ok) {
                console.error(`Error fetching posts with metadata: ${response.status} ${response.statusText}`);
                return [];
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data)) {
                console.error('Expected array of posts, got:', typeof data);
                return [];
            }
            
            return data as IPostWithMetadata[];
        } catch (error) {
            console.error('Error in getAllPostsWithMetadata:', error);
            return [];
        }
    }

    public async getCategories(): Promise<string[]> {
        // Return default categories for social media posts
        return [
            'Technology',
            'Business',
            'Marketing',
            'Social Media',
            'Design',
            'Lifestyle',
            'Entertainment',
            'News',
            'Education',
            'Travel'
        ];
    }

    public async generatePosts(topic: string, numPosts: number, category: string): Promise<IPost[]> {
        try {
            // For now, return mock data since we don't have the generation endpoint implemented
            const mockPosts: IPost[] = [];
            for (let i = 0; i < numPosts; i++) {
                mockPosts.push({
                    id: `post_${Date.now()}_${i}`,
                    postId: `${Date.now()}_${i}`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    URL: `${BASE_URL}/posts/${topic.toLowerCase().replace(/\s+/g, '-')}-${i}`,
                    content: `Generated content for ${topic} in ${category} category`,
                    title: `${topic} - Post ${i + 1}`,
                    excerpt: `This is a generated post about ${topic}`,
                    slug: `${topic.toLowerCase().replace(/\s+/g, '-')}-${i}`,
                    tags: [category, topic],
                    videos: [],
                    isPublic: false
                });
            }
            return mockPosts;
        } catch (error) {
            console.error('Error generating posts:', error);
            return [];
        }
    }

    public async deleteExperimentalPost(postId: string): Promise<boolean> {
        try {
            // For now, just return true since we don't have delete endpoint
            console.log(`Would delete post with ID: ${postId}`);
            return true;
        } catch (error) {
            console.error('Error deleting post:', error);
            return false;
        }
    }
}