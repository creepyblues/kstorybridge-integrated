export function createPrettierConfig(options = {}) {
    const { printWidth = 100, tabWidth = 2, useTabs = false, semi = true, singleQuote = true, quoteProps = 'as-needed', trailingComma = 'es5', bracketSpacing = true, bracketSameLine = false, arrowParens = 'avoid', endOfLine = 'lf', } = options;
    return {
        // Code formatting
        printWidth,
        tabWidth,
        useTabs,
        semi,
        singleQuote,
        quoteProps,
        trailingComma,
        bracketSpacing,
        bracketSameLine,
        arrowParens,
        endOfLine,
        // File type specific overrides
        overrides: [
            {
                files: '*.json',
                options: {
                    printWidth: 120,
                    tabWidth: 2,
                },
            },
            {
                files: '*.md',
                options: {
                    printWidth: 80,
                    proseWrap: 'always',
                },
            },
            {
                files: ['*.yml', '*.yaml'],
                options: {
                    tabWidth: 2,
                },
            },
        ],
        // Plugin configurations
        plugins: [
            'prettier-plugin-tailwindcss', // Must be last to work properly
        ],
    };
}
