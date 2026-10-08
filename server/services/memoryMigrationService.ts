import { pool } from '../db/index.js';
import { extractDirectUserMemories, addMemory } from './memory.js';

export interface MemoryMigrationResult {
  usersScanned: number;
  legacyMemoriesMigrated: number;
  categoriesNormalized: number;
  newFactsSaved: number;
  duplicatesSkipped: number;
  errors: string[];
}

/**
 * 📦 Autonomous Memory Context Migration Engine
 * Converts existing unstructured user memory context & legacy records into structured local memory facts.
 */
export async function runMemoryContextMigration(): Promise<MemoryMigrationResult> {
  if (!pool) {
    throw new Error('Database pool is not active.');
  }

  const result: MemoryMigrationResult = {
    usersScanned: 0,
    legacyMemoriesMigrated: 0,
    categoriesNormalized: 0,
    newFactsSaved: 0,
    duplicatesSkipped: 0,
    errors: []
  };

  console.log('[Memory Migration] Starting execution...');

  // Step 1: Normalize legacy category names in `chat_memories` (e.g. 'personal' -> 'identity')
  try {
    const catNormalizeRes = await pool.query(
      `UPDATE chat_memories SET category = 'identity' WHERE category = 'personal'`
    );
    result.categoriesNormalized = catNormalizeRes.rowCount || 0;
    console.log(`[Memory Migration] Normalized ${result.categoriesNormalized} legacy 'personal' category records to 'identity'.`);
  } catch (err: any) {
    console.error('[Memory Migration] Error normalizing categories:', err);
    result.errors.push(`Category normalization error: ${err.message}`);
  }

  // Step 2: Migrate legacy text-based memories from `users.memory` column into `chat_memories`
  try {
    const usersRes = await pool.query(
      `SELECT id, memory FROM users WHERE memory IS NOT NULL AND trim(memory) != ''`
    );
    result.usersScanned = usersRes.rows.length;

    for (const userRow of usersRes.rows) {
      const userId = userRow.id;
      const rawMemory = userRow.memory;

      // Split memory by newlines, bullet points, or punctuation
      const lines = rawMemory
        .split(/[\n;\u2022\u25aa\u25cf\u25cb*]+/)
        .map((l: string) => l.trim().replace(/^[-•*–—\d\.\)\s]+/, '').trim())
        .filter((l: string) => l.length >= 3);

      for (const line of lines) {
        // Try extracting structured facts via local engine or fall back to raw text
        const extractedFacts = extractDirectUserMemories(line);
        const factsToProcess = extractedFacts.length > 0
          ? extractedFacts
          : [{ fact: line, category: 'general' as const }];

        for (const item of factsToProcess) {
          try {
            const savedFact = await addMemory(userId, item.fact, item.category, 'user');
            if (savedFact) {
              result.newFactsSaved++;
              result.legacyMemoriesMigrated++;
            }
          } catch (addErr: any) {
            if (addErr.message?.includes('Memory limit reached')) {
              console.warn(`[Memory Migration] User ${userId} hit memory saturation limit.`);
              break;
            } else {
              result.duplicatesSkipped++;
            }
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[Memory Migration] Error processing users.memory column:', err);
    result.errors.push(`Users memory migration error: ${err.message}`);
  }

  // Step 3: Scan `chats.context_summary` for active structured facts
  try {
    const chatsRes = await pool.query(
      `SELECT user_id, id as chat_id, context_summary FROM chats WHERE context_summary IS NOT NULL AND trim(context_summary) != ''`
    );

    for (const chatRow of chatsRes.rows) {
      const userId = chatRow.user_id;
      const chatId = chatRow.chat_id;
      const summary = chatRow.context_summary;

      const extractedFacts = extractDirectUserMemories(summary);
      for (const item of extractedFacts) {
        try {
          const savedFact = await addMemory(userId, item.fact, item.category, 'user', chatId);
          if (savedFact) {
            result.newFactsSaved++;
          }
        } catch (addErr: any) {
          result.duplicatesSkipped++;
        }
      }
    }
  } catch (err: any) {
    console.error('[Memory Migration] Error scanning chat context summaries:', err);
    result.errors.push(`Chat context summary scan error: ${err.message}`);
  }

  console.log('[Memory Migration] Execution completed:', result);
  return result;
}
