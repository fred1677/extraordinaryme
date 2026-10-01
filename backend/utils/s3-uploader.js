// File: /backend/utils/s3-uploader.js

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

console.log('[Cloudflare R2] Uploader utility initialized and ready.');

const s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY
    }
});

// 1. Original User Payload Uploader
async function uploadUserPayload(userId, s3Prefix, fileName, fileContent, mimeType) {
    const s3ObjectKey = `${userId}/${s3Prefix}/${fileName}`; 

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3ObjectKey,
        Body: fileContent,
        ContentType: mimeType
    });

    try {
        await s3Client.send(command);
        console.log(`[Cloudflare R2] Successfully uploaded: ${s3ObjectKey}`);
        return s3ObjectKey; 
    } catch (error) {
        console.error(`[Cloudflare R2 Error] Failed to upload ${s3ObjectKey}:`, error);
        throw error;
    }
}

// 2. NEW: Global System Payload Uploader (Bypasses User ID)
async function uploadSystemPayload(s3Prefix, fileName, fileContent, mimeType) {
    // This ensures the path starts exactly with your Cloudflare prefix (e.g., 'system_logs/...')
    const s3ObjectKey = `${s3Prefix}/${fileName}`; 

    const command = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3ObjectKey,
        Body: fileContent,
        ContentType: mimeType
    });

    try {
        await s3Client.send(command);
        console.log(`[Cloudflare R2] Successfully uploaded system file: ${s3ObjectKey}`);
        return s3ObjectKey; 
    } catch (error) {
        console.error(`[Cloudflare R2 Error] Failed to upload system file ${s3ObjectKey}:`, error);
        throw error;
    }
}

async function downloadUserPayload(userId, s3Prefix, fileName) {
    const s3ObjectKey = `${userId}/${s3Prefix}/${fileName}`; 

    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3ObjectKey
    });

    try {
        const response = await s3Client.send(command);
        const streamToString = (stream) =>
            new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("error", reject);
                stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            });

        const bodyContents = await streamToString(response.Body);
        return JSON.parse(bodyContents); 

    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return null;
        }
        console.error(`[Cloudflare R2 Error] Failed to download ${s3ObjectKey}:`, error);
        throw error;
    }
}

// Export the new utility
module.exports = { uploadUserPayload, uploadSystemPayload, downloadUserPayload };