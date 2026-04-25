// EQ Constants
export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_MIN_GAIN = -15;
export const EQ_MAX_GAIN = 15;
export const EQ_BANDS_COUNT = 10;

// EQ Presets
export const EQ_PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  bass_boost: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  treble_boost: [0, 0, 0, 0, 0, 0, 2, 4, 5, 6],
  vocal: [-2, -1, 0, 2, 4, 4, 3, 2, 0, -1],
  rock: [4, 3, 2, 0, -1, 0, 2, 3, 4, 4],
  electronic: [4, 3, 1, 0, -2, -1, 1, 3, 4, 5],
  acoustic: [3, 2, 1, 1, 0, 0, 0, 1, 2, 2],
  classical: [0, 0, 0, 0, 0, 0, -2, -3, -3, -4],
} as const;

// API Constants
export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Audio Constants
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'flac', 'wav', 'm4a', 'ogg', 'aac'] as const;
export const MAX_FILE_SIZE_MB = 50;

// JWT Constants
export const ACCESS_TOKEN_EXPIRY = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
