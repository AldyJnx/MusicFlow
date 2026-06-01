/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ['../config/eslint/base.js'],
  env: {
    browser: true,
    node: true,
  },
};
