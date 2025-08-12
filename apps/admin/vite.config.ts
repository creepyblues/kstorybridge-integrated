import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8082,
    strictPort: true,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and DOM libraries
          vendor: ['react', 'react-dom'],
          
          // Router and navigation
          router: ['react-router-dom'],
          
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
          icons: ['lucide-react']
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
  },
}));
