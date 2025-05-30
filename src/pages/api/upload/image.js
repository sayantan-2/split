import { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
  return uploadsDir;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const uploadsDir = await ensureUploadsDir();
    const form = new IncomingForm({
      uploadDir: uploadsDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image');
      },
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ files });
      });
    });

    const uploadedFile = files.file?.[0]; // Get the first file
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No valid image file uploaded' });
    }

    // Generate a unique filename
    const fileExt = path.extname(uploadedFile.originalFilename || 'image.jpg');
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join('uploads', fileName);
    const newPath = path.join(process.cwd(), 'public', filePath);

    // Move the file to our new path
    try {
      await fs.rename(uploadedFile.filepath, newPath);
    } catch (error) {
      console.error('Error moving file:', error);
      // If rename fails (cross-device), try copy + unlink
      await fs.copyFile(uploadedFile.filepath, newPath);
      await fs.unlink(uploadedFile.filepath).catch(console.error);
    }

    // Return the public URL
    const fileUrl = `/${filePath}`;

    return res.status(200).json({
      url: fileUrl,
      name: uploadedFile.originalFilename,
      size: uploadedFile.size,
      type: uploadedFile.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Failed to upload image',
      details: error.message
    });
  }
}
