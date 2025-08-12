import path from 'path';
export function createJestConfig(options = {}) {
    const { rootDir = process.cwd(), testEnvironment = 'jsdom', setupFiles = [], moduleNameMapping = {}, collectCoverageFrom = [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
    ], coverageThreshold = {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    }, } = options;
    return {
        preset: 'ts-jest',
        testEnvironment,
        rootDir,
        // Setup files
        setupFilesAfterEnv: [
            path.resolve(__dirname, './setup.ts'),
            ...setupFiles,
        ],
        // Module resolution
        moduleNameMapper: {
            // CSS modules and assets
            '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
            '\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-stub',
            // Path aliases
            '^@/(.*)$': '<rootDir>/src/$1',
            '^@kstorybridge/ui$': '<rootDir>/../../packages/ui/src',
            '^@kstorybridge/auth$': '<rootDir>/../../packages/auth/src',
            '^@kstorybridge/testing$': '<rootDir>/../../packages/testing/src',
            // Custom mappings
            ...moduleNameMapping,
        },
        // File patterns
        testMatch: [
            '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
            '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
        ],
        // File extensions to process
        moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
        // Transform patterns
        transform: {
            '^.+\\.(ts|tsx)$': 'ts-jest',
        },
        // Files to ignore
        testPathIgnorePatterns: [
            '<rootDir>/node_modules/',
            '<rootDir>/dist/',
            '<rootDir>/build/',
        ],
        // Coverage configuration
        collectCoverageFrom,
        coverageDirectory: '<rootDir>/coverage',
        coverageReporters: ['text', 'lcov', 'html'],
        coverageThreshold,
        // Performance
        maxWorkers: '50%',
        // Timeouts
        testTimeout: 10000,
        // Other options
        clearMocks: true,
        restoreMocks: true,
        verbose: true,
    };
}
// Default Jest configuration  
export const defaultJestConfig = createJestConfig();
