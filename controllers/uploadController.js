const { uploadBufferToCloudinary, uploadBase64ToCloudinary } = require('../utils/cloudinaryUpload');

/**
 * POST /api/upload
 * Upload file via multipart/form-data
 */
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const folder = req.body.folder || 'greconnect';

        const result = await uploadBufferToCloudinary(req.file.buffer, {
            folder: `greconnect/${folder}`,
            filename: req.file.originalname,
            mimetype: req.file.mimetype
        });

        res.status(201).json({
            url: result.url,
            name: result.name,
            type: result.type,
            size: result.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/upload/multiple
 * Upload multiple files via multipart/form-data
 */
const uploadMultipleFiles = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        const folder = req.body.folder || 'greconnect';

        const uploadPromises = req.files.map(file =>
            uploadBufferToCloudinary(file.buffer, {
                folder: `greconnect/${folder}`,
                filename: file.originalname,
                mimetype: file.mimetype
            })
        );

        const results = await Promise.all(uploadPromises);

        const files = results.map(result => ({
            url: result.url,
            name: result.name,
            type: result.type,
            size: result.size
        }));

        res.status(201).json({ files });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/upload/base64
 * Upload file via base64 encoded string
 */
const uploadBase64 = async (req, res) => {
    try {
        const { data, name, type, folder = 'greconnect' } = req.body;

        if (!data) {
            return res.status(400).json({ message: 'No file data provided' });
        }

        const result = await uploadBase64ToCloudinary(data, {
            folder: `greconnect/${folder}`,
            filename: name || 'file',
            mimetype: type || 'auto'
        });

        res.status(201).json({
            url: result.url,
            name: result.name,
            type: result.type,
            size: result.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/upload/base64/multiple
 * Upload multiple files via base64
 */
const uploadMultipleBase64 = async (req, res) => {
    try {
        const { files, folder = 'greconnect' } = req.body;

        if (!files || !Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        const uploadPromises = files.map(file =>
            uploadBase64ToCloudinary(file.data, {
                folder: `greconnect/${folder}`,
                filename: file.name || 'file',
                mimetype: file.type || 'auto'
            })
        );

        const results = await Promise.all(uploadPromises);

        const uploadedFiles = results.map(result => ({
            url: result.url,
            name: result.name,
            type: result.type,
            size: result.size
        }));

        res.status(201).json({ files: uploadedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
    uploadBase64,
    uploadMultipleBase64
};

