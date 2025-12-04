/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8085,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // UI libraries
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
          ],

          // Rich text editor (large dependency)
          'vendor-tiptap': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-blockquote',
            '@tiptap/extension-code',
            '@tiptap/extension-code-block',
            '@tiptap/extension-horizontal-rule',
            '@tiptap/extension-image',
            '@tiptap/extension-link',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-strike',
            '@tiptap/extension-underline',
            '@tiptap/extension-character-count',
          ],

          // PDF viewer (large dependency)
          'vendor-pdf': ['react-pdf'],

          // Form libraries
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],

          // Data fetching
          'vendor-query': ['@tanstack/react-query'],

          // Backend
          'vendor-supabase': ['@supabase/supabase-js'],

          // Icons (large)
          'vendor-icons': ['lucide-react'],

          // Utils
          'vendor-utils': ['clsx', 'tailwind-merge', 'class-variance-authority', 'date-fns', 'dompurify'],
        },
      },
    },
    // Set chunk size warning limit to 500 KB
    chunkSizeWarningLimit: 500,
  },
});
