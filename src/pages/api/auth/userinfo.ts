import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../../../lib/firebase'; // Adjust the path as necessary
import { collection, query, where, getDocs } from 'firebase/firestore';
import IUserInfo from '@/models/IUserInfo';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['GET', 'OPTIONS'],
  origin: [
    'http://localhost:4000',
    'https://www.jlangdesigns.com',
    'https://dev.jlangdesigns.com',
    'https://jlangdesigns.com'
  ],
});

// Helper to run CORS
const runCors = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise<void>((resolve, reject) => {
    cors(req, res, (result: any) => (result instanceof Error ? reject(result) : resolve()));
  });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Run CORS first
  try {
    await runCors(req, res);
  } catch (error: unknown) {
    return res.status(500).json({ message: 'CORS Error: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure email query is provided and is a string
  const { email } = req.query;

  if (typeof email !== 'string') {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    console.log('🔍 Fetching user info for email:', email);
    console.log('🔥 Firebase config check - projectId:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'jldesigns');
    
    // Query Firestore for user info by email
    const userInfoRef = collection(db, 'userInfo');
    console.log('📄 Querying Firestore collection: userInfo');
    
    const querySnapshot = await getDocs(query(userInfoRef, where('email', '==', email)));
    console.log('📊 Query result - empty:', querySnapshot.empty, 'size:', querySnapshot.size);

    if (!querySnapshot.empty) {
      // If user found, return user data
      const docSnapshot = querySnapshot.docs[0];
      const userData = docSnapshot.data() as IUserInfo;
      console.log('✅ User found:', userData.email);
      res.status(200).json(userData);
    } else {
      // If no user found, return 404
      console.log('❌ No user found for email:', email);
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching user info:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
