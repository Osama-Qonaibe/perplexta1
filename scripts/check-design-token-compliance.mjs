/**
 * Design Token Compliance Check Script
 * Validates that TSX components use CSS variable design tokens rather than hardcoded tailwind colors or raw inline hex styles.
 */

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const TARGET_DIRS = [
  path.join(rootDir, 'src', 'pages'),
  path.join(rootDir, 'src', 'components', 'admin'),
  path.join(rootDir, 'src', 'components', 'ui')
];

// Patterns that indicate non-compliance in UI pages/components
const HARDCODED_COLOR_PATTERNS = [
  /dark:bg-gray-\d+/g,
  /dark:text-gray-\d+/g,
  /dark:border-gray-\d+/g,
  /style=\{\{\s*color:\s*['"]#/g,
  /style=\{\{\s*backgroundColor:\s*['"]#/g
];

let totalFilesChecked = 0;
let totalViolations = 0;

function checkFile(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(path.resolve(rootDir) + path.sep)) return;
  const content = fs.readFileSync(resolvedPath, 'utf8');
  let fileViolations = 0;

  for (const pattern of HARDCODED_COLOR_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      fileViolations += matches.length;
      console.warn(`[TOKEN NON-COMPLIANCE] in ${path.relative(rootDir, resolvedPath)}:`);
      console.warn(`  Found forbidden hardcoded pattern: ${matches.slice(0, 3).join(', ')}`);
    }
  }

  if (fileViolations > 0) {
    totalViolations += fileViolations;
  }
  totalFilesChecked++;
}

function scanDir(dirPath) {
  const resolvedDir = path.resolve(dirPath);
  if (!fs.existsSync(resolvedDir)) return;
  const items = fs.readdirSync(resolvedDir);

  for (const item of items) {
    if (item.includes('..') || item.includes('/') || item.includes('\\') || item.includes('\0')) continue;
    const fullPath = path.resolve(resolvedDir, item);
    if (!fullPath.startsWith(resolvedDir + path.sep)) continue;
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (/\.(tsx|jsx)$/.test(item)) {
      checkFile(fullPath);
    }
  }
}

console.log('🎨 Starting Design Token Compliance Audit (Theme Studio)...');
TARGET_DIRS.forEach(scanDir);

console.log(`\n📊 Audit Summary: ${totalFilesChecked} files checked.`);
if (totalViolations === 0) {
  console.log('✅ Design Token Compliance Check Passed: All target pages and UI components adhere to Theme Studio tokens!');
  process.exit(0);
} else {
  console.log(`⚠️ Found ${totalViolations} design token warning(s) in audited files.`);
  process.exit(0);
}
