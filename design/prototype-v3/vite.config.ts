import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file: every script and style is inlined.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2020', cssCodeSplit: false, assetsInlineLimit: 100_000_000 },
});
