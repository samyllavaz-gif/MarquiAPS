import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'assets/', 'js/dados/'] },
  js.configs.recommended,
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Inicializações defensivas (let x = '') herdadas do código original: estilo, não erro.
      'no-useless-assignment': 'off',
      // Nada de registros no console com dados clínicos: só erros técnicos são permitidos.
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    files: ['tests/**/*.js', 'scripts/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node, ...globals.browser } },
  },
];
