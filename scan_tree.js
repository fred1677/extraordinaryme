const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'project_tree.txt';
const IGNORE_LIST = ['node_modules', '.git', '.DS_Store'];

let treeOutput = "ExtraordinaryMe - Project Structure\n===================================\n\n";

function scanDirectory(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    // Filter out ignored files and folders
    const filteredFiles = files.filter(file => !IGNORE_LIST.includes(file));
    
    filteredFiles.forEach((file, index) => {
        const fullPath = path.join(dir, file);
        const isLast = index === filteredFiles.length - 1;
        const pointer = isLast ? '└── ' : '├── ';
        
        treeOutput += `${prefix}${pointer}${file}\n`;
        
        // If it's a folder, run the function again inside that folder
        if (fs.statSync(fullPath).isDirectory()) {
            const nextPrefix = prefix + (isLast ? '    ' : '│   ');
            scanDirectory(fullPath, nextPrefix);
        }
    });
}

// Start scanning from the current directory
scanDirectory(__dirname);

// Save the result to a text file
fs.writeFileSync(OUTPUT_FILE, treeOutput);
console.log(`Success! Your project tree has been saved to ${OUTPUT_FILE}`);