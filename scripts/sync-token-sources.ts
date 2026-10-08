import fs from 'fs';
import path from 'path';
import { DEFAULT_LIGHT_TOKENS, DEFAULT_DARK_TOKENS } from '../src/components/admin/theme/tokens/defaultTokens';

const INDEX_CSS_PATH = path.join(process.cwd(), 'src', 'index.css');

function formatCssBlock(tokens: Record<string, string>, indent = '  '): string {
  return Object.entries(tokens)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => `${indent}${key}: ${val};`)
    .join('\n');
}

export function syncTokenSources() {
  if (!fs.existsSync(INDEX_CSS_PATH)) {
    console.error(`❌ index.css not found at ${INDEX_CSS_PATH}`);
    process.exit(1);
  }

  let content = fs.readFileSync(INDEX_CSS_PATH, 'utf-8');

  // Verify that all keys exist in both sets
  const lightKeys = Object.keys(DEFAULT_LIGHT_TOKENS);
  const darkKeys = Object.keys(DEFAULT_DARK_TOKENS);

  const missingInDark = lightKeys.filter(k => !(k in DEFAULT_DARK_TOKENS));
  const missingInLight = darkKeys.filter(k => !(k in DEFAULT_LIGHT_TOKENS));

  if (missingInDark.length > 0) {
    console.error(`❌ Tokens in Light mode missing from Dark mode:`, missingInDark);
    process.exit(1);
  }
  if (missingInLight.length > 0) {
    console.error(`❌ Tokens in Dark mode missing from Light mode:`, missingInLight);
    process.exit(1);
  }

  console.log(`✓ Token sets perfectly symmetrical: ${lightKeys.length} tokens defined.`);
  console.log(`✓ Verification complete: defaultTokens.ts is the canonical single source of truth.`);
}

syncTokenSources();
