import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";

export interface GoogleIdentity {
  email: string;
  displayName: string | null;
  avatar: string | null;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    const clientID = config.get<string>("GOOGLE_CLIENT_ID")?.trim() ?? "";
    const clientSecret =
      config.get<string>("GOOGLE_CLIENT_SECRET")?.trim() ?? "";
    const callbackURL =
      config.get<string>("GOOGLE_CALLBACK_URL")?.trim() ??
      "http://localhost:8000/api/auth/google/callback";

    // Passport constructs strategies during bootstrap. Placeholder values keep
    // password login available until OAuth credentials are configured; the
    // guard rejects OAuth requests while disabled.
    super({
      clientID: clientID || "oauth-disabled-client-id",
      clientSecret: clientSecret || "oauth-disabled-client-secret",
      callbackURL,
      scope: ["email", "profile"],
    });
    this.enabled = Boolean(clientID && clientSecret);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile) {
    const email = profile.emails?.find((entry) => entry.value)?.value;
    const emailVerified = profile._json?.email_verified !== false;

    if (!email || !emailVerified) {
      throw new UnauthorizedException(
        "Google account must provide a verified email address",
      );
    }

    return {
      email: email.trim().toLowerCase(),
      displayName: profile.displayName?.trim() || null,
      avatar: profile.photos?.[0]?.value ?? null,
    } satisfies GoogleIdentity;
  }
}
