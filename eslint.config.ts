import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import stylistic from '@stylistic/eslint-plugin';

export default defineConfig([
    { files: ['**/*.{js,mjs,cjs,ts,mts,cts}'], plugins: { js }, extends: ['js/recommended'], languageOptions: { globals: {...globals.browser, ...globals.node} } },
    tseslint.configs.recommended,
    eslintConfigPrettier,

    {
        rules: {
            '@stylistic/indent': ['error', 4],
            'semi': 'error',
            'comma-dangle': ['error', 'always-multiline'],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
        },
        plugins: {
            '@stylistic': stylistic,
        },
    },
]);
