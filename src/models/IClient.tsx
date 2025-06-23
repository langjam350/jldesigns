export default interface IClient {
  id: string;
  name: string;
  dbConnectionString: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  settings?: {
    features?: string[];
    limits?: {
      maxUsers?: number;
      maxPosts?: number;
      maxVideos?: number;
    };
  };
}

export interface IClientUser {
  id: string;
  clientId: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}