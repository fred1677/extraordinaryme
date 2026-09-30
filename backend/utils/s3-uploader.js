// File: /backend/utils/s3-uploader.js

/**
 * ============================================================================
 * AMAZON S3 DELIVERY ENGINE (The Utility)
 * ============================================================================
 * Handles both PUT (uploading) and GET (downloading) of isolated JSON payloads.
 * ============================================================================
 */
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

console.log('[AWS S3] Uploader utility initialized and ready.');

const s3Client = new S3Client({
    region: 'us-east-1' 
});

/**
 * uploadUserPayload (POST)
 */
async function uploadUserPayload(userId, s3Prefix, fileName, fileContent, mimeType) {
    const s3ObjectKey = `${userId}/${s3Prefix}/${fileName}`; 

    const command = new PutObjectCommand({
        Bucket: 'extraordinaryme-storage',
        Key: s3ObjectKey,
        Body: fileContent,
        ContentType: mimeType
    });

    try {
        await s3Client.send(command);
        console.log(`[AWS S3] Successfully uploaded: ${s3ObjectKey}`);
        return s3ObjectKey; 
    } catch (error) {
        console.error(`[AWS S3 Error] Failed to upload ${s3ObjectKey}:`, error);
        throw error;
    }
}

/**
 * downloadUserPayload (GET)
 * Retrieves a specific file from S3 and converts the stream to a JSON object.
 */
async function downloadUserPayload(userId, s3Prefix, fileName) {
    const s3ObjectKey = `${userId}/${s3Prefix}/${fileName}`; 

    const command = new GetObjectCommand({
        Bucket: 'extraordinaryme-storage',
        Key: s3ObjectKey
    });

    try {
        const response = await s3Client.send(command);
        // AWS S3 returns a stream. We must convert the stream to a string.
        const streamToString = (stream) =>
            new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("error", reject);
                stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            });

        const bodyContents = await streamToString(response.Body);
        return JSON.parse(bodyContents); // Return the parsed JSON object

    } catch (error) {
        // If the file doesn't exist (e.g., they haven't saved anything for this date yet),
        // we just return null so the frontend can render a blank slate.
        if (error.name === 'NoSuchKey') {
            return null;
        }
        console.error(`[AWS S3 Error] Failed to download ${s3ObjectKey}:`, error);
        throw error;
    }
}

// Export BOTH tools so extraordinaryme.js can use them.
module.exports = { uploadUserPayload, downloadUserPayload };