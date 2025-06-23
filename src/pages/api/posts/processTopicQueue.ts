import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import ServiceProvider from '../../../services/ServiceProvider';

const BATCH_SIZE = 5; // Process 5 topics at a time

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: `Method ${req.method} Not Allowed` 
    });
  }

  try {
    const { batchSize = BATCH_SIZE } = req.body;
    
    // 1. Get pending topics sorted by priority and creation date
    const topicsRef = collection(db, 'topicQueue');
    const pendingTopicsQuery = query(
      topicsRef,
      where('status', '==', 'pending'),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'asc'),
      limit(Number(batchSize))
    );
    
    const topicSnapshot = await getDocs(pendingTopicsQuery);
    
    if (topicSnapshot.empty) {
      return res.status(200).json({ 
        success: true, 
        message: 'No pending topics found in queue',
        processedCount: 0
      });
    }
    
    console.log(`Found ${topicSnapshot.size} pending topics to process`);
    
    // Get service instances
    const serviceProvider = ServiceProvider.getInstance();
    const gptService = serviceProvider.getGPTService();
    const postService = serviceProvider.getPostService();
    
    // 2. Process each topic
    const processedTopics = [];
    
    for (const topicDoc of topicSnapshot.docs) {
      const topicData = topicDoc.data();
      const { topic } = topicData;
      
      try {
        console.log(`Processing topic: ${topic}`);
        
        // Update status to processing
        await updateDoc(doc(db, 'topicQueue', topicDoc.id), {
          status: 'processing',
          processedAt: serverTimestamp()
        });
        
        // Generate content using GPT
        const prompt = `Create a blog post about "${topic}". Include a title, introduction, 3-5 main sections with headings, and a conclusion. Focus on valuable, accurate information that would be helpful for someone interested in this topic.`;
        const content = await gptService.communicateWithGPT(prompt, 'gpt-4');
        
        // Extract title from content (first line)
        const lines = content.split('\n');
        const title = lines[0].replace(/^#\s*/, ''); // Remove markdown heading if present
        const slug = title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 60);
          
        // Create post
        const post = {
          title,
          content,
          excerpt: lines.slice(0, 3).join(' ').substring(0, 150) + '...',
          slug,
          tags: [topic],
          status: 'draft',
          videos: [],
          postId: `${slug}-${Date.now()}`,
          URL: `/posts/${slug}`,
          author: 'AI Assistant'
        };
        
        const success = await postService.addPost(post);
        
        if (success) {
          // Update topic status to completed
          await updateDoc(doc(db, 'topicQueue', topicDoc.id), {
            status: 'completed',
            processedAt: serverTimestamp()
          });
          
          processedTopics.push({
            topicId: topicDoc.id,
            topic,
            postId: post.postId,
            title
          });
        } else {
          throw new Error('Failed to create post');
        }
      } catch (error: any) {
        console.error(`Error processing topic ${topic}:`, error);
        
        // Update topic status to failed
        await updateDoc(doc(db, 'topicQueue', topicDoc.id), {
          status: 'failed',
          processedAt: serverTimestamp(),
          error: error.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Processed ${processedTopics.length} topics from queue`,
      processedCount: processedTopics.length,
      processedTopics
    });
    
  } catch (error: any) {
    console.error('Error processing topic queue:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process topic queue',
      error: error.message
    });
  }
}