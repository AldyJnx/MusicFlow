import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as request from "supertest";
import * as bcrypt from "bcryptjs";

import { AuthModule } from "@/modules/auth/auth.module";
import { PrismaService } from "@/prisma/prisma.service";
import { PrismaModule } from "@/prisma/prisma.module";
import { MailModule } from "@/modules/mail/mail.module";
import { StorageModule } from "@/modules/storage/storage.module";

/**
 * E2E smoke tests for /api/auth — uses an in-memory mock of PrismaService.
 * For full integration coverage, run against a dedicated test database.
 */
interface MockUser {
  id: string;
  email: string;
  username?: string;
  password: string;
  role?: string;
  isPremium?: boolean;
  isActive?: boolean;
  avatar?: string | null;
}

interface WhereArg {
  where: {
    OR?: Array<{ email?: string; username?: string }>;
    email?: string;
    id?: string;
  };
}

interface CreateArg {
  data: { email: string; username: string; password: string };
}

interface UpdateArg {
  where: { id: string };
  data: Record<string, unknown>;
}

describe("Auth (e2e)", () => {
  let app: INestApplication;
  const users = new Map<string, MockUser>();

  const prismaMock = {
    user: {
      findFirst: jest.fn(async ({ where }: WhereArg) => {
        for (const u of users.values()) {
          if (where.OR) {
            if (where.OR.some((cond) => cond.email === u.email || cond.username === u.username)) {
              return u;
            }
          }
        }
        return null;
      }),
      findUnique: jest.fn(async ({ where }: WhereArg) => {
        if (where.email) {
          for (const u of users.values()) if (u.email === where.email) return u;
        }
        if (where.id) return users.get(where.id) ?? null;
        return null;
      }),
      create: jest.fn(async ({ data }: CreateArg) => {
        const id = `u-${users.size + 1}`;
        const created = {
          id,
          email: data.email,
          username: data.username,
          password: data.password,
          role: "CLIENT",
          isPremium: false,
          isActive: true,
          avatar: null,
        };
        users.set(id, created);
        return created;
      }),
      update: jest.fn(async ({ where, data }: UpdateArg) => {
        const user = users.get(where.id);
        if (user) Object.assign(user, data);
        return user;
      }),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        StorageModule,
        MailModule,
        AuthModule,
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    users.clear();
    jest.clearAllMocks();
  });

  it("POST /api/auth/register creates a user and returns tokens", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "new@user.com", username: "newuser", password: "Strong1!" })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe("new@user.com");
  });

  it("POST /api/auth/register rejects duplicate email with 409", async () => {
    users.set("u-1", {
      id: "u-1",
      email: "dupe@user.com",
      username: "existing",
      password: "x",
      role: "CLIENT",
      isPremium: false,
      isActive: true,
      avatar: null,
    });

    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "dupe@user.com", username: "newname", password: "Strong1!" })
      .expect(409);
  });

  it("POST /api/auth/login returns tokens on valid credentials", async () => {
    const hash = await bcrypt.hash("Strong1!", 4);
    users.set("u-1", {
      id: "u-1",
      email: "login@user.com",
      username: "loginuser",
      password: hash,
      role: "CLIENT",
      isPremium: false,
      isActive: true,
      avatar: null,
    });

    const res = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "login@user.com", password: "Strong1!" })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
  });

  it("POST /api/auth/login returns 401 on wrong password", async () => {
    const hash = await bcrypt.hash("right", 4);
    users.set("u-1", {
      id: "u-1",
      email: "x@y.com",
      password: hash,
      isActive: true,
    });

    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ email: "x@y.com", password: "wrong" })
      .expect(401);
  });

  it("POST /api/auth/register validates input (missing fields)", async () => {
    await request(app.getHttpServer())
      .post("/api/auth/register")
      .send({ email: "only-email@x.com" })
      .expect(400);
  });
});
