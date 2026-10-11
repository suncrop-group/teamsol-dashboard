import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import pkg from './package.json';

// https://vite.dev/config/
// The build's identity, sent to the backend with every request.
const APP_VERSION = `${pkg.version}+${new Date().toISOString().slice(0, 10)}`;

export default defineConfig({
  plugins: [
    react(),
    // Makes the dashboard installable as an app (PWA). The service worker
    // keeps the app's own files so it opens instantly and without a
    // connection; everything from the API is always fetched live.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['suncrop-logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'TeamSol',
        short_name: 'TeamSol',
        description: 'Sales, expenses, fleet and events for field teams.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // A new deploy takes over on the next visit, without a second reload.
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // The main script is about 1 MB.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // Any route of the single-page app is served the app shell.
        navigateFallback: '/index.html',
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
});
