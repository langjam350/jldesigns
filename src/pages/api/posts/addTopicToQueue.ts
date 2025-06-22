import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface TopicQueueItem {
    topic: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    priority: number;
    createdAt: any;
    processedAt?: any;
    error?: string;
    // Add a compound sortKey for efficient fetching
    sortKey?: string; // e.g., "pending_1_20230415T123030"
}

// Handler function for adding topics to queue
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { topic, priority = 1 } = req.body;
            
            if (!topic || typeof topic !== 'string') {
                return res.status(400).json({ success: false, message: 'Valid topic string is required' });
            }
            
            // Create a unique ID based on the topic (sanitized for Firestore)
            const topicId = topic.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
            
            const topicData: TopicQueueItem = {
                topic,
                status: 'pending',
                priority: Number(priority),
                createdAt: serverTimestamp(),
            };
            
            // Check if topic already exists to prevent duplicates
            const topicRef = doc(db, 'topicQueue', topicId);
            
            await setDoc(topicRef, topicData, { merge: true });
            
            res.status(201).json({ 
                success: true, 
                message: 'Topic added to queue',
                id: topicId
            });
        } catch (error: any) {
            console.error('Error adding topic to queue:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to add topic to queue' 
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}