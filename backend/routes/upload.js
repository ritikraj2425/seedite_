const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile } = require('../utils/s3');
const { protect, admin } = require('../middleware/authMiddleware');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/s3', protect, admin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = await uploadFile(req.file);

        res.json({
            url: fileUrl,
            message: 'Image uploaded successfully'
        });
    } catch (error) {
        console.error('S3 Upload Error:', error);
        res.status(500).json({ message: 'Failed to upload image' });
    }
});

module.exports = router;
