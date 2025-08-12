export interface ViteConfigOptions {
    appName?: string;
    port?: number;
    srcPath?: string;
    outDir?: string;
    sourcemap?: boolean;
    aliases?: Record<string, string>;
}
export declare function createViteConfig(options?: ViteConfigOptions): import("vite").UserConfig;
