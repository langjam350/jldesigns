import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';
import { withClientAuth, AuthenticatedRequest } from '../../../middleware/clientAuth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid file ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Serve file download
        const uploadDir = path.join(process.cwd(), 'uploads');
        
        // Find file that matches client and file ID pattern
        const files = await fs.readdir(uploadDir);
        const targetFile = files.find(file => 
          file.startsWith(`${req.clientId}_`) && file.includes(id)
        );
        
        if (!targetFile) {
          return res.status(404).json({ error: 'File not found' });
        }
        
        const filePath = path.join(uploadDir, targetFile);
        const fileStats = await fs.stat(filePath);
        const fileContent = await fs.readFile(filePath);
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${targetFile}"`);
        res.setHeader('Content-Length', fileStats.size);
        
        res.status(200).send(fileContent);
        break;

      case 'DELETE':
        // Delete file
        const uploadDirDelete = path.join(process.cwd(), 'uploads');
        const filesDelete = await fs.readdir(uploadDirDelete);
        const targetFileDelete = filesDelete.find(file => 
          file.startsWith(`${req.clientId}_`) && file.includes(id)
        );
        
        if (!targetFileDelete) {
          return res.status(404).json({ error: 'File not found' });
        }
        
        const filePathDelete = path.join(uploadDirDelete, targetFileDelete);
        await fs.unlink(filePathDelete);
        
        // TODO: Remove file metadata from client database
        // const fileService = new FileService();
        // await fileService.deleteFileMetadata(req.clientId!, id);
        
        res.status(200).json({ 
          success: true, 
          message: 'File deleted successfully' 
        });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling file request:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

export default withClientAuth(handler);