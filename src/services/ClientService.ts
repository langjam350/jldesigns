import ClientDAL from '../dal/ClientDAL';
import IClient, { IClientUser } from '../models/IClient';
import { Pool } from 'pg';

export default class ClientService {
  private clientDAL: ClientDAL;

  constructor() {
    this.clientDAL = new ClientDAL();
  }

  async createClient(clientData: {
    name: string;
    dbConnectionString: string;
    settings?: any;
  }): Promise<IClient> {
    // Validate client name is unique
    const existingClient = await this.clientDAL.getClientByName(clientData.name);
    if (existingClient) {
      throw new Error(`Client with name "${clientData.name}" already exists`);
    }

    // Test the database connection
    await this.testDatabaseConnection(clientData.dbConnectionString);

    // Create the client
    const client = await this.clientDAL.createClient({
      name: clientData.name,
      dbConnectionString: clientData.dbConnectionString,
      status: 'active',
      settings: clientData.settings || {}
    });

    // Initialize the client database with required tables
    await this.initializeClientDatabase(client.dbConnectionString);

    return client;
  }

  async getClient(id: string): Promise<IClient | null> {
    return this.clientDAL.getClientById(id);
  }

  async getAllClients(): Promise<IClient[]> {
    return this.clientDAL.getAllClients();
  }

  async updateClient(id: string, updates: Partial<IClient>): Promise<IClient | null> {
    return this.clientDAL.updateClient(id, updates);
  }

  async deleteClient(id: string): Promise<boolean> {
    // TODO: Add cleanup logic for client database
    return this.clientDAL.deleteClient(id);
  }

  // Client Users
  async createClientUser(userData: {
    clientId: string;
    email: string;
    role: 'admin' | 'user' | 'viewer';
  }): Promise<IClientUser> {
    // Validate client exists
    const client = await this.clientDAL.getClientById(userData.clientId);
    if (!client) {
      throw new Error(`Client with id "${userData.clientId}" not found`);
    }

    // Check if user already exists for this client
    const existingUser = await this.clientDAL.getClientUserByEmail(userData.email);
    if (existingUser && existingUser.clientId === userData.clientId) {
      throw new Error(`User with email "${userData.email}" already exists for this client`);
    }

    return this.clientDAL.createClientUser({
      clientId: userData.clientId,
      email: userData.email,
      role: userData.role,
      status: 'active'
    });
  }

  async getClientUsers(clientId: string): Promise<IClientUser[]> {
    return this.clientDAL.getClientUsers(clientId);
  }

  async getClientUserByEmail(email: string): Promise<IClientUser | null> {
    return this.clientDAL.getClientUserByEmail(email);
  }

  async updateClientUser(id: string, updates: Partial<IClientUser>): Promise<IClientUser | null> {
    return this.clientDAL.updateClientUser(id, updates);
  }

  async deleteClientUser(id: string): Promise<boolean> {
    return this.clientDAL.deleteClientUser(id);
  }

  // Database utilities
  async getClientDatabaseConnection(clientId: string): Promise<Pool> {
    const client = await this.clientDAL.getClientById(clientId);
    if (!client) {
      throw new Error(`Client with id "${clientId}" not found`);
    }

    return new Pool({
      connectionString: client.dbConnectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  private async testDatabaseConnection(connectionString: string): Promise<void> {
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    } catch (error) {
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await pool.end();
    }
  }

  private async initializeClientDatabase(connectionString: string): Promise<void> {
    const pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      const client = await pool.connect();

      // Create posts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS posts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id VARCHAR UNIQUE NOT NULL,
          url TEXT,
          content TEXT,
          title TEXT,
          excerpt TEXT,
          slug VARCHAR UNIQUE,
          status VARCHAR DEFAULT 'draft',
          author VARCHAR,
          tags TEXT[],
          videos TEXT[],
          published_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create videos table
      await client.query(`
        CREATE TABLE IF NOT EXISTS videos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id VARCHAR REFERENCES posts(post_id),
          task_id UUID,
          type VARCHAR DEFAULT 'scripted',
          language VARCHAR DEFAULT 'en-US',
          status VARCHAR DEFAULT 'pending',
          file_name VARCHAR,
          file_size BIGINT,
          file_path TEXT,
          download_url TEXT,
          duration DECIMAL,
          resolution VARCHAR,
          format VARCHAR,
          audio_file_url TEXT,
          background_image TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id VARCHAR,
          type VARCHAR NOT NULL,
          status VARCHAR DEFAULT 'pending',
          config JSONB,
          result JSONB,
          error_message TEXT,
          email_sent BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Create topic_queue table
      await client.query(`
        CREATE TABLE IF NOT EXISTS topic_queue (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          topic_id VARCHAR UNIQUE NOT NULL,
          topic TEXT NOT NULL,
          status VARCHAR DEFAULT 'pending',
          priority INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          processed_at TIMESTAMP,
          error TEXT,
          sort_key VARCHAR
        )
      `);

      // Create posts_with_metadata view
      await client.query(`
        CREATE OR REPLACE VIEW posts_with_metadata AS
        SELECT 
          p.*,
          COALESCE(v.video_count, 0) as video_count,
          COALESCE(t.task_count, 0) as task_count
        FROM posts p
        LEFT JOIN (
          SELECT post_id, COUNT(*) as video_count
          FROM videos
          GROUP BY post_id
        ) v ON p.post_id = v.post_id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as task_count
          FROM tasks
          GROUP BY post_id
        ) t ON p.post_id = t.post_id
      `);

      client.release();
    } catch (error) {
      throw new Error(`Failed to initialize client database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      await pool.end();
    }
  }
}