import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';
import { withClientAuth, AuthenticatedRequest } from '../../../middleware/clientAuth';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new IncomingForm({
      uploadDir: './uploads',
      keepExtensions: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
    });

    // Ensure uploads directory exists
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);
    
    const uploadedFiles = [];
    
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
      
      if (file && file.filepath) {
        // Generate unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalFilename || '');
        const fileName = `${req.clientId}_${timestamp}_${randomString}${fileExtension}`;
        
        // Move file to final location
        const finalPath = path.join(uploadDir, fileName);
        await fs.rename(file.filepath, finalPath);
        
        const fileInfo = {
          id: `${timestamp}_${randomString}`,
          originalName: file.originalFilename,
          fileName: fileName,
          filePath: finalPath,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
          clientId: req.clientId
        };
        
        uploadedFiles.push(fileInfo);
        
        // TODO: Store file metadata in client database
        // const fileService = new FileService();
        // await fileService.saveFileMetadata(req.clientId!, fileInfo);
      }
    }

    res.status(200).json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file'
    });
  }
}

export default withClientAuth(handler);