/**
 * Platform detection utilities for MusicFlow.
 * Determines if running in Electron, Web browser, or as PWA.
 */

export const platform = {
  /**
   * Check if running in Electron (desktop app)
   */
  isElectron: typeof window !== 'undefined' && !!window.electronAPI,

  /**
   * Check if running in web browser (not Electron)
   */
  isWeb: typeof window !== 'undefined' && !window.electronAPI,

  /**
   * Check if PWA is installed (standalone mode)
   */
  isPWAInstalled:
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches,

  /**
   * Check if running on mobile device
   */
  isMobile:
    typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ),

  /**
   * Get the current platform name
   */
  getName(): 'electron' | 'web' | 'pwa' {
    if (this.isElectron) return 'electron'
    if (this.isPWAInstalled) return 'pwa'
    return 'web'
  },
}

export type Platform = ReturnType<typeof platform.getName>
