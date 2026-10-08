/**
 * TOKEN RESOLVER UTILITY
 * 
 * Standardized single point of resolution for CSS custom properties.
 * Resolves token values directly from document.documentElement or computed root style,
 * with fallback handling for canvas, chart SVGs, and iframe sandbox injections.
 */

export function resolveToken(tokenName: string, fallback?: string): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback || '';
  }

  const normalized = tokenName.startsWith('--') ? tokenName : `--${tokenName}`;
  const value = getComputedStyle(document.documentElement).getPropertyValue(normalized).trim();
  
  if (value) {
    return value;
  }

  return fallback || '';
}

export function resolveTokens(tokenNames: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return result;
  }

  const computed = getComputedStyle(document.documentElement);
  for (const name of tokenNames) {
    const normalized = name.startsWith('--') ? name : `--${name}`;
    result[normalized] = computed.getPropertyValue(normalized).trim();
  }
  return result;
}

export default resolveToken;
