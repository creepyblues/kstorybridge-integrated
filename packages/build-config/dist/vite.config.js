import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
export function createViteConfig(options = {}) {
    const { appName = 'app', port = 3000, srcPath = './src', outDir = 'dist', sourcemap = true, aliases = {} } = options;
    return defineConfig({
        plugins: [react()],
        server: {
            port,
            host: true,
        },
        build: {
            outDir,
            sourcemap,
            rollupOptions: {
                output: {
                    manualChunks: {
                        // Split vendor code
                        vendor: ['react', 'react-dom'],
                        ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                        utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
                    },
                },
            },
        },
        resolve: {
            alias: {
                '@': path.resolve(srcPath),
                // Shared package aliases
                '@kstorybridge/ui': path.resolve(__dirname, '../../ui/src'),
                '@kstorybridge/auth': path.resolve(__dirname, '../../auth/src'),
                '@kstorybridge/api-client': path.resolve(__dirname, '../../api-client/src'),
                '@kstorybridge/utils': path.resolve(__dirname, '../../utils/src'),
                ...aliases,
            },
        },
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                '@kstorybridge/ui',
                '@kstorybridge/auth',
                '@kstorybridge/api-client',
                '@kstorybridge/utils',
            ],
        },
        define: {
            'process.env.APP_NAME': JSON.stringify(appName),
        },
    });
}
