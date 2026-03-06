const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../frontend/src');

// Function to recursively find all .tsx and .ts files
const findFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findFiles(filePath, fileList);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
};

const replaceColors = () => {
    const files = findFiles(directoryPath);
    let totalReplacements = 0;

    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Semantic Replacements
        content = content.replace(/bg-ci-dark/g, 'bg-background');
        content = content.replace(/(?<!border-)text-white/g, 'text-foreground');
        content = content.replace(/bg-white\/5/g, 'bg-[color:var(--glass-bg)]');
        content = content.replace(/hover:bg-white\/5/g, 'hover:bg-[color:var(--glass-bg-hover)]');
        content = content.replace(/bg-white\/10(?!\])/g, 'bg-[color:var(--glass-border)]');
        content = content.replace(/border-white\/10/g, 'border-[color:var(--glass-border)]');
        content = content.replace(/border-white\/20/g, 'border-[color:var(--glass-border)]');
        content = content.replace(/border-white\/5/g, 'border-[color:var(--glass-border)]');

        // Gray text mapped to muted-foreground
        content = content.replace(/text-gray-300/g, 'text-muted-foreground');
        content = content.replace(/text-gray-400/g, 'text-muted-foreground');
        content = content.replace(/text-gray-500/g, 'text-muted-foreground');
        content = content.replace(/text-gray-600/g, 'text-muted-foreground');

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Updated: ${path.relative(directoryPath, file)}`);
            totalReplacements++;
        }
    }

    console.log(`\nFinished! Updated ${totalReplacements} files.`);
};

replaceColors();
