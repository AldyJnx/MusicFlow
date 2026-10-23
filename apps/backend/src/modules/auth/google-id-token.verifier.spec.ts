import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import {
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  LoginTicket,
  OAuth2Client,
  VerifyIdTokenOptions,
} from "google-auth-library";

import { GoogleIdTokenVerifier } from "./google-id-token.verifier";

const WEB_CLIENT_ID = "556003945292-web.apps.googleusercontent.com";

describe("GoogleIdTokenVerifier", () => {
  let verifier: GoogleIdTokenVerifier;
  let config: { get: jest.Mock };
  let verifyIdToken: jest.SpyInstance<
    Promise<LoginTicket>,
    [VerifyIdTokenOptions]
  >;

  const buildTicket = (payload: Record<string, unknown>) =>
    ({ getPayload: () => payload }) as unknown as LoginTicket;

  beforeEach(async () => {
    config = { get: jest.fn(() => undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleIdTokenVerifier,
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    verifier = module.get(GoogleIdTokenVerifier);
    // verifyIdToken is overloaded; the spy must target the promise signature.
    verifyIdToken = jest.spyOn(
      OAuth2Client.prototype,
      "verifyIdToken",
    ) as unknown as jest.SpyInstance<
      Promise<LoginTicket>,
      [VerifyIdTokenOptions]
    >;
    verifyIdToken.mockResolvedValue(buildTicket({}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("stays disabled when no audience is configured", async () => {
    expect(verifier.isEnabled()).toBe(false);
    await expect(verifier.verify("a.b.c")).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("forwards the allow-list as the accepted audience", async () => {
    config.get.mockReturnValue(
      ` ${WEB_CLIENT_ID} , second.apps.googleusercontent.com `,
    );
    verifyIdToken.mockResolvedValue(
      buildTicket({ email: "a@b.com", email_verified: true }),
    );

    await verifier.verify("a.b.c");

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: "a.b.c",
      audience: [WEB_CLIENT_ID, "second.apps.googleusercontent.com"],
    });
  });

  it("normalises the email to lower case", async () => {
    config.get.mockReturnValue(WEB_CLIENT_ID);
    verifyIdToken.mockResolvedValue(
      buildTicket({
        email: "  Music@Google.com ",
        email_verified: true,
        name: " Music ",
        picture: "https://lh3.googleusercontent.com/p",
      }),
    );

    await expect(verifier.verify("a.b.c")).resolves.toEqual({
      email: "music@google.com",
      displayName: "Music",
      avatar: "https://lh3.googleusercontent.com/p",
    });
  });

  it("rejects an unverified Google email", async () => {
    config.get.mockReturnValue(WEB_CLIENT_ID);
    verifyIdToken.mockResolvedValue(
      buildTicket({ email: "a@b.com", email_verified: false }),
    );

    await expect(verifier.verify("a.b.c")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("rejects a token without an email claim", async () => {
    config.get.mockReturnValue(WEB_CLIENT_ID);
    verifyIdToken.mockResolvedValue(buildTicket({ email_verified: true }));

    await expect(verifier.verify("a.b.c")).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("hides provider internals behind a generic error", async () => {
    config.get.mockReturnValue(WEB_CLIENT_ID);
    verifyIdToken.mockRejectedValue(
      new Error("Invalid token signature: kid=abc123 jwks_uri=https://..."),
    );

    await expect(verifier.verify("a.b.c")).rejects.toThrow(
      "Invalid Google ID token",
    );
    await expect(verifier.verify("a.b.c")).rejects.not.toThrow(/kid=abc123/);
  });

  it("never writes the token or the provider message to the log", async () => {
    const warn = jest.spyOn(Logger.prototype, "warn").mockImplementation();
    config.get.mockReturnValue(WEB_CLIENT_ID);
    // google-auth-library reports malformed tokens by echoing them verbatim.
    verifyIdToken.mockRejectedValue(
      new Error("Wrong number of segments in token: secret-id-token-value"),
    );

    await expect(verifier.verify("secret-id-token-value")).rejects.toThrow(
      "Invalid Google ID token",
    );

    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).not.toContain("secret-id-token-value");
    expect(logged).not.toContain("Wrong number of segments");
    expect(logged).toContain("fingerprint=");
  });
});
