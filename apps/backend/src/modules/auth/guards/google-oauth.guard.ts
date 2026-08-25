import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { randomBytes, timingSafeEqual } from "crypto";
import type { Request, Response } from "express";
import { GoogleStrategy } from "../strategies/google.strategy";

const STATE_COOKIE = "musicflow_google_oauth_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.cookie;
  if (!raw) return null;
  const prefix = `${name}=`;
  for (const item of raw.split(";")) {
    const value = item.trim();
    if (value.startsWith(prefix))
      return decodeURIComponent(value.slice(prefix.length));
  }
  return null;
}

function statesMatch(expected: string | null, actual: unknown): boolean {
  if (!expected || typeof actual !== "string") return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

abstract class GoogleGuardBase extends AuthGuard("google") {
  constructor(protected readonly strategy: GoogleStrategy) {
    super();
  }

  protected assertEnabled(): void {
    if (!this.strategy.isEnabled()) {
      throw new ServiceUnavailableException("Google OAuth is not configured");
    }
  }
}

@Injectable()
export class GoogleOAuthStartGuard
  extends GoogleGuardBase
  implements CanActivate
{
  constructor(strategy: GoogleStrategy) {
    super(strategy);
  }

  canActivate(context: ExecutionContext) {
    this.assertEnabled();
    const request = context.switchToHttp().getRequest<Request>() as Request & {
      googleOAuthState?: string;
    };
    const response = context.switchToHttp().getResponse<Response>();
    const state = randomBytes(32).toString("base64url");
    request.googleOAuthState = state;
    response.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: STATE_TTL_MS,
      path: "/api/auth/google",
    });
    return super.canActivate(context);
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>() as Request & {
      googleOAuthState?: string;
    };
    return {
      scope: ["email", "profile"],
      state: request.googleOAuthState,
    };
  }
}

@Injectable()
export class GoogleOAuthCallbackGuard
  extends GoogleGuardBase
  implements CanActivate
{
  constructor(strategy: GoogleStrategy) {
    super(strategy);
  }

  canActivate(context: ExecutionContext) {
    this.assertEnabled();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const state = readCookie(request, STATE_COOKIE);
    response.clearCookie(STATE_COOKIE, { path: "/api/auth/google" });

    if (!statesMatch(state, request.query.state)) {
      throw new UnauthorizedException("Invalid Google OAuth state");
    }
    return super.canActivate(context);
  }
}
