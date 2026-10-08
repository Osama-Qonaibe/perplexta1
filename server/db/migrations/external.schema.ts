import type { QueryClient } from './types.js';

// Decommissioned unused ghost external tables per Migration Audit Plan
export const EXTERNAL_SCHEMA_TABLES: { name: string; query: string }[] = [];

export async function applyExternalColumnEnforcements(targetExternalPool: QueryClient) {
  if (!targetExternalPool) return;
  // No active external schema tables to enforce
}

export const EXTERNAL_INDEXES: string[] = [];

