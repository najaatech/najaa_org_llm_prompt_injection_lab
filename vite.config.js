import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React interface lives in app/client and is built into app/dist, which Express serves.
export default defineConfig({
  root: 'app/client',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true, sourcemap: false },
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:3000' } }
});
