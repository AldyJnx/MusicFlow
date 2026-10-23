import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { GoogleIdentity } from "./strategies/google.strategy";

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "unknown error";
}

function fingerprint(idToken: string): string {
  return createHash("sha256").update(idToken).digest("hex").slice(0, 8);
}

/**
 * Verifies the Google ID token that native mobile clients obtain through the
 * official "Sign in with Google" SDK.
 *
 * Google issues that token with `aud` set to the *server* client ID — the Web
 * OAuth client of this project — because the mobile app declares it through
 * `serverClientId`. The Android client (package name plus signing SHA) never
 * appears in the token: it only authorises the binary during the native flow.
 * That is why a single audience is shared by the web and mobile clients, and it
 * is what GOOGLE_MOBILE_AUDIENCES allow-lists here.
 *
 * Signature, `iss` and `exp` are validated by google-auth-library against
 * Google's published public keys. Only `aud` depends on local configuration.
 */
@Injectable()
export class GoogleIdTokenVerifier {
  private readonly logger = new Logger(GoogleIdTokenVerifier.name);
  private readonly client = new OAuth2Client();

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return this.readAudiences().length > 0;
  }

  async verify(idToken: string): Promise<GoogleIdentity> {
    const audiences = this.readAudiences();
    if (audiences.length === 0) {
      throw new ServiceUnavailableException("Google sign-in is not configured");
    }

    const payload = await this.readVerifiedPayload(idToken, audiences);

    const email = payload.email?.trim();
    if (!email || payload.email_verified === false) {
      throw new UnauthorizedException(
        "Google account must provide a verified email address",
      );
    }

    return {
      email: email.toLowerCase(),
      displayName: payload.name?.trim() || null,
      avatar: payload.picture ?? null,
    };
  }

  private async readVerifiedPayload(
    idToken: string,
    audiences: string[],
  ): Promise<TokenPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: audiences,
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException("Invalid Google ID token");
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // google-auth-library embeds the raw token in its error messages, so the
      // message is never logged. The fingerprint below is enough to correlate
      // a rejection with a client-side event without exposing the token.
      this.logger.warn(
        `Google ID token rejected (${errorName(error)}): ` +
          `len=${idToken.length} fingerprint=${fingerprint(idToken)}`,
      );
      throw new UnauthorizedException("Invalid Google ID token");
    }
  }

  private readAudiences(): string[] {
    return (this.configService.get<string>("GOOGLE_MOBILE_AUDIENCES") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
}
