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
    'https://www.jldesigns.com',
    'https://dev.jldesigns.com',
    'https://jldesigns.com'
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
    // Query Firestore for user info by email
    const userInfoRef = collection(db, 'userInfo');
    const querySnapshot = await getDocs(query(userInfoRef, where('email', '==', email)));

    if (!querySnapshot.empty) {
      // If user found, return user data
      const docSnapshot = querySnapshot.docs[0];
      const userData = docSnapshot.data() as IUserInfo;
      res.status(200).json(userData);
    } else {
      // If no user found, return 404
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
