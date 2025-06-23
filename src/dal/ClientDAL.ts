import { Pool } from 'pg';
import IClient, { IClientUser } from '../models/IClient';

export default class ClientDAL {
  private pool: Pool;

  constructor() {
    // Main database for client management
    this.pool = new Pool({
      connectionString: process.env.MAIN_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async createClient(client: Omit<IClient, 'id' | 'createdAt' | 'updatedAt'>): Promise<IClient> {
    const query = `
      INSERT INTO clients (name, db_connection_string, status, settings)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, db_connection_string as "dbConnectionString", status, settings, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const values = [
      client.name,
      client.dbConnectionString,
      client.status,
      JSON.stringify(client.settings || {})
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getClientById(id: string): Promise<IClient | null> {
    const query = `
      SELECT id, name, db_connection_string as "dbConnectionString", status, settings, created_at as "createdAt", updated_at as "updatedAt"
      FROM clients 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    
    const client = result.rows[0];
    client.settings = typeof client.settings === 'string' ? JSON.parse(client.settings) : client.settings;
    return client;
  }

  async getClientByName(name: string): Promise<IClient | null> {
    const query = `
      SELECT id, name, db_connection_string as "dbConnectionString", status, settings, created_at as "createdAt", updated_at as "updatedAt"
      FROM clients 
      WHERE name = $1
    `;
    
    const result = await this.pool.query(query, [name]);
    if (result.rows.length === 0) return null;
    
    const client = result.rows[0];
    client.settings = typeof client.settings === 'string' ? JSON.parse(client.settings) : client.settings;
    return client;
  }

  async getAllClients(): Promise<IClient[]> {
    const query = `
      SELECT id, name, db_connection_string as "dbConnectionString", status, settings, created_at as "createdAt", updated_at as "updatedAt"
      FROM clients 
      ORDER BY created_at DESC
    `;
    
    const result = await this.pool.query(query);
    return result.rows.map(client => ({
      ...client,
      settings: typeof client.settings === 'string' ? JSON.parse(client.settings) : client.settings
    }));
  }

  async updateClient(id: string, updates: Partial<IClient>): Promise<IClient | null> {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.dbConnectionString !== undefined) {
      setClauses.push(`db_connection_string = $${paramCount++}`);
      values.push(updates.dbConnectionString);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }
    if (updates.settings !== undefined) {
      setClauses.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(updates.settings));
    }

    if (setClauses.length === 0) {
      return this.getClientById(id);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE clients 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, db_connection_string as "dbConnectionString", status, settings, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, values);
    if (result.rows.length === 0) return null;
    
    const client = result.rows[0];
    client.settings = typeof client.settings === 'string' ? JSON.parse(client.settings) : client.settings;
    return client;
  }

  async deleteClient(id: string): Promise<boolean> {
    const query = 'DELETE FROM clients WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }

  // Client Users
  async createClientUser(user: Omit<IClientUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IClientUser> {
    const query = `
      INSERT INTO client_users (client_id, email, role, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, client_id as "clientId", email, role, status, created_at as "createdAt", updated_at as "updatedAt"
    `;
    
    const values = [user.clientId, user.email, user.role, user.status];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getClientUsers(clientId: string): Promise<IClientUser[]> {
    const query = `
      SELECT id, client_id as "clientId", email, role, status, created_at as "createdAt", updated_at as "updatedAt"
      FROM client_users 
      WHERE client_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await this.pool.query(query, [clientId]);
    return result.rows;
  }

  async getClientUserByEmail(email: string): Promise<IClientUser | null> {
    const query = `
      SELECT id, client_id as "clientId", email, role, status, created_at as "createdAt", updated_at as "updatedAt"
      FROM client_users 
      WHERE email = $1
    `;
    
    const result = await this.pool.query(query, [email]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async updateClientUser(id: string, updates: Partial<IClientUser>): Promise<IClientUser | null> {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (updates.role !== undefined) {
      setClauses.push(`role = $${paramCount++}`);
      values.push(updates.role);
    }
    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramCount++}`);
      values.push(updates.status);
    }

    if (setClauses.length === 0) {
      const query = `
        SELECT id, client_id as "clientId", email, role, status, created_at as "createdAt", updated_at as "updatedAt"
        FROM client_users WHERE id = $1
      `;
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE client_users 
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, client_id as "clientId", email, role, status, created_at as "createdAt", updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, values);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deleteClientUser(id: string): Promise<boolean> {
    const query = 'DELETE FROM client_users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount > 0;
  }
}