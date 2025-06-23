import { NextApiRequest, NextApiResponse } from 'next';
import ClientService from '../../../../services/ClientService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  const clientService = new ClientService();

  try {
    switch (req.method) {
      case 'GET':
        const users = await clientService.getClientUsers(id);
        res.status(200).json({ success: true, users });
        break;

      case 'POST':
        const { email, role } = req.body;
        
        if (!email || !role) {
          return res.status(400).json({ 
            error: 'Missing required fields: email and role are required' 
          });
        }

        const user = await clientService.createClientUser({
          clientId: id,
          email,
          role
        });

        res.status(201).json({ success: true, user });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling client users request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}