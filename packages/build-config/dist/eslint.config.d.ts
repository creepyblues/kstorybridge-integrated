export interface ESLintConfigOptions {
    rules?: Record<string, any>;
    ignores?: string[];
}
export declare function createESLintConfig(options?: ESLintConfigOptions): ({
    files: string[];
    languageOptions: {
        ecmaVersion: number;
        sourceType: string;
        parserOptions: {
            ecmaFeatures: {
                jsx: boolean;
            };
        };
    };
    plugins: {
        react: {
            rules: {
                'react/jsx-uses-react': string;
                'react/jsx-uses-vars': string;
            };
        };
    };
    rules: {
        'no-unused-vars': string;
        '@typescript-eslint/no-unused-vars': string;
        'react/react-in-jsx-scope': string;
        'react/prop-types': string;
        'no-console': string;
    };
    ignores?: undefined;
} | {
    ignores: string[];
    files?: undefined;
    languageOptions?: undefined;
    plugins?: undefined;
    rules?: undefined;
})[];
