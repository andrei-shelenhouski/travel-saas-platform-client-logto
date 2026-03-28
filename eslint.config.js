// @ts-check
// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
const storybook = require('eslint-plugin-storybook');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

/** @type {Record<string, import('eslint').Linter.RuleEntry>} */
const tsLintRulesBase = {
  '@angular-eslint/directive-selector': [
    'error',
    {
      type: 'attribute',
      prefix: 'app',
      style: 'camelCase',
    },
  ],
  '@angular-eslint/component-selector': [
    'error',
    {
      type: ['attribute', 'element'],
      prefix: 'app',
      style: 'kebab-case',
    },
  ],

  // Angular best practices
  '@angular-eslint/no-empty-lifecycle-method': 'warn',
  '@angular-eslint/prefer-on-push-component-change-detection': 'warn',
  '@angular-eslint/prefer-output-readonly': 'warn',
  '@angular-eslint/prefer-signals': 'warn',
  '@angular-eslint/prefer-standalone': 'warn',

  // TypeScript best practices
  '@typescript-eslint/array-type': ['warn'],
  '@typescript-eslint/consistent-indexed-object-style': 'off',
  '@typescript-eslint/consistent-type-assertions': 'warn',
  '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
  '@typescript-eslint/explicit-function-return-type': 'error',
  '@typescript-eslint/explicit-member-accessibility': [
    'error',
    {
      accessibility: 'no-public',
    },
  ],
  '@typescript-eslint/naming-convention': [
    'warn',
    {
      selector: 'variable',
      format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
    },
  ],
  '@typescript-eslint/no-empty-function': 'warn',
  '@typescript-eslint/no-empty-interface': 'error',
  '@typescript-eslint/no-explicit-any': 'warn',
  '@typescript-eslint/no-inferrable-types': 'warn',
  '@typescript-eslint/no-shadow': 'warn',
  '@typescript-eslint/no-unused-vars': 'warn',

  // JavaScript best practices
  eqeqeq: 'error',
  complexity: ['error', 20],
  curly: 'error',
  'guard-for-in': 'error',
  'max-classes-per-file': ['error', 1],
  'max-len': [
    'warn',
    {
      code: 120,
      comments: 160,
    },
  ],
  'no-bitwise': 'error',
  'no-console': 'off',
  'no-new-wrappers': 'error',
  'no-useless-concat': 'error',
  'no-var': 'error',
  'no-restricted-syntax': 'off',
  'no-shadow': 'error',
  'one-var': ['error', 'never'],
  'prefer-arrow-callback': 'error',
  'prefer-const': 'error',
  /** Matches Cursor rules: separate control flow from declarations/actions; blank before `return` when something precedes it; sibling `if`/`switch`. */
  'padding-line-between-statements': [
    'error',
    { blankLine: 'always', prev: '*', next: 'return' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'if' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'switch' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'for' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'while' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'do' },
    { blankLine: 'always', prev: ['const', 'let', 'var'], next: 'try' },
    { blankLine: 'always', prev: 'expression', next: 'if' },
    { blankLine: 'always', prev: 'expression', next: 'switch' },
    { blankLine: 'always', prev: 'expression', next: 'for' },
    { blankLine: 'always', prev: 'expression', next: 'while' },
    { blankLine: 'always', prev: 'expression', next: 'do' },
    { blankLine: 'always', prev: 'expression', next: 'try' },
    { blankLine: 'always', prev: 'if', next: 'if' },
    { blankLine: 'always', prev: 'switch', next: 'switch' },
  ],
  'sort-imports': [
    'error',
    {
      ignoreCase: true,
      ignoreDeclarationSort: true,
      allowSeparatedGroups: true,
    },
  ],

  // Security
  'no-eval': 'error',
  'no-implied-eval': 'error',
};

/** @type {Record<string, import('eslint').Linter.RuleEntry>} */
const tsLintRulesWithMaxLines = {
  ...tsLintRulesBase,
  'max-lines': ['error', 1000],
};

module.exports = tseslint.config(
  {
    ignores: [
      '.angular/**',
      '.nx/**',
      'coverage/**',
      'dist/**',
      '**/*.spec.ts',
      '**/*.stories.ts',
      '**/*.stories.tsx',
    ],
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintPluginPrettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: tsLintRulesWithMaxLines,
  },
  {
    ignores: ['.angular/**', '.nx/**', 'coverage/**', 'dist/**'],
    files: ['**/*.spec.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintPluginPrettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      ...tsLintRulesBase,
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended, ...angular.configs.templateAccessibility],
    rules: {
      // Angular template best practices
      '@angular-eslint/template/attributes-order': [
        'error',
        {
          alphabetical: true,
          order: [
            'STRUCTURAL_DIRECTIVE', // deprecated, use @if and @for instead
            'TEMPLATE_REFERENCE', // e.g. `<input #inputRef>`
            'ATTRIBUTE_BINDING', // e.g. `<input required>`, `id="3"`
            'INPUT_BINDING', // e.g. `[id]="3"`, `[attr.colspan]="colspan"`,
            'TWO_WAY_BINDING', // e.g. `[(id)]="id"`,
            'OUTPUT_BINDING', // e.g. `(idChange)="handleChange()"`,
          ],
        },
      ],
      '@angular-eslint/template/button-has-type': 'warn',
      '@angular-eslint/template/cyclomatic-complexity': ['warn', { maxComplexity: 20 }],
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/prefer-control-flow': 'error',
      '@angular-eslint/template/use-track-by-function': 'warn',
    },
  },
  {
    files: ['**/*.stories.ts', '**/*.stories.tsx'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
      eslintPluginPrettierRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: {
      storybook,
    },
    rules: {
      'storybook/default-exports': 'error',
    },
  },
);
