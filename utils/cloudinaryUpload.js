const cloudinary = require('../config/cloudinary');

/**
 * Upload file from multer (multipart/form-data)
 */
const uploadToCloudinary = async (file, folder = 'greconnect') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      name: file.originalname,
      type: file.mimetype,
      size: file.size
    };
  } catch (error) {
    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Upload file from buffer (memory storage)
 */
const uploadBufferToCloudinary = async (buffer, options = {}) => {
  const { folder = 'greconnect', filename = 'file', mimetype = 'auto' } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        public_id: `${Date.now()}_${filename.replace(/\.[^/.]+$/, '')}`
      },
      (error, result) => {
        if (error) {
          reject(new Error('Failed to upload file to Cloudinary'));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            name: filename,
            type: mimetype,
            size: buffer.length
          });
        }
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Upload base64 encoded file
 */
const uploadBase64ToCloudinary = async (base64Data, options = {}) => {
  const { folder = 'greconnect', filename = 'file', mimetype = 'auto' } = options;

  try {
    // Handle data URI format: data:image/png;base64,xxxxx
    let base64String = base64Data;
    if (base64Data.includes('base64,')) {
      base64String = base64Data.split('base64,')[1];
    }

    const buffer = Buffer.from(base64String, 'base64');

    return await uploadBufferToCloudinary(buffer, { folder, filename, mimetype });
  } catch (error) {
    throw new Error('Failed to upload base64 file to Cloudinary');
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
  }
};

module.exports = {
  uploadToCloudinary,
  uploadBufferToCloudinary,
  uploadBase64ToCloudinary,
  deleteFromCloudinary
};

