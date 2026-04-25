// User types
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'CLIENT';
  createdAt: Date;
  updatedAt: Date;
}

// Track types
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  durationMs: number;
  filePath?: string;
  coverUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Playlist types
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  isPublic: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// EQ types
export interface EQPreset {
  id: string;
  name: string;
  bands: number[];
  isGlobal: boolean;
  userId?: string;
}

export interface EQSegment {
  id: string;
  trackId: string;
  startMs: number;
  endMs: number;
  bands: number[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}
