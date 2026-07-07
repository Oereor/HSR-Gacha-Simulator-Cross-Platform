/**
 * Icon service. Provides cached URL strings for icon PNG files.
 * Mirrors IIconService.
 *
 * - Icons are served from /Icons/ (the public/ directory).
 * - No actual image decoding is performed; the browser handles that.
 * - The "cache" is a simple Map<string, string> keyed by file name,
 *   storing the resolved URL.
 */
export function useIconService() {
  const cache = new Map<string, string>();

  /**
   * Returns the public URL for an icon file, or null if it does not exist.
   * Since we can't check file existence from the browser, we always return
   * the URL and let the <img> tag's @error handler hide the element.
   *
   * @param fileName — e.g. "Path_Destruction.png", "Element_Fire.png"
   * @returns URL string like "/Icons/Path_Destruction.png"
   */
  function getUrl(fileName: string): string {
    if (cache.has(fileName)) return cache.get(fileName)!;
    const url = `/Icons/${fileName}`;
    cache.set(fileName, url);
    return url;
  }

  return { getUrl };
}
