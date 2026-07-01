/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  overrides: [
    {
      // Tests legitimately need dynamic require() for module mocking and often
      // destructure helpers uniformly even when a given case uses a subset.
      files: ['*.spec.ts', '*.e2e-spec.ts', '**/__tests__/**'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
    {
      // One-off CLI scripts (seeds, backfills) — console IS their output.
      files: ['scripts/**', 'prisma/seed.ts'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
