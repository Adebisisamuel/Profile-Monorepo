import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';
import sharp from 'sharp';

// Configure storage destination
const uploadDir = path.join(process.cwd(), 'uploads');

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper function to clean old profile images
const cleanOldProfileImages = async (userId: number) => {
  try {
    const user = await storage.getUser(userId);
    if (user?.profileImageUrl) {
      const oldFilename = path.basename(user.profileImageUrl);
      const oldFilePath = path.join(uploadDir, oldFilename);
      
      // Only delete if the file exists
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Deleted old profile image: ${oldFilePath}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning old profile image:', error);
    // Non-blocking - continue even if cleanup fails
  }
};

// Helper function to clean old church logos
const cleanOldChurchLogo = async (churchId: number) => {
  try {
    const church = await storage.getChurch(churchId);
    if (church?.logoUrl) {
      const oldFilename = path.basename(church.logoUrl);
      const oldFilePath = path.join(uploadDir, oldFilename);
      
      // Only delete if the file exists
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`Deleted old church logo: ${oldFilePath}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning old church logo:', error);
    // Non-blocking - continue even if cleanup fails
  }
};

// Configure multer storage
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with original extension preserved
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueFilename = `${uuidv4()}-${Date.now()}${fileExt}`;
    cb(null, uniqueFilename);
  }
});

// Define file filter with better validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // List of allowed image MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Only image files are allowed. Received: ${file.mimetype}`));
  }
};

// Create upload middleware
export const upload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Allow only one file at a time
  },
  fileFilter
});

// Error handler middleware for multer errors
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'Bestand te groot',
        error: 'Het bestand mag niet groter zijn dan 5MB.'
      });
    }
    
    return res.status(400).json({ 
      message: 'Upload mislukt',
      error: err.message
    });
  } else if (err) {
    // Another error occurred
    return res.status(400).json({ 
      message: 'Upload mislukt', 
      error: err.message
    });
  }
  
  next();
};

// Optimize images with enhanced sharp processing
const optimizeImage = async (filePath: string, type: 'profile' | 'logo' = 'profile'): Promise<{width: number, height: number}> => {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    let imageMetadata: sharp.Metadata;
    let optimizedImageBuffer: Buffer;
    
    // Get image metadata
    imageMetadata = await sharp(filePath).metadata();
    
    // Default dimensions
    const maxWidth = type === 'profile' ? 800 : 1200; // Profile images smaller than logos
    const maxHeight = type === 'profile' ? 800 : 1200;
    
    // Create a processing pipeline based on image type
    let pipeline = sharp(filePath)
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside', // Keep aspect ratio
        withoutEnlargement: true // Don't enlarge smaller images
      });
    
    // Apply format-specific optimizations
    if (fileExt === '.jpg' || fileExt === '.jpeg') {
      // Optimize JPEG with good quality
      optimizedImageBuffer = await pipeline
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } 
    else if (fileExt === '.png') {
      // Optimize PNG with compression
      optimizedImageBuffer = await pipeline
        .png({ compressionLevel: 8, adaptiveFiltering: true })
        .toBuffer();
    } 
    else if (fileExt === '.webp') {
      // WebP optimizations
      optimizedImageBuffer = await pipeline
        .webp({ quality: 85 })
        .toBuffer();
    }
    else {
      // For other formats, just resize
      optimizedImageBuffer = await pipeline.toBuffer();
    }
    
    // Write the optimized image back to the file
    fs.writeFileSync(filePath, optimizedImageBuffer);
    
    // Get final dimensions of the optimized image
    const finalMetadata = await sharp(optimizedImageBuffer).metadata();
    
    console.log(`Optimized ${type} image: ${filePath} (${finalMetadata.width}x${finalMetadata.height})`);
    
    return {
      width: finalMetadata.width || 0,
      height: finalMetadata.height || 0
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    // Return default dimensions on error
    return { width: 0, height: 0 };
  }
};

// Handler for uploading user profile image with enhanced validation and optimization
export const uploadProfileImage = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Geen bestand geüpload' });
    }

    const user = req.user;
    const userId = user.id;
    
    const filePath = path.join(uploadDir, req.file.filename);
    
    // Optimize the image and get dimensions
    const imageOptimization = optimizeImage(filePath, 'profile');
    
    // Process optimization result before continuing
    imageOptimization.then(dimensions => {
      console.log(`Optimized profile image dimensions: ${dimensions.width}x${dimensions.height}`);
    }).catch(err => {
      console.error('Image optimization failed:', err);
    });
    
    // Clean up old profile image in the background
    cleanOldProfileImages(userId).catch(err => {
      console.error('Error cleaning old profile image:', err);
    });
    
    // Create relative URL path to the file
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Get image dimensions from optimization
    let dimensions = { width: 0, height: 0 };
    try {
      dimensions = await imageOptimization;
    } catch (err) {
      console.error('Error getting image dimensions:', err);
    }
    
    // Save metadata about the upload
    const metadata = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      width: dimensions.width,
      height: dimensions.height
    };
    
    // Update user's profile image URL in database
    await storage.updateUser(userId, { 
      profileImageUrl: imageUrl,
      profileImageMetadata: JSON.stringify(metadata)
    });
    
    return res.status(200).json({ 
      message: 'Profielafbeelding succesvol geüpload',
      imageUrl,
      metadata
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    
    // Try to clean up the file if it was uploaded but database update failed
    if (req.file) {
      try {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up failed upload: ${filePath}`);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up failed upload:', cleanupError);
      }
    }
    
    return res.status(500).json({ message: 'Uploaden van profielafbeelding mislukt' });
  }
};

// Handler for uploading church logo with enhanced validation and optimization
export const uploadChurchLogo = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Geen bestand geüpload' });
    }

    const user = req.user;
    const churchId = parseInt(req.params.churchId);
    
    if (isNaN(churchId)) {
      return res.status(400).json({ message: 'Ongeldig kerk ID' });
    }
    
    // Check if user has permission (is a team leader)
    const church = await storage.getChurch(churchId);
    if (!church || church.createdById !== user.id) {
      return res.status(403).json({ message: 'Geen toestemming om deze kerk bij te werken' });
    }
    
    const filePath = path.join(uploadDir, req.file.filename);
    
    // Optimize the image and get dimensions
    const imageOptimization = optimizeImage(filePath, 'logo');
    
    // Process optimization result before continuing
    imageOptimization.then(dimensions => {
      console.log(`Optimized church logo dimensions: ${dimensions.width}x${dimensions.height}`);
    }).catch(err => {
      console.error('Image optimization failed:', err);
    });
    
    // Clean up old church logo in the background
    cleanOldChurchLogo(churchId).catch(err => {
      console.error('Error cleaning old church logo:', err);
    });
    
    // Create relative URL path to the file
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Save metadata about the upload
    const metadata = {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };
    
    // Update church logo URL in database
    await storage.updateChurch(churchId, { 
      logoUrl: imageUrl,
      logoMetadata: JSON.stringify(metadata)
    });
    
    return res.status(200).json({ 
      message: 'Kerklogo succesvol geüpload',
      imageUrl,
      metadata
    });
  } catch (error) {
    console.error('Error uploading church logo:', error);
    
    // Try to clean up the file if it was uploaded but database update failed
    if (req.file) {
      try {
        const filePath = path.join(uploadDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up failed upload: ${filePath}`);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up failed upload:', cleanupError);
      }
    }
    
    return res.status(500).json({ message: 'Uploaden van kerklogo mislukt' });
  }
};

// Improved file serving middleware with basic caching headers
export const setupUploadsRoutes = (app: any) => {
  console.log(`Setting up static file serving from ${uploadDir}`);
  
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    const requestedFile = req.path.replace(/\//g, '');
    const filePath = path.join(uploadDir, requestedFile);
    
    // Security check - prevent path traversal attacks
    const normalizedFilePath = path.normalize(filePath);
    if (!normalizedFilePath.startsWith(uploadDir)) {
      return res.status(403).send('Access denied');
    }
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      // Set caching headers
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      
      // Determine MIME type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
    } else {
      next();
    }
  });
};