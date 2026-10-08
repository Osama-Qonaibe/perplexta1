import './server/bootstrapEnv.js';
import fs from 'fs';
import dotenv from 'dotenv';

// Safely load .env without overriding already defined environment variables
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env', override: false });
}

// If running in production and compiled bundle exists, delegate to it
if (process.env.NODE_ENV === 'production' && fs.existsSync('./dist/server.cjs')) {
  import('./dist/server.cjs');
} else if (fs.existsSync('./server/index.ts')) {
  import('./server/index.ts');
} else {
  import('./server/index.js');
}

