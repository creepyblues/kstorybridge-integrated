import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createVitestConfig } from "@kstorybridge/testing/src/vitest.config";
import { fileURLToPath } from 'url';

// ES module compatibility for __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Test configuration
const testConfig = createVitestConfig({
  rootDir: __dirname,
  environment: 'jsdom',
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  ...testConfig,
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and DOM libraries
          vendor: ['react', 'react-dom'],
          
          // Router and navigation
          router: ['react-router-dom'],
          
          // State management and data fetching
          query: ['@tanstack/react-query'],
          
          // UI component libraries
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-progress',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-slot'
          ],
          
          // Styling and utility libraries
          utils: [
            'clsx',
            'tailwind-merge',
            'class-variance-authority'
          ],
          
          // Backend and data services
          backend: [
            '@supabase/supabase-js'
          ],
          
          // Shared UI components
          shared: ['@kstorybridge/ui'],
          
          // Icons
          icons: ['lucide-react'],
          
          // Forms and validation
          forms: [
            'react-hook-form',
            'zod',
            '@hookform/resolvers'
          ],
          
          // Charts and data visualization (if used)
          charts: ['recharts']
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
  },
}));
