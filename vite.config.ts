import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Relative base so the same bundle works at the domain root and under a
    // sub-path such as GitHub Pages (/Talent-book/). Routing is hash-based.
    base: './',
    plugins: [react(), tailwindcss()],
    build: {
      rolldownOptions: {
        output: {
          // Keep long-lived code apart from the app: React and the sample dataset change far less often than screens.
          codeSplitting: {
            groups: [
              { name: 'vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
              { name: 'data', test: /src[\\/]data[\\/].*\.json$/ }
            ]
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
