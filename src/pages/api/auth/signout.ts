import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '../../../../lib/firebase'; // Adjust the path as necessary
import { signOut } from 'firebase/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await signOut(auth);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({ success: false, message: 'Failed to sign out' });
  }
}