// pages/api/video/create.ts - Create video record
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const videoData = req.body;
            
            // Validate required fields
            if (!videoData.id || !videoData.postId || !videoData.type) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required fields: id, postId, type' 
                });
            }
            
            // Create video document
            const videoRef = doc(db, 'videos', videoData.id);
            await setDoc(videoRef, videoData);
            
            res.status(201).json({ 
                success: true, 
                message: 'Video record created successfully',
                videoId: videoData.id
            });
        } catch (error: any) {
            console.error('Error creating video record:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to create video record' 
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}