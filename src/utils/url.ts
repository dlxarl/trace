/**
 * Validates whether a URL is safe to open or render as a link in the UI.
 * Prevents execution of dangerous protocols like javascript:, data:, file:, etc.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('file:')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('#')
  );
}

/**
 * Safely extracts the pathname from a URL or returns the input string if invalid.
 */
export function safeUrlPathname(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url);
    return parsed.pathname || url;
  } catch {
    return url;
  }
}
