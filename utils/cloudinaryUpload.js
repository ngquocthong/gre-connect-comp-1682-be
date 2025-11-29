const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = async (file, folder = 'greconnect') => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    throw new Error('Failed to upload file to Cloudinary');
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };

