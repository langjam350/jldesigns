import { NextApiRequest, NextApiResponse } from 'next';
import ClientService from '../services/ClientService';
import { IClientUser } from '../models/IClient';

export interface AuthenticatedRequest extends NextApiRequest {
  clientUser?: IClientUser;
  clientId?: string;
}

export function withClientAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Extract client ID from headers or query params
      const clientId = req.headers['x-client-id'] as string || req.query.clientId as string;
      
      if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      // Extract user email from auth token (you'll need to implement your auth strategy)
      const userEmail = req.headers['x-user-email'] as string; // This should come from your auth token
      
      if (!userEmail) {
        return res.status(401).json({ error: 'User authentication required' });
      }

      const clientService = new ClientService();
      
      // Verify client exists
      const client = await clientService.getClient(clientId);
      if (!client || client.status !== 'active') {
        return res.status(404).json({ error: 'Client not found or inactive' });
      }

      // Verify user belongs to client
      const clientUser = await clientService.getClientUserByEmail(userEmail);
      if (!clientUser || clientUser.clientId !== clientId || clientUser.status !== 'active') {
        return res.status(403).json({ error: 'User not authorized for this client' });
      }

      // Add client info to request
      req.clientUser = clientUser;
      req.clientId = clientId;

      return handler(req, res);
    } catch (error) {
      console.error('Client auth error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function requireRole(roles: string[]) {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return withClientAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!req.clientUser || !roles.includes(req.clientUser.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      return handler(req, res);
    });
  };
}