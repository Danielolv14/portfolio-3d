// Regras de lint do projeto. Formatação fica com o Prettier (eslint-config-prettier desliga o que conflita).
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
    { ignores: ['dist', 'capturas', 'docs/historico', 'node_modules', 'public/draco', 'public/room-poc', 'pipeline/.cache'] },
    js.configs.recommended,
    {
        files: ['**/*.{js,jsx,mjs}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser },
            parserOptions: { ecmaFeatures: { jsx: true } }
        },
        settings: { react: { version: 'detect' } },
        plugins: { react, 'react-hooks': reactHooks },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            // As props do React Three Fiber (args, position, intensity...) não são atributos HTML
            'react/no-unknown-property': 'off',
            // O projeto não usa PropTypes
            'react/prop-types': 'off',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
        }
    },
    // Scripts de Node (capturas, medições, config do Vite)
    {
        files: ['scripts/**/*.mjs', 'pipeline/**/*.mjs', '*.config.js'],
        languageOptions: { globals: { ...globals.node } }
    },
    prettier
];
