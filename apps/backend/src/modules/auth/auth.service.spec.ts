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

describe("AuthService", () => {
  let service: AuthService;
  let prisma: { user: Record<string, jest.Mock> };
  let mail: { sendPasswordReset: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    mail = { sendPasswordReset: jest.fn() };

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
});
