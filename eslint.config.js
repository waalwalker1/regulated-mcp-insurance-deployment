import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      'coverage/**',
      'artifacts/**',
      '.agents/**',
      'docs/**',
      'brain/**',
      '.system_generated/**'
    ]
  },
  {
    files: [
      'apps/**/*.ts',
      'packages/**/*.ts',
      'tests/**/*.ts',
      'scripts/**/*.ts'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-undef': 'off'
    }
  }
];
