// Mirror of packages/shared/src/constants — kept here to avoid wiring the
// workspace package into the backend's ts-jest/nest path resolution. If you
// change these, update packages/shared/src/constants/index.ts too.

export const FREE_LIMITS = {
  uploadsTotal: 50,
  aiRequestsPerMonth: 10,
  customPresets: 5,
} as const;

export const PREMIUM_LIMITS = {
  aiRequestsPerMonth: 200,
} as const;
