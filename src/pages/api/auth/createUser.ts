import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { db, auth } from '../../../../lib/firebase';
import { addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await runCors(req, res);
  } catch (error: unknown) {
    return res.status(500).json({ message: 'CORS Error: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Attempt to create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Add the user to Firestore
    await addUserToDatabase(db, email, password, uid);

    return res.status(200).json({ success: true, message: 'User created successfully', email });
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.warn('Email already in use, checking Firestore:', email);

      // Check Firestore for existing user
      const userInfoCollection = collection(db, 'userInfo');
      const userQuery = query(userInfoCollection, where('email', '==', email));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        console.log('User already exists in Firestore:', email);
        return res.status(409).json({ success: false, message: 'User already exists in Firestore' });
      }

      // Add user to Firestore if not found
      await addUserToDatabase(db, email, password, null);
      return res.status(200).json({ success: true, message: 'User added to Firestore despite Firebase error', email });
    }

    console.error('Error handling user sign-up:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create user' });
  }
}

export async function addUserToDatabase(db: any, email: string, password: string, uid: string | null = null) {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const userInfo = {
    uid, // Can be null if not available
    email,
    password: hashedPassword,
    resetPassword: false,
    resetUsername: false,
    admin: false,
  };

  const userInfoCollection = collection(db, 'userInfo');
  await addDoc(userInfoCollection, userInfo);

  console.log('User added to Firestore:', userInfo);
  return userInfo;
}