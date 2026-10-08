/**
 * PERPLEXTA PLATFORM - Automated Translation Coverage & Audit Script
 * 
 * This script scans the codebase to:
 * 1. Extract defined keys from the translations dictionary in `src/context/AppContext.tsx`.
 * 2. Scan all .ts and .tsx files for `t('key')` calls to check for missing translation keys.
 * 3. Audit asymmetric keys (keys defined in English but not Arabic, or vice versa).
 * 4. Scan for manual translation ternaries (e.g. `dir === 'rtl' ? 'عربي' : 'English'`) 
 *    which should be ported to the centralized translation dictionary.
 */

const fs = require('fs');
const path = require('path');

const APP_CONTEXT_PATH = path.join(__dirname, '../src/context/AppContext.tsx');
const SRC_DIR = path.join(__dirname, '../src');

// Colors for terminal formatting
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function main() {
  console.log(`${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}    PERPLEXTA AUTOMATED TRANSLATION COVERAGE AUDIT   ${COLORS.reset}`);
  console.log(`${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}\n`);

  if (!fs.existsSync(APP_CONTEXT_PATH)) {
    console.error(`${COLORS.red}Error: AppContext.tsx not found at: ${APP_CONTEXT_PATH}${COLORS.reset}`);
    process.exit(1);
  }

  // 1. Load and parse AppContext translations
  const appContextContent = fs.readFileSync(APP_CONTEXT_PATH, 'utf8');
  const lines = appContextContent.split('\n');

  let inAr = false;
  let inEn = false;
  const arKeys = {};
  const enKeys = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('ar: {')) {
      inAr = true;
      inEn = false;
      continue;
    }
    if (line.startsWith('en: {')) {
      inEn = true;
      inAr = false;
      continue;
    }
    if (line === '},' || line === '}') {
      inAr = false;
      inEn = false;
    }

    if (inAr || inEn) {
      // Parse key: 'value' or 'key': 'value'
      const match = line.match(/^['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*['"`](.*)['"`],?$/);
      if (match) {
        const key = match[1];
        const val = match[2];
        if (inAr) arKeys[key] = val;
        if (inEn) enKeys[key] = val;
      }
    }
  }

  const arKeyCount = Object.keys(arKeys).length;
  const enKeyCount = Object.keys(enKeys).length;

  console.log(`${COLORS.bright}1. Dictionary Statistics:${COLORS.reset}`);
  console.log(` - Arabic translation keys defined: ${COLORS.green}${arKeyCount}${COLORS.reset}`);
  console.log(` - English translation keys defined: ${COLORS.green}${enKeyCount}${COLORS.reset}`);

  // Check for asymmetry
  const missingInAr = [];
  const missingInEn = [];

  for (const k of Object.keys(enKeys)) {
    if (!arKeys[k]) missingInAr.push(k);
  }
  for (const k of Object.keys(arKeys)) {
    if (!enKeys[k]) missingInEn.push(k);
  }

  if (missingInAr.length > 0) {
    console.log(`\n${COLORS.yellow}⚠️  Keys defined in English but missing in Arabic (${missingInAr.length}):${COLORS.reset}`);
    missingInAr.slice(0, 10).forEach(k => console.log(`   - ${k}`));
    if (missingInAr.length > 10) console.log(`   - ... and ${missingInAr.length - 10} more`);
  } else {
    console.log(`\n${COLORS.green}✓ All English keys exist in Arabic.${COLORS.reset}`);
  }

  if (missingInEn.length > 0) {
    console.log(`\n${COLORS.yellow}⚠️  Keys defined in Arabic but missing in English (${missingInEn.length}):${COLORS.reset}`);
    missingInEn.slice(0, 10).forEach(k => console.log(`   - ${k}`));
    if (missingInEn.length > 10) console.log(`   - ... and ${missingInEn.length - 10} more`);
  } else {
    console.log(`${COLORS.green}✓ All Arabic keys exist in English.${COLORS.reset}`);
  }

  // 2. Scan codebase for manual translation patterns and t() calls
  const files = [];
  const ternariesFound = [];
  const missingKeysUsed = {};

  function scanDir(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        // Skip common large directories
        if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
          scanDir(fullPath);
        }
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }

  scanDir(SRC_DIR);
  console.log(`\n${COLORS.bright}2. Scanning Codebase:${COLORS.reset}`);
  console.log(` - Total source files (.ts/.tsx) found: ${COLORS.blue}${files.length}${COLORS.reset}`);

  // Regex patterns
  // Pattern 1: t('someKey') or t("someKey") or t(`someKey`)
  const tCallRegex = /\bt\(\s*['"`]([a-zA-Z0-9_-]+)['"`]/g;

  // Pattern 2: dir === 'rtl' ? 'عربي' : 'English' or similar inline ternaries
  const ternaryRegexes = [
    /(?:dir\s*===\s*['"]rtl['"]|language\s*===\s*['"]ar['"]|isRtl)\s*\?\s*(['"`][^'"`]+['"`])\s*:\s*(['"`][^'"`]+['"`])/g,
    /(?:dir\s*!==\s*['"]rtl['"]|language\s*!==\s*['"]ar['"]|!isRtl)\s*\?\s*(['"`][^'"`]+['"`])\s*:\s*(['"`][^'"`]+['"`])/g
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(path.join(__dirname, '..'), file);

    // Skip AppContext.tsx since that's where keys are defined
    const isAppContext = file.endsWith('AppContext.tsx');

    // 2a. Find all t() calls
    let match;
    tCallRegex.lastIndex = 0;
    while ((match = tCallRegex.exec(content)) !== null) {
      const key = match[1];
      if (!arKeys[key] || !enKeys[key]) {
        if (!missingKeysUsed[key]) {
          missingKeysUsed[key] = [];
        }
        missingKeysUsed[key].push(relativePath);
      }
    }

    if (isAppContext) continue;

    // 2b. Find all inline direction-based string ternaries
    const contentLines = content.split('\n');
    for (let lIdx = 0; lIdx < contentLines.length; lIdx++) {
      const lineContent = contentLines[lIdx];
      for (const reg of ternaryRegexes) {
        reg.lastIndex = 0;
        let tMatch;
        while ((tMatch = reg.exec(lineContent)) !== null) {
          ternariesFound.push({
            file: relativePath,
            line: lIdx + 1,
            code: lineContent.trim(),
            arabicChoice: tMatch[1],
            englishChoice: tMatch[2]
          });
        }
      }
    }
  }

  // 3. Report inline ternaries
  console.log(`\n${COLORS.bright}3. Hardcoded / Inline Ternary Translation Scan Result:${COLORS.reset}`);
  if (ternariesFound.length > 0) {
    console.log(`${COLORS.yellow}⚠️  Found ${ternariesFound.length} occurrences of hardcoded language ternaries:${COLORS.reset}`);
    ternariesFound.slice(0, 15).forEach((item, index) => {
      console.log(`   [${index + 1}] ${COLORS.blue}${item.file}:${item.line}${COLORS.reset}`);
      console.log(`       Code:   ${COLORS.yellow}${item.code}${COLORS.reset}`);
      console.log(`       Values: ${item.arabicChoice} vs ${item.englishChoice}`);
    });
    if (ternariesFound.length > 15) {
      console.log(`   - ... and ${ternariesFound.length - 15} more manual translation blocks.`);
    }
  } else {
    console.log(`${COLORS.green}✓ Clean! No manual direction-based string ternaries found.${COLORS.reset}`);
  }

  // 4. Report missing keys in t() calls
  console.log(`\n${COLORS.bright}4. Missing Keys used in t() calls:${COLORS.reset}`);
  const missingKeyCount = Object.keys(missingKeysUsed).length;
  if (missingKeyCount > 0) {
    console.log(`${COLORS.red}❌ Found ${missingKeyCount} translation keys used in t() that are missing from dictionary:${COLORS.reset}`);
    Object.keys(missingKeysUsed).forEach(key => {
      console.log(`   - Key: ${COLORS.red}"${key}"${COLORS.reset}`);
      console.log(`     Used in: ${missingKeysUsed[key].join(', ')}`);
    });
  } else {
    console.log(`${COLORS.green}✓ All t() key references are defined in the AppContext translation dictionary.${COLORS.reset}`);
  }

  // Calculate generic translation density / coverage ratio
  const estimatedCoverage = ternariesFound.length === 0 ? 100 : Math.round((arKeyCount / (arKeyCount + ternariesFound.length)) * 100);
  console.log(`\n${COLORS.bright}5. Translation Coverage Score:${COLORS.reset}`);
  console.log(` - Centralized coverage ratio: ${COLORS.cyan}${estimatedCoverage}%${COLORS.reset} (Defined Dictionary Keys vs Hardcoded Ternaries)`);
  
  console.log(`\n${COLORS.bright}${COLORS.cyan}====================================================${COLORS.reset}\n`);
}

main();
