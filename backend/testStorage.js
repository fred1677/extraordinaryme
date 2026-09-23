// backend/testStorage.js
const { getStorageDestination } = require('./utils/storageRouter');

async function runTest() {
    console.log('Testing file routing and automatic folder creation...');
    
    // Simulating different file sizes to trigger all three folders
    const path1 = await getStorageDestination(50000);    // 50 KB -> host_1
    console.log('Routed 50KB file to:', path1);
    
    const path2 = await getStorageDestination(500000);   // 500 KB -> host_2
    console.log('Routed 500KB file to:', path2);
    
    const path3 = await getStorageDestination(5000000);  // 5 MB -> host_3
    console.log('Routed 5MB file to:', path3);
    
    console.log('Test complete! Check your storage folder.');
    process.exit(0);
}

runTest();