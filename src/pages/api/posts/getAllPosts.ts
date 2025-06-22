// pages/api/posts/getAllPosts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import IPost from '../../../models/IPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            // Create a query to get all posts, ordered by creation date (newest first)
            const postsQuery = query(
                collection(db, 'posts'), 
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(postsQuery);
            
            const posts: IPost[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                posts.push({
                    id: doc.id,
                    postId: data.postId,
                    URL: data.URL,
                    content: data.content || '',
                    title: data.title || data.postId,
                    excerpt: data.excerpt || '',
                    slug: data.slug || data.postId,
                    tags: data.tags || [],
                    author: data.author || 'JL Designs',
                    createdAt: data.createdAt?.toDate?.() || data.createdAt,
                    updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
                    videos: data.videos || [], // Include videos array if it exists
                    publishedAt: data.publishedAt?.toDate?.() || data.publishedAt,
                    status: data.status || 'draft'
                });
            });
            
            res.status(200).json({
                success: true,
                posts: posts
            });
        } catch (error: any) {
            console.error('Error fetching all posts:', error);
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