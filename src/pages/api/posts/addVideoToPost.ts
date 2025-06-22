// pages/api/posts/addVideoToPost.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false,
            message: 'Method not allowed',
            error: 'Only POST requests are supported'
        });
    }

    try {
        const { postId, videoId } = req.body;

        // Validate required parameters
        if (!postId || !videoId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters',
                error: 'Both postId and videoId are required'
            });
        }

        console.log(`[AddVideoToPost] Adding video ${videoId} to post ${postId}`);

        // Reference to the post document
        const postRef = doc(db, 'posts', postId);

        // Check if post exists
        const postDoc = await getDoc(postRef);
        if (!postDoc.exists()) {
            console.error(`[AddVideoToPost] Post not found: ${postId}`);
            return res.status(404).json({
                success: false,
                message: 'Post not found',
                error: `No post exists with ID: ${postId}`
            });
        }

        // Get current post data
        const postData = postDoc.data();
        const currentVideos = postData.videos || [];

        // Check if video is already associated with this post
        if (currentVideos.includes(videoId)) {
            console.log(`[AddVideoToPost] Video ${videoId} already associated with post ${postId}`);
            return res.status(200).json({
                success: true,
                message: 'Video already associated with post',
                videoId,
                postId
            });
        }

        // Add video ID to the videos array using arrayUnion (prevents duplicates)
        await updateDoc(postRef, {
            videos: arrayUnion(videoId),
            updatedAt: new Date()
        });

        console.log(`[AddVideoToPost] Successfully added video ${videoId} to post ${postId}`);

        return res.status(200).json({
            success: true,
            message: 'Video successfully added to post',
            videoId,
            postId,
            videosCount: currentVideos.length + 1
        });

    } catch (error: any) {
        console.error('[AddVideoToPost] Error adding video to post:', error);
        
        // Handle specific Firestore errors
        if (error.code === 'permission-denied') {
            return res.status(403).json({
                success: false,
                message: 'Permission denied',
                error: 'Insufficient permissions to update post'
            });
        }
        
        if (error.code === 'unavailable') {
            return res.status(503).json({
                success: false,
                message: 'Service temporarily unavailable',
                error: 'Firestore service is currently unavailable'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message || 'Unknown error occurred'
        });
    }
}