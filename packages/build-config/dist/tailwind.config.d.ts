import type { Config } from 'tailwindcss';
export interface TailwindConfigOptions {
    content?: string[];
    theme?: Record<string, any>;
    plugins?: any[];
}
export declare function createTailwindConfig(options?: TailwindConfigOptions): Config;
