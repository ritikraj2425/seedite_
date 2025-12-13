const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const generateFileName = (originalName) => {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    return `mock-test-images/${timestamp}-${random}${extension}`;
};

const uploadFile = async (file) => {
    const fileName = generateFileName(file.originalname);
    const contentType = file.mimetype;
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: contentType,
        // ACL: 'public-read' // Uncomment if bucket is not public by policy but you want object to be public
    });

    await s3Client.send(command);

    // Return the URL
    if (process.env.CLOUDFRONT_DOMAIN) {
        return `https://${process.env.CLOUDFRONT_DOMAIN}/${fileName}`;
    }

    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${fileName}`;
};

module.exports = {
    s3Client,
    uploadFile
};
