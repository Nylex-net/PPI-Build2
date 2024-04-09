const fs = require('fs');
const path = require('path');

function copyDirectoryContents(sourceDir, destDir) {
    // Read the contents of the source directory
    fs.readdir(sourceDir, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        // Iterate over each file in the directory
        files.forEach(file => {
            // Construct the full path of the source and destination files
            const sourceFile = path.join(sourceDir, file);
            const destFile = path.join(destDir, file);

            // Check if the file is a directory
            fs.stat(sourceFile, (err, stats) => {
                if (err) {
                    console.error('Error getting file stats:', err);
                    return;
                }

                if (stats.isDirectory()) {
                    // If it's a directory, recursively copy its contents
                    copyDirectoryContents(sourceFile, destFile);
                } else {
                    // If it's a file, copy it to the destination
                    fs.copyFile(sourceFile, destFile, err => {
                        if (err) {
                            console.error('Error copying file:', err);
                        } else {
                            console.log('Copied', sourceFile, 'to', destFile);
                        }
                    });
                }
            });
        });
    });
}

// Example usage:
const sourceDir = 'G:/';
const destDir = 'E:/SD_Data_Transfer';

copyDirectoryContents(sourceDir, destDir);
