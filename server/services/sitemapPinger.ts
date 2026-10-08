import { getBaseUrl } from '../utils/request.js';
import type { Request } from 'express';

export async function pingSearchEngines(req?: Request, customBaseUrl?: string): Promise<{ google: boolean; bing: boolean }> {
  // Outbound search engine pings disabled to enforce strict internal server scope and zero outbound traffic
  return { google: false, bing: false };
}
