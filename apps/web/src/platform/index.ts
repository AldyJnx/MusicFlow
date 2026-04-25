/**
 * Platform abstraction entry point.
 * Exports the correct implementation based on the current platform.
 */
import { platform } from './detector'
import type { LocalDB, FileSystem } from './types'

import { webLocalDB } from './web/localDB'
import { webFileSystem } from './web/fileSystem'
import { desktopLocalDB } from './desktop/localDB'
import { desktopFileSystem } from './desktop/fileSystem'

// Export the correct implementation based on platform
export const localDB: LocalDB = platform.isElectron ? desktopLocalDB : webLocalDB

export const fileSystem: FileSystem = platform.isElectron
  ? desktopFileSystem
  : webFileSystem

// Re-export platform detection
export { platform } from './detector'
export type { LocalDB, FileSystem, Track } from './types'
