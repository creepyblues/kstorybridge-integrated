import { defineConfig } from 'vitest/config';
import path from 'path';
export function createVitestConfig(options = {}) {
    const { rootDir = process.cwd(), environment = 'jsdom', setupFiles = [], alias = {}, coverage = {
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
            'src/**/*.d.ts',
            'src/**/*.stories.{ts,tsx}',
            'src/**/*.test.{ts,tsx}',
            'src/**/*.spec.{ts,tsx}',
        ],
        threshold: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    }, } = options;
    return defineConfig({
        test: {
            environment,
            // Setup files
            setupFiles: [
                path.resolve(__dirname, './setup.ts'),
                ...setupFiles,
            ],
            // File patterns
            include: [
                'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
                'src/**/*.{test,spec}.{ts,tsx}',
            ],
            exclude: [
                'node_modules',
                'dist',
                'build',
                '**/*.d.ts',
            ],
            // Coverage
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html', 'lcov'],
                include: coverage.include,
                exclude: coverage.exclude,
                thresholds: coverage.threshold,
            },
            // Performance
            pool: 'threads',
            poolOptions: {
                threads: {
                    singleThread: false,
                    useAtomics: true,
                },
            },
            // Timeouts
            testTimeout: 10000,
            hookTimeout: 10000,
            // Other options
            clearMocks: true,
            restoreMocks: true,
            mockReset: true,
            // Globals (for better DX)
            globals: true,
        },
        resolve: {
            alias: {
                '@': path.resolve(rootDir, './src'),
                '@kstorybridge/ui': path.resolve(rootDir, '../../packages/ui/src'),
                '@kstorybridge/auth': path.resolve(rootDir, '../../packages/auth/src'),
                '@kstorybridge/testing': path.resolve(rootDir, '../../packages/testing/src'),
                ...alias,
            },
        },
    });
}
// Default Vitest configuration
export const defaultVitestConfig = createVitestConfig();
