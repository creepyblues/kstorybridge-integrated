import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";
import { createVitestConfig } from "@kstorybridge/testing/src/vitest.config";
import { fileURLToPath } from 'url';

// ES module compatibility for __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev-only mirror of Vercel's static-file behavior: when a request for a
// directory path resolves to a public/<dir>/index.html, serve that file
// instead of falling through to the SPA. Also mirrors the /intro -> /intro/kr
// redirect declared in vercel.json so local dev matches prod.
const introStaticPlugin = (): Plugin => ({
  name: "intro-static-dev",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url ?? "";
      const [pathOnly, query = ""] = url.split("?");
      if (pathOnly === "/intro" || pathOnly === "/intro/") {
        res.writeHead(302, { Location: `/intro/kr/${query ? `?${query}` : ""}` });
        return res.end();
      }
      const match = pathOnly.match(/^\/intro\/(kr|en|one-pager)\/?$/);
      if (match) {
        const lang = match[1];
        const file = path.join(__dirname, "public", "intro", lang, "index.html");
        if (fs.existsSync(file)) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          fs.createReadStream(file).pipe(res);
          return;
        }
      }
      next();
    });
  },
});

// Test configuration
const testConfig = createVitestConfig({
  rootDir: __dirname,
  environment: 'jsdom',
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  ...testConfig,
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@kstorybridge/ui',
      'lucide-react'
    ]
  },
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false
    },
    fs: {
      strict: false,
      allow: ['../..']
    }
  },
  plugins: [
    introStaticPlugin(),
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
          icons: ['lucide-react'],
          
          // Forms and validation
          forms: [
            'react-hook-form',
            'zod',
            '@hookform/resolvers'
          ]
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600,
  },
}));
