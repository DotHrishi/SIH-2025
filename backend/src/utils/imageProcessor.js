const sharp = require('sharp');
const { getGridFS } = require('../config/gridfs');

/**
 * Compress and optimize image before storage
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Compression options
 * @returns {Buffer} - Compressed image buffer
 */
const compressImage = async (imageBuffer, options = {}) => {
  const {
    quality = 80,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg'
  } = options;

  try {
    let sharpInstance = sharp(imageBuffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if image is too large
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Apply compression based on format
    switch (format.toLowerCase()) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({ 
          compressionLevel: 9,
          adaptiveFiltering: true
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({ quality });
        break;
      default:
        sharpInstance = sharpInstance.jpeg({ quality, progressive: true });
    }
    
    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Image compression error:', error);
    throw new Error('Failed to compress image');
  }
};

/**
 * Generate thumbnail from image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Thumbnail options
 * @returns {Buffer} - Thumbnail buffer
 */
const generateThumbnail = async (imageBuffer, options = {}) => {
  const {
    width = 300,
    height = 300,
    quality = 70
  } = options;

  try {
    return await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality })
      .toBuffer();
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
};

/**
 * Validate image file
 * @param {Buffer} imageBuffer - Image buffer to validate
 * @returns {Object} - Validation result with metadata
 */
const validateImage = async (imageBuffer) => {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    
    const validation = {
      isValid: true,
      metadata: {
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        size: imageBuffer.length
      },
      errors: []
    };

    // Check if format is supported
    const supportedFormats = ['jpeg', 'png', 'webp', 'gif'];
    if (!supportedFormats.includes(metadata.format)) {
      validation.isValid = false;
      validation.errors.push(`Unsupported format: ${metadata.format}`);
    }

    // Check dimensions
    if (metadata.width > 5000 || metadata.height > 5000) {
      validation.isValid = false;
      validation.errors.push('Image dimensions too large (max 5000x5000)');
    }

    // Check file size (5MB limit)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      validation.isValid = false;
      validation.errors.push('File size exceeds 5MB limit');
    }

    return validation;
  } catch (error) {
    return {
      isValid: false,
      metadata: null,
      errors: ['Invalid image file or corrupted data']
    };
  }
};

module.exports = {
  compressImage,
  generateThumbnail,
  validateImage
};