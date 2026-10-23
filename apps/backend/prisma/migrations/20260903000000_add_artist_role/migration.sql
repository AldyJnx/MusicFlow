-- The web client already supports an ARTIST workspace. Add the matching
-- database role so role assignment and JWT authorization remain consistent.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ARTIST';
