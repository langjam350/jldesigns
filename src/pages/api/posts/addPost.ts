import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import IPost from '../../../models/IPost';

// Handler function for adding posts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { 
                postId,
                URL,
                content,
                title,
                excerpt,
                slug,
                tags,
                author
            } = req.body;
            
            if (!postId || typeof postId !== 'string') {
                return res.status(400).json({ success: false, message: 'Valid postId string is required' });
            }
            
            // Create a unique document ID based on the postId (sanitized for Firestore)
            const docId = postId.trim().toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                .substring(0, 60); // Limit length
            
            const postData: IPost = {
                id: docId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                postId: postId.trim(),
                URL: URL ? URL.trim() : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:4000'}/posts/${slug || postId}`,
                content: content || '',
                title: title || postId,
                excerpt: excerpt || '',
                slug: slug || postId,
                tags: tags || [],
                author: author || 'JL Designs',
                videos: []
            };
            
            // Use the docId as the document ID
            const postRef = doc(db, 'posts', docId);
            
            await setDoc(postRef, postData, { merge: true });
            
            res.status(201).json({ 
                success: true, 
                message: 'Post added successfully',
                id: docId,
                post: {
                    ...postData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });
        } catch (error: any) {
            console.error('Error adding post:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to add post' 
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}