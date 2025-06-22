import type { NextApiRequest, NextApiResponse } from 'next';
import { getDocs, collection, query, where, limit, doc, updateDoc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import IPost from '../../../models/IPost';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ 
            success: false,
            message: `Method ${req.method} Not Allowed` 
        });
    }

    try {
        const postsCollection = collection(db, 'posts');

        // Query for posts that don't have any videos yet, ordered by creation date
        const postsQuery = query(
            postsCollection,
            where('videos', '==', []), // Posts with empty videos array
            orderBy('createdAt', 'asc'), // Oldest first
            limit(1)
        );

        const querySnapshot = await getDocs(postsQuery);

        if (querySnapshot.empty) {
            console.log('[API] No posts found needing video generation');
            return res.status(200).json({ 
                success: false,
                message: 'No posts available for video generation' 
            });
        }

        const postDoc = querySnapshot.docs[0];
        const postData = { id: postDoc.id, ...postDoc.data() } as IPost;

        console.log('[API] Found post for video generation:', postData.id);

        // If content is empty or missing, try to fetch more content
        if (!postData.content || postData.content.trim().length < 50) {
            console.log('[API] Post content is minimal, using available data');
            // Use title and excerpt to create basic content
            const fallbackContent = `${postData.title || 'Untitled Post'}\n\n${postData.excerpt || 'No description available.'}`;
            postData.content = fallbackContent;
        }

        console.log('[API] Final postData.content length:', postData.content?.length || 'undefined');

        // Mark post as being processed to prevent duplicate processing
        await updateDoc(doc(db, 'posts', postDoc.id), {
            isVideoGenerating: true,
            updatedAt: new Date()
        });

        console.log('[API] Marked post as generating, returning post data');
        
        res.status(200).json({
            success: true,
            message: 'Post found for video generation',
            post: postData
        });
    } catch (error: any) {
        console.error('Error fetching post for video generation:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error',
            error: error.message || 'Unknown error'
        });
    }
}