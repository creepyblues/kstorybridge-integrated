// vite.config.ts
import { defineConfig } from "file:///Users/sungholee/code/kstorybridge/node_modules/vite/dist/node/index.js";
import react from "file:///Users/sungholee/code/kstorybridge/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///Users/sungholee/code/kstorybridge/node_modules/lovable-tagger/dist/index.js";
import { createVitestConfig } from "file:///Users/sungholee/code/kstorybridge/packages/testing/src/vitest.config.ts";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/sungholee/code/kstorybridge/apps/website/vite.config.ts";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var testConfig = createVitestConfig({
  rootDir: __dirname,
  environment: "jsdom"
});
var vite_config_default = defineConfig(({ mode }) => ({
  ...testConfig,
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@kstorybridge/ui",
      "lucide-react"
    ]
  },
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: false
    },
    fs: {
      strict: false
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React and DOM libraries
          vendor: ["react", "react-dom"],
          // Router and navigation
          router: ["react-router-dom"],
          // UI component libraries
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-switch",
            "@radix-ui/react-slot"
          ],
          // Styling and utility libraries
          utils: [
            "clsx",
            "tailwind-merge",
            "class-variance-authority"
          ],
          // Backend and data services
          backend: [
            "@supabase/supabase-js"
          ],
          // Shared UI components
          shared: ["@kstorybridge/ui"],
          // Icons
          icons: ["lucide-react"],
          // Forms and validation
          forms: [
            "react-hook-form",
            "zod",
            "@hookform/resolvers"
          ]
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 600
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc3VuZ2hvbGVlL2NvZGUva3N0b3J5YnJpZGdlL2FwcHMvd2Vic2l0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3N1bmdob2xlZS9jb2RlL2tzdG9yeWJyaWRnZS9hcHBzL3dlYnNpdGUvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3N1bmdob2xlZS9jb2RlL2tzdG9yeWJyaWRnZS9hcHBzL3dlYnNpdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IGNyZWF0ZVZpdGVzdENvbmZpZyB9IGZyb20gXCJAa3N0b3J5YnJpZGdlL3Rlc3Rpbmcvc3JjL3ZpdGVzdC5jb25maWdcIjtcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnO1xuXG4vLyBFUyBtb2R1bGUgY29tcGF0aWJpbGl0eSBmb3IgX19kaXJuYW1lXG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKTtcblxuLy8gVGVzdCBjb25maWd1cmF0aW9uXG5jb25zdCB0ZXN0Q29uZmlnID0gY3JlYXRlVml0ZXN0Q29uZmlnKHtcbiAgcm9vdERpcjogX19kaXJuYW1lLFxuICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcbn0pO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcbiAgLi4udGVzdENvbmZpZyxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ0Brc3RvcnlicmlkZ2UvdWknLFxuICAgICAgJ2x1Y2lkZS1yZWFjdCdcbiAgICBdXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA1MTczLFxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogZmFsc2VcbiAgICB9LFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IGZhbHNlXG4gICAgfVxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBtb2RlID09PSAnZGV2ZWxvcG1lbnQnICYmXG4gICAgY29tcG9uZW50VGFnZ2VyKCksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIENvcmUgUmVhY3QgYW5kIERPTSBsaWJyYXJpZXNcbiAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJ10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gUm91dGVyIGFuZCBuYXZpZ2F0aW9uXG4gICAgICAgICAgcm91dGVyOiBbJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBVSSBjb21wb25lbnQgbGlicmFyaWVzXG4gICAgICAgICAgdWk6IFtcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudScsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRhYnMnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10b2FzdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXRvb2x0aXAnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1jaGVja2JveCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXN3aXRjaCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNsb3QnXG4gICAgICAgICAgXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBTdHlsaW5nIGFuZCB1dGlsaXR5IGxpYnJhcmllc1xuICAgICAgICAgIHV0aWxzOiBbXG4gICAgICAgICAgICAnY2xzeCcsXG4gICAgICAgICAgICAndGFpbHdpbmQtbWVyZ2UnLFxuICAgICAgICAgICAgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eSdcbiAgICAgICAgICBdLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIEJhY2tlbmQgYW5kIGRhdGEgc2VydmljZXNcbiAgICAgICAgICBiYWNrZW5kOiBbXG4gICAgICAgICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gU2hhcmVkIFVJIGNvbXBvbmVudHNcbiAgICAgICAgICBzaGFyZWQ6IFsnQGtzdG9yeWJyaWRnZS91aSddLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIEljb25zXG4gICAgICAgICAgaWNvbnM6IFsnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gRm9ybXMgYW5kIHZhbGlkYXRpb25cbiAgICAgICAgICBmb3JtczogW1xuICAgICAgICAgICAgJ3JlYWN0LWhvb2stZm9ybScsXG4gICAgICAgICAgICAnem9kJyxcbiAgICAgICAgICAgICdAaG9va2Zvcm0vcmVzb2x2ZXJzJ1xuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc2l6ZSB3YXJuaW5nc1xuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxuICB9LFxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUErVCxTQUFTLG9CQUFvQjtBQUM1VixPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMscUJBQXFCO0FBTHdLLElBQU0sMkNBQTJDO0FBUXZQLElBQU0sWUFBWSxLQUFLLFFBQVEsY0FBYyx3Q0FBZSxDQUFDO0FBRzdELElBQU0sYUFBYSxtQkFBbUI7QUFBQSxFQUNwQyxTQUFTO0FBQUEsRUFDVCxhQUFhO0FBQ2YsQ0FBQztBQUdELElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsR0FBRztBQUFBLEVBQ0gsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsSUFDQSxJQUFJO0FBQUEsTUFDRixRQUFRO0FBQUEsSUFDVjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVMsaUJBQ1QsZ0JBQWdCO0FBQUEsRUFDbEIsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxXQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBO0FBQUEsVUFHN0IsUUFBUSxDQUFDLGtCQUFrQjtBQUFBO0FBQUEsVUFHM0IsSUFBSTtBQUFBLFlBQ0Y7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQTtBQUFBLFVBR0EsT0FBTztBQUFBLFlBQ0w7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQTtBQUFBLFVBR0EsU0FBUztBQUFBLFlBQ1A7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUdBLFFBQVEsQ0FBQyxrQkFBa0I7QUFBQTtBQUFBLFVBRzNCLE9BQU8sQ0FBQyxjQUFjO0FBQUE7QUFBQSxVQUd0QixPQUFPO0FBQUEsWUFDTDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQSxFQUN6QjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
