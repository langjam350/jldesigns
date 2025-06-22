// pages/api/posts/getPostsWithMetadata.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import IPost, { IPostWithMetadata } from '../../../models/IPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // Get posts from posts collection
            const postsQuery = query(
                collection(db, 'posts'), 
                orderBy('createdAt', 'desc')
            );
            
            const postsSnapshot = await getDocs(postsQuery);
            
            const posts: IPostWithMetadata[] = [];
            
            // Process each post with metadata
            for (const postDoc of postsSnapshot.docs) {
                const postData = postDoc.data();
                
                posts.push({
                    id: postDoc.id,
                    postId: postData.postId,
                    URL: postData.URL,
                    content: postData.content || '',
                    title: postData.title || `Post ${postData.postId}`,
                    excerpt: postData.excerpt || 'No excerpt available',
                    slug: postData.slug || postData.postId,
                    tags: postData.tags || [],
                    author: postData.author || 'JL Designs',
                    createdAt: postData.createdAt?.toDate?.() || postData.createdAt,
                    updatedAt: postData.updatedAt?.toDate?.() || postData.updatedAt,
                    publishedAt: postData.publishedAt?.toDate?.() || postData.publishedAt,
                    videos: postData.videos || [],
                    status: postData.status || 'draft'
                });
            }
            
            console.log(`[API] Returning ${posts.length} posts with metadata`);
            res.status(200).json({
                success: true,
                posts: posts
            });
        } catch (error: any) {
            console.error('Error fetching posts with metadata:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to fetch posts' 
            });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}