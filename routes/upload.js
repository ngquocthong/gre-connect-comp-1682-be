const express = require('express');
const multer = require('multer');
const {
    uploadFile,
    uploadMultipleFiles,
    uploadBase64,
    uploadMultipleBase64
} = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for memory storage (no temp files)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Allow all file types, or customize as needed
        cb(null, true);
    }
});

// POST /api/upload - Single file upload (multipart/form-data)
router.post('/', protect, upload.single('file'), uploadFile);

// POST /api/upload/multiple - Multiple files upload (multipart/form-data)
router.post('/multiple', protect, upload.array('files', 10), uploadMultipleFiles);

// POST /api/upload/base64 - Single file upload (base64)
router.post('/base64', protect, uploadBase64);

// POST /api/upload/base64/multiple - Multiple files upload (base64)
router.post('/base64/multiple', protect, uploadMultipleBase64);

module.exports = router;

