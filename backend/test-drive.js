// File: /Users/fredliu/extraordinaryme/backend/test-drive.js
require('dotenv').config(); // Loads your .env credentials
const { uploadFileToDrive } = require('./cloud-drive/googledrive');

async function testUpload() {
  console.log('Initiating Google Drive upload test...');

  // Mocking a file object exactly as it would arrive from a frontend form upload
  const dummyFile = {
    originalname: 'tao-engine-test.txt',
    mimetype: 'text/plain',
    buffer: Buffer.from('Integration successful. TAO Engine is connected to Google Drive.')
  };

  try {
    const result = await uploadFileToDrive(dummyFile);
    console.log('\n✅ Success! File uploaded.');
    console.log('File ID:', result.id);
    console.log('Web View Link:', result.webViewLink);
  } catch (error) {
    console.error('\n❌ Upload Failed:', error.message);
  }
}

testUpload();