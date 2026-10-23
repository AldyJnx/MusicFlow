/**
 * Returns a browser-safe avatar URL. Google supplies profile photos with a
 * short-lived, size-specific suffix; requesting a normalised size keeps the
 * same photo usable in the profile and the sidebar.
 */
export function getAvatarUrl(avatar?: string | null): string | null {
  const value = avatar?.trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    if (/(^|\.)googleusercontent\.com$/i.test(url.hostname)) {
      return value.replace(/=s\d+(?:-[a-z]+)*$/i, "=s256-c");
    }

    return value;
  } catch {
    return null;
  }
}
