import { NextApiRequest, NextApiResponse } from 'next';
import ClientService from '../../../services/ClientService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, dbConnectionString, settings } = req.body;

    if (!name || !dbConnectionString) {
      return res.status(400).json({ 
        error: 'Missing required fields: name and dbConnectionString are required' 
      });
    }

    const clientService = new ClientService();
    const client = await clientService.createClient({
      name,
      dbConnectionString,
      settings
    });

    res.status(201).json({
      success: true,
      client
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client'
    });
  }
}