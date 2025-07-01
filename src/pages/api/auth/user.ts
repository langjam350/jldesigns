import type { NextApiRequest, NextApiResponse } from 'next'
import { auth } from '../../../../lib/firebase'; // Adjust the path as necessary

// Handle requests to the Next Server
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = auth.currentUser;
  if (user) {
    res.status(200).json({ user: { uid: user.uid, email: user.email } });
  } else {
    res.status(200).json({ user: null });
  }
}