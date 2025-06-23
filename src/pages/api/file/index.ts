import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { withClientAuth, AuthenticatedRequest } from '../../../middleware/clientAuth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Check if uploads directory exists
    try {
      await fs.access(uploadDir);
    } catch {
      return res.status(200).json({
        success: true,
        files: []
      });
    }
    
    // List all files for this client
    const allFiles = await fs.readdir(uploadDir);
    const clientFiles = allFiles.filter(file => file.startsWith(`${req.clientId}_`));
    
    const fileList = await Promise.all(
      clientFiles.map(async (fileName) => {
        const filePath = path.join(uploadDir, fileName);
        const stats = await fs.stat(filePath);
        
        // Extract file ID from filename
        const parts = fileName.split('_');
        const fileId = parts.length >= 3 ? `${parts[1]}_${parts[2].split('.')[0]}` : fileName;
        
        return {
          id: fileId,
          fileName: fileName,
          size: stats.size,
          uploadedAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
    );

    res.status(200).json({
      success: true,
      files: fileList.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    });
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files'
    });
  }
}

export default withClientAuth(handler);