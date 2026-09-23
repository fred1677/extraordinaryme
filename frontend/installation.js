// File: /Users/fredliu/extraordinaryme/frontend/installation.js
const os = require('os');
const fs = require('fs').promises;

const MIN_STORAGE_GB = 5;
const MIN_RAM_GB = 8;

const gatherSystemInformation = async () => {
  try {
    const platform = os.platform();
    const release = os.release();
    const totalRamGB = os.totalmem() / (1024 ** 3);
    const cpuCores = os.cpus().length;

    const rootPath = platform === 'win32' ? 'C:\\' : '/';
    const stats = await fs.statfs(rootPath);
    const freeStorageGB = (stats.bsize * stats.bfree) / (1024 ** 3);

    const systemData = {
      os_platform: platform,
      os_release: release,
      total_ram_gb: parseFloat(totalRamGB.toFixed(2)),
      available_storage_gb: parseFloat(freeStorageGB.toFixed(2)),
      cpu_cores: cpuCores,
      status: 'Passed'
    };

    if (totalRamGB < MIN_RAM_GB) systemData.status = 'Failed_RAM';
    if (freeStorageGB < MIN_STORAGE_GB) systemData.status = 'Failed_Storage';

    // Send payload to your TAO Engine Node.js backend
    await fetch('https://api.extraordinaryme.app/log-installation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(systemData)
    });

    if (systemData.status !== 'Passed') {
      console.error(`❌ Installation aborted. Reason: ${systemData.status}`);
      process.exit(1);
    }

    console.log('✅ System checks passed. Proceeding with TAO Engine download...');
    
  } catch (error) {
    console.error('❌ Diagnostic failure:', error.message);
    process.exit(1);
  }
};

gatherSystemInformation();
