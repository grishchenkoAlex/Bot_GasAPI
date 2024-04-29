module.exports = {
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    globals: {
      process: 'readonly',
    },
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-extra-semi': 'error',
  },
}
