/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['../config/eslint/base.js', 'plugin:react-hooks/recommended'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
  },
};
