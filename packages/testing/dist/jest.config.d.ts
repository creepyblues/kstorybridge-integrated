import type { Config } from 'jest';
export interface JestConfigOptions {
    rootDir?: string;
    testEnvironment?: 'jsdom' | 'node';
    setupFiles?: string[];
    moduleNameMapping?: Record<string, string>;
    collectCoverageFrom?: string[];
    coverageThreshold?: {
        global: {
            branches?: number;
            functions?: number;
            lines?: number;
            statements?: number;
        };
    };
}
export declare function createJestConfig(options?: JestConfigOptions): Config;
export declare const defaultJestConfig: Config;
