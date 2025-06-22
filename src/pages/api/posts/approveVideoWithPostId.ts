import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface ApiResponse {
    success: boolean;
    message: string;
    error?: string;
}

export default async function handler(
    req: NextApiRequest, 
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({
            success: false,
            message: `Method ${req.method} Not Allowed`,
            error: 'Only POST method is allowed'
        });
    }

    const { postId } = req.body;

    // Validate request body
    if (!postId) {
        return res.status(400).json({
            success: false,
            message: 'Post ID is required',
            error: 'Missing postId parameter in request body'
        });
    }

    if (typeof postId !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Invalid post ID format',
            error: 'postId must be a string'
        });
    }

    try {
        // Reference to the specific post document
        const postDocRef = doc(db, 'posts', postId);
        
        // Check if the post exists first
        const postDoc = await getDoc(postDocRef);
        
        if (!postDoc.exists()) {
            return res.status(404).json({
                success: false,
                message: 'Post not found',
                error: `No post found with ID: ${postId}`
            });
        }

        const postData = postDoc.data();
        
        // Check if post has videos
        if (!postData.videos || postData.videos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot approve post without videos',
                error: 'Post must have at least one video before approving'
            });
        }

        // Check if already approved
        if (postData.isVideoApproved) {
            return res.status(200).json({
                success: true,
                message: 'Post videos are already approved'
            });
        }

        // Update the post to mark videos as approved
        await updateDoc(postDocRef, {
            isVideoApproved: true,
            approvedAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`[approveVideoWithPostId] Successfully approved videos for post: ${postId}`);

        return res.status(200).json({
            success: true,
            message: 'Post videos approved successfully'
        });

    } catch (error: any) {
        console.error(`[approveVideoWithPostId] Error approving post ${postId}:`, error);
        
        // Handle specific Firebase errors
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
                error: 'Database connection issue'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error occurred',
            error: error.message || 'Unknown database error'
        });
    }
}