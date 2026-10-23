import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";

import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { PrismaService } from "@/prisma/prisma.service";
import { MailService } from "@/modules/mail/mail.service";
import { GoogleIdTokenVerifier } from "./google-id-token.verifier";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: {
    user: Record<string, jest.Mock>;
    oAuthLoginTicket: Record<string, jest.Mock>;
    $transaction: jest.Mock;
  };
  let mail: { sendPasswordReset: jest.Mock };
  let googleIdTokenVerifier: { verify: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      oAuthLoginTicket: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof prisma) => unknown) =>
        callback(prisma),
    );
    // login() stamps lastLogin via a fire-and-forget update(...).catch(...),
    // so the mock must return a thenable by default or .catch() throws.
    prisma.user.update.mockResolvedValue({});
    mail = { sendPasswordReset: jest.fn() };
    googleIdTokenVerifier = { verify: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(() => "fake-jwt"),
            verify: jest.fn(() => ({
              sub: "u1",
              email: "x@y.com",
              role: "CLIENT",
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(() => "secret") },
        },
        { provide: MailService, useValue: mail },
        { provide: GoogleIdTokenVerifier, useValue: googleIdTokenVerifier },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe("register", () => {
    it("creates user when email and username are free", async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        username: "alice",
        role: "CLIENT",
        isPremium: false,
        avatar: null,
      });

      const result = await service.register({
        email: "a@b.com",
        username: "alice",
        password: "Pass1234!",
      } as RegisterDto);

      expect(result.user.email).toBe("a@b.com");
      expect(result.accessToken).toBe("fake-jwt");
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it("throws Conflict when email is taken", async () => {
      prisma.user.findFirst.mockResolvedValue({
        email: "a@b.com",
        username: "other",
      });

      await expect(
        service.register({
          email: "a@b.com",
          username: "alice",
          password: "x",
        } as RegisterDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("login", () => {
    it("returns tokens on valid credentials", async () => {
      const hash = await bcrypt.hash("Pass1234!", 4);
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        username: "alice",
        password: hash,
        role: "CLIENT",
        isPremium: false,
        avatar: null,
        isActive: true,
      });

      const result = await service.login({
        email: "a@b.com",
        password: "Pass1234!",
      } as LoginDto);
      expect(result.accessToken).toBe("fake-jwt");
    });

    it("throws Unauthorized on wrong password", async () => {
      const hash = await bcrypt.hash("right", 4);
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        password: hash,
        isActive: true,
      });

      await expect(
        service.login({ email: "a@b.com", password: "wrong" } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("throws Unauthorized when account is deactivated", async () => {
      const hash = await bcrypt.hash("Pass1234!", 4);
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        password: hash,
        isActive: false,
      });

      await expect(
        service.login({ email: "a@b.com", password: "Pass1234!" } as LoginDto),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe("forgotPassword", () => {
    it("sends mail when user exists", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "a@b.com",
        isActive: true,
      });
      prisma.user.update.mockResolvedValue({});

      await service.forgotPassword("a@b.com");

      expect(mail.sendPasswordReset).toHaveBeenCalledWith(
        "a@b.com",
        expect.any(String),
      );
    });

    it("does not send mail when user does not exist (no enumeration leak)", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await service.forgotPassword("nobody@x.com");
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe("Google OAuth tickets", () => {
    const googleUser = {
      id: "google-user",
      email: "music@google.com",
      username: "music",
      password: "not-used",
      role: "CLIENT",
      isPremium: false,
      avatar: null,
      isActive: true,
      onboardingCompletedAt: null,
    };

    it("creates a short-lived ticket for an existing verified Google user", async () => {
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.user.update.mockResolvedValue(googleUser);
      prisma.oAuthLoginTicket.create.mockResolvedValue({});

      const ticket = await service.createGoogleLoginTicket({
        email: googleUser.email,
        displayName: "Music",
        avatar: null,
      });

      expect(ticket).toEqual(expect.any(String));
      expect(prisma.oAuthLoginTicket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: googleUser.id }),
        }),
      );
    });

    it("restores the Google photo when a legacy account stored an empty avatar", async () => {
      prisma.user.findUnique.mockResolvedValue({ ...googleUser, avatar: "" });
      prisma.user.update.mockResolvedValue(googleUser);
      prisma.oAuthLoginTicket.create.mockResolvedValue({});

      await service.createGoogleLoginTicket({
        email: googleUser.email,
        displayName: "Music",
        avatar: "https://lh3.googleusercontent.com/photo",
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            avatar: "https://lh3.googleusercontent.com/photo",
          }),
        }),
      );
    });

    it("exchanges a valid ticket once for the standard JWT session", async () => {
      prisma.oAuthLoginTicket.findUnique.mockResolvedValue({
        id: "valid-ticket",
        consumedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: googleUser,
      });
      prisma.oAuthLoginTicket.updateMany.mockResolvedValue({ count: 1 });

      const session = await service.exchangeGoogleLoginTicket("valid-ticket");

      expect(session.user.email).toBe(googleUser.email);
      expect(session.accessToken).toBe("fake-jwt");
      expect(prisma.oAuthLoginTicket.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ consumedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe("Google mobile ID token sign-in", () => {
    const googleUser = {
      id: "google-user",
      email: "music@google.com",
      username: "music",
      password: "not-used",
      role: "CLIENT",
      isPremium: false,
      avatar: "https://lh3.googleusercontent.com/photo",
      isActive: true,
      onboardingCompletedAt: null,
    };

    it("exchanges a verified ID token for the standard JWT session", async () => {
      googleIdTokenVerifier.verify.mockResolvedValue({
        email: googleUser.email,
        displayName: "Music",
        avatar: googleUser.avatar,
      });
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.user.update.mockResolvedValue(googleUser);

      const session = await service.signInWithGoogleIdToken("a.b.c");

      expect(googleIdTokenVerifier.verify).toHaveBeenCalledWith("a.b.c");
      expect(session.user.email).toBe(googleUser.email);
      expect(session.accessToken).toBe("fake-jwt");
    });

    it("never touches the database when the token is rejected", async () => {
      googleIdTokenVerifier.verify.mockRejectedValue(
        new UnauthorizedException("Invalid Google ID token"),
      );

      await expect(service.signInWithGoogleIdToken("bad")).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("does not consume a one-time ticket, because none is involved", async () => {
      googleIdTokenVerifier.verify.mockResolvedValue({
        email: googleUser.email,
        displayName: "Music",
        avatar: googleUser.avatar,
      });
      prisma.user.findUnique.mockResolvedValue(googleUser);
      prisma.user.update.mockResolvedValue(googleUser);

      await service.signInWithGoogleIdToken("a.b.c");

      expect(prisma.oAuthLoginTicket.create).not.toHaveBeenCalled();
    });
  });
});
