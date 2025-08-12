import type { Config } from 'prettier';
export interface PrettierConfigOptions {
    printWidth?: number;
    tabWidth?: number;
    useTabs?: boolean;
    semi?: boolean;
    singleQuote?: boolean;
    quoteProps?: 'as-needed' | 'consistent' | 'preserve';
    trailingComma?: 'none' | 'es5' | 'all';
    bracketSpacing?: boolean;
    bracketSameLine?: boolean;
    arrowParens?: 'avoid' | 'always';
    endOfLine?: 'lf' | 'crlf' | 'cr' | 'auto';
}
export declare function createPrettierConfig(options?: PrettierConfigOptions): Config;
