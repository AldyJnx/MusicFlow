/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    fs: {
      readDir: (path: string) => Promise<string[]>;
      readFile: (path: string) => Promise<ArrayBuffer>;
      writeFile: (path: string, data: ArrayBuffer) => Promise<void>;
    };
    sqlite: {
      query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
      run: (sql: string, params?: unknown[]) => Promise<{ changes: number; lastInsertRowid: number }>;
    };
    app: {
      getVersion: () => Promise<string>;
      platform: () => Promise<string>;
    };
  };
}
