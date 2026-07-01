/// <reference lib="webworker" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Split the big, rarely-changing dependencies into their own cached
        // chunks so the initial bundle stays small and vendor code isn't
        // re-downloaded on every app deploy.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
            return 'react-vendor'
          if (id.includes('@tanstack')) return 'query-vendor'
          if (/[\\/](i18next|react-i18next)[\\/]/.test(id)) return 'i18n-vendor'
          if (/[\\/](music-metadata|strtok3|token-types|peek-readable|uint8array-extras)[\\/]/.test(id))
            return 'media-vendor'
          return 'vendor'
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: [
        'favicon.svg',
        'music_flow.svg',
        'icons.svg',
        'icons/pwa-192-any.png',
        'icons/pwa-512-any.png',
        'icons/pwa-192-maskable.png',
        'icons/pwa-512-maskable.png',
      ],
      manifest: {
        name: 'MusicFlow',
        short_name: 'MusicFlow',
        description:
          'Reproductor musical multiplataforma con ecualizacion granular asistida por IA.',
        theme_color: '#10182d',
        background_color: '#07131a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'es',
        categories: ['music', 'entertainment'],
        icons: [
          {
            src: 'icons/pwa-192-any.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512-any.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/pwa-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'music_flow.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.hostname.endsWith('r2.dev') ||
              url.hostname.endsWith('r2.cloudflarestorage.com'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'r2-media',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Runtime callback executes inside the service worker.
            urlPattern: ({ url, request }) =>
              request.destination === 'image' && url.origin === self.location.origin,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            // Catalog reads — stale-while-revalidate so the library shows
            // last-known tracks/saves/playlists/billing without network and
            // refreshes in the background when the user reconnects. Limited
            // to read-only endpoints; mutations stay network-only.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' &&
              url.pathname.startsWith('/api/') &&
              (url.pathname.startsWith('/api/library/') ||
                url.pathname.startsWith('/api/equalizer/presets') ||
                url.pathname.startsWith('/api/equalizer/configs') ||
                url.pathname.startsWith('/api/billing/quota')),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'musicflow-api',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
