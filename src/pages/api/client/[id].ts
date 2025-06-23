import { NextApiRequest, NextApiResponse } from 'next';
import ClientService from '../../../services/ClientService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid client ID' });
  }

  const clientService = new ClientService();

  try {
    switch (req.method) {
      case 'GET':
        const client = await clientService.getClient(id);
        if (!client) {
          return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json({ success: true, client });
        break;

      case 'PUT':
        const updates = req.body;
        const updatedClient = await clientService.updateClient(id, updates);
        if (!updatedClient) {
          return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json({ success: true, client: updatedClient });
        break;

      case 'DELETE':
        const deleted = await clientService.deleteClient(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Client not found' });
        }
        res.status(200).json({ success: true, message: 'Client deleted successfully' });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling client request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}