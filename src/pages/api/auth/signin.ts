import type { NextApiRequest, NextApiResponse } from 'next';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../../lib/firebase';
import Cors from 'cors';

const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: 'http://localhost:4000', // Adjust this based on your frontend URL
});

const runCors = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise<void>((resolve, reject) => {
    cors(req, res, (result: any) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve();
      }
    });
  });

function isFirebaseError(error: any): error is { code: string; message: string } {
  return typeof error.code === 'string' && typeof error.message === 'string';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Run CORS first
  try {
    await runCors(req, res);
  } catch (error: unknown) {
    return res.status(500).json({ message: 'CORS Error: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email, password } = req.body;
  console.log('Received email:', email); // Add logging to verify that email and password are correct

  try {
    await signInWithEmailAndPassword(auth, email, password);
    res.status(200).json({ success: true });
  } catch (error: unknown) {
    if (isFirebaseError(error)) {
      console.error('Authentication error:', error); // Log error details
      console.error('Error code:', error.code); // Log Firebase error code
      console.error('Error message:', error.message); // Log Firebase error message

      let errorMessage = 'An unknown error occurred. Please try again.';
      switch (error.code) {
        case 'auth/invalid-credential':
          errorMessage = 'Invalid credentials. Please check your email and password.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email. Please check your email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        default:
          errorMessage = error.message;
      }

      return res.status(400).json({ success: false, message: errorMessage });
    } else {
      console.error('Unknown error:', error); // Log any unknown errors
      return res.status(400).json({ success: false, message: 'An unknown authentication error occurred.' });
    }
  }
}
