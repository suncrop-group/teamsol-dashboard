import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import pkg from './package.json';

// https://vite.dev/config/
// The build's identity, sent to the backend with every request.
const APP_VERSION = `${pkg.version}+${new Date().toISOString().slice(0, 10)}`;

export default defineConfig({
  plugins: [react()],
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
