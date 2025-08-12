export interface ESLintConfigOptions {
  rules?: Record<string, any>;
  ignores?: string[];
}

export function createESLintConfig(options: ESLintConfigOptions = {}) {
  const {
    rules = {},
    ignores = []
  } = options;

  return [
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      plugins: {
        react: {
          rules: {
            'react/jsx-uses-react': 'error',
            'react/jsx-uses-vars': 'error',
          },
        },
      },
      rules: {
        // Default shared rules
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        
        // Allow console in development
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        
        // Custom rules
        ...rules,
      },
    },
    {
      ignores: [
        'dist',
        'node_modules',
        '.env',
        '.env.local',
        '.env.*.local',
        'coverage',
        '*.config.js',
        '*.config.ts',
        ...ignores,
      ],
    },
  ];
}