import { NextApiRequest, NextApiResponse } from 'next';
import ClientService from '../../../services/ClientService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const clientService = new ClientService();
    const clients = await clientService.getAllClients();

    res.status(200).json({
      success: true,
      clients
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch clients'
    });
  }
}