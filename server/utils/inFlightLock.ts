const inFlightMap = new Map<string, number>();

/**
 * Checks if a request with the exact same user, tool, and prompt is currently in-flight.
 * Locks the key if not present or expired (ttl = 30 seconds).
 */
export function acquireInFlightLock(userId: number, toolId: string, prompt: string): boolean {
  if (!userId || !prompt) return true;
  const cleanPrompt = prompt.trim().toLowerCase();
  if (!cleanPrompt) return true;

  const key = `${userId}:${toolId}:${cleanPrompt}`;
  const now = Date.now();
  const existingExpiry = inFlightMap.get(key);

  if (existingExpiry && existingExpiry > now) {
    return false; // Lock acquisition failed: identical request already in flight!
  }

  // Lock for up to 30 seconds (safety TTL)
  inFlightMap.set(key, now + 30000);
  return true;
}

/**
 * Releases the in-flight request lock once the task completes or errors out.
 */
export function releaseInFlightLock(userId: number, toolId: string, prompt: string): void {
  if (!userId || !prompt) return;
  const cleanPrompt = prompt.trim().toLowerCase();
  if (!cleanPrompt) return;

  const key = `${userId}:${toolId}:${cleanPrompt}`;
  inFlightMap.delete(key);
}
