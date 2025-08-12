export interface VitestConfigOptions {
    rootDir?: string;
    environment?: 'jsdom' | 'node';
    setupFiles?: string[];
    alias?: Record<string, string>;
    coverage?: {
        include?: string[];
        exclude?: string[];
        threshold?: {
            branches?: number;
            functions?: number;
            lines?: number;
            statements?: number;
        };
    };
}
export declare function createVitestConfig(options?: VitestConfigOptions): import("vite").UserConfig;
export declare const defaultVitestConfig: import("vite").UserConfig;
