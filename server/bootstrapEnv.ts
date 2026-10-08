import { loadEnvFile } from 'node:process';
import fs from 'node:fs';

const vpsEnv = '/home/perplexta1/public_html/.env';

try {
  if (fs.existsSync(vpsEnv)) {
    loadEnvFile(vpsEnv);
  } else if (fs.existsSync('.env')) {
    loadEnvFile('.env');
  } else {
    loadEnvFile();
  }
} catch {
  // Graceful fallback if already injected or non-existent in current runner
}
