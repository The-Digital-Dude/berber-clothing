const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir1 = 'D:\\AI\\berber-clothing';
const dir2 = 'D:\\AI\\TD ECOM\\my-clothing-store';

const ignoreList = ['node_modules', '.next', '.git', 'dist', 'build', '.env', 'package-lock.json', '.gemini'];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (ignoreList.includes(file)) continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

try {
  console.log('Finding files...');
  const files1 = walk(dir1);
  let changedFiles = [];
  let missingFiles = [];

  for (const file1 of files1) {
    const relPath = path.relative(dir1, file1);
    const file2 = path.join(dir2, relPath);
    
    if (!fs.existsSync(file2)) {
      missingFiles.push(relPath);
      continue;
    }
    
    const content1 = fs.readFileSync(file1, 'utf8');
    const content2 = fs.readFileSync(file2, 'utf8');
    
    if (content1 !== content2) {
      changedFiles.push(relPath);
    }
  }
  
  console.log('\n--- COMPARISON RESULTS ---\n');
  console.log(`Files missing in target (${missingFiles.length}):`);
  if (missingFiles.length > 0 && missingFiles.length <= 50) {
    missingFiles.forEach(f => console.log('MISSING: ' + f));
  } else if (missingFiles.length > 50) {
    console.log(`(Too many to list, ${missingFiles.length} files missing)`);
  } else {
    console.log('None.');
  }
  
  console.log(`\nFiles changed (${changedFiles.length}):`);
  changedFiles.forEach(f => console.log('MODIFIED: ' + f));
  
  // Create a detailed diff for changed files (up to the first 5 to avoid enormous output)
  if (changedFiles.length > 0) {
    console.log(`\n--- DIFF FOR FIRST 5 CHANGED FILES ---\n`);
    for (let i = 0; i < Math.min(5, changedFiles.length); i++) {
      const f = changedFiles[i];
      console.log(`Diff for ${f}:`);
      try {
         // Using git diff --no-index
         const cmd = `git diff --no-index "${path.join(dir2, f)}" "${path.join(dir1, f)}"`;
         const diffOutput = execSync(cmd, { encoding: 'utf8' });
         console.log(diffOutput);
      } catch (e) {
         // git diff returns exit code 1 when there's a diff
         console.log(e.stdout);
      }
      console.log('--------------------------------------------------\n');
    }
    if (changedFiles.length > 5) {
      console.log(`... and ${changedFiles.length - 5} more files changed.`);
    }
  }
} catch (e) {
  console.error('Error during comparison:', e);
}
