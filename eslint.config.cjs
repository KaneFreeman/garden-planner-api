const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname
});

module.exports = [
  {
    ignores: [
      'logs/**',
      '*.log',
      'pids/**',
      '*.pid',
      '*.seed',
      'coverage/**',
      '.eslintcache',
      'node_modules/**',
      '.DS_Store',
      'release/app/dist/**',
      'release/build/**',
      '.erb/dll/**',
      '.idea/**',
      'npm-debug.log.*',
      '*.css.d.ts',
      '*.sass.d.ts',
      '*.scss.d.ts',
      '.erb/**',
      'global.d.ts',
      'service.js',
      'eslint.config.cjs',
      'dist/**',
      'dist-prod/**'
    ]
  },
  ...compat.config({
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      sourceType: 'module'
    },
    plugins: ['@typescript-eslint'],
    extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    env: {
      node: true,
      jest: true
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_$',
          varsIgnorePattern: '^_$',
          caughtErrorsIgnorePattern: '^_$'
        }
      ]
    }
  })
];
