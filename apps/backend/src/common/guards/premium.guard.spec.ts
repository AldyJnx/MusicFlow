import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PremiumGuard } from "./premium.guard";

describe("PremiumGuard", () => {
  let guard: PremiumGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PremiumGuard(reflector);
  });

  function makeContext(user: unknown): ExecutionContext {
    return {
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  it("allows when handler does not require premium", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ isPremium: false }))).toBe(true);
  });

  it("allows premium users when handler requires premium", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    expect(guard.canActivate(makeContext({ isPremium: true }))).toBe(true);
  });

  it("forbids non-premium users when handler requires premium", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    expect(() => guard.canActivate(makeContext({ isPremium: false }))).toThrow(
      ForbiddenException,
    );
  });

  it("forbids when user is missing entirely", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it("returns PREMIUM_REQUIRED error code", () => {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(true);
    try {
      guard.canActivate(makeContext({ isPremium: false }));
      fail("expected ForbiddenException");
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      const response = (err as ForbiddenException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe("PREMIUM_REQUIRED");
    }
  });
});
