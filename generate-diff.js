const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir1 = 'D:\\AI\\berber-clothing';
const dir2 = 'D:\\AI\\TD ECOM\\my-clothing-store';
const outputFile = 'D:\\AI\\berber-clothing\\full_comparison.diff';

const ignoreList = ['node_modules', '.next', '.git', 'dist', 'build', 'package-lock.json', '.gemini'];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (ignoreList.includes(file)) continue;
    
    const filePath = path.join(dir, file);
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        walk(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    } catch (e) {
      // Ignore files that can't be stat'd
    }
  }
  return fileList;
}

try {
  console.log('Finding files...');
  const files1 = walk(dir1);
  let changedFiles = [];

  for (const file1 of files1) {
    const relPath = path.relative(dir1, file1);
    const file2 = path.join(dir2, relPath);
    
    if (!fs.existsSync(file2)) continue;
    
    try {
      const content1 = fs.readFileSync(file1, 'utf8');
      const content2 = fs.readFileSync(file2, 'utf8');
      
      if (content1 !== content2) {
        changedFiles.push(relPath);
      }
    } catch (e) {
      // Ignore binary files or read errors
    }
  }
  
  console.log(`Generating diff for ${changedFiles.length} files...`);
  fs.writeFileSync(outputFile, 'Diff generated between TD ECOM/my-clothing-store (a) and berber-clothing (b)\n\n');
  
  let processed = 0;
  for (const f of changedFiles) {
    try {
       const cmd = `git diff --no-index "${path.join(dir2, f)}" "${path.join(dir1, f)}"`;
       execSync(cmd, { encoding: 'utf8' });
    } catch (e) {
       // git diff returns 1 when differences are found
       if (e.stdout) {
         fs.appendFileSync(outputFile, e.stdout + '\n');
       }
    }
    processed++;
    if (processed % 50 === 0) console.log(`Processed ${processed} files...`);
  }
  
  console.log(`\nSuccess! Diff file generated successfully at ${outputFile}`);
} catch (e) {
  console.error('Error:', e);
}
