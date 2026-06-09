import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";

// Each test variant configures its own Stripe mock before the service is
// imported so we exercise both the "configured" and "missing-key" branches.
// We also re-grab the exception classes from the freshly-loaded
// @nestjs/common so identity checks (instanceof) work against the same
// constructor the service used.
function loadServiceWithMock(stripeMock: unknown) {
  jest.resetModules();
  jest.doMock("stripe", () => stripeMock, { virtual: false });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { StripeService } = require("./stripe.service");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const exceptions = require("@nestjs/common");
  return {
    StripeService,
    InternalServerErrorException: exceptions.InternalServerErrorException,
    NotFoundException: exceptions.NotFoundException,
    ServiceUnavailableException: exceptions.ServiceUnavailableException,
  };
}

interface ConfigOverrides {
  STRIPE_SECRET_KEY?: string;
  STRIPE_PRICE_ID?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_SUCCESS_URL?: string;
  STRIPE_CANCEL_URL?: string;
}

function makeConfig(overrides: ConfigOverrides = {}): ConfigService {
  const map: Record<string, string> = {
    STRIPE_SUCCESS_URL: "https://app/success",
    STRIPE_CANCEL_URL: "https://app/cancel",
    ...overrides,
  };
  return {
    get: jest.fn(
      (key: string, fallback?: string) => map[key] ?? fallback ?? "",
    ),
  } as unknown as ConfigService;
}

function makePrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe("StripeService", () => {
  afterEach(() => {
    jest.dontMock("stripe");
  });

  describe("createCheckoutSession", () => {
    it("returns 503 when STRIPE_SECRET_KEY is unset", async () => {
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock({ default: jest.fn() });
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({}),
        prisma as unknown as PrismaService,
      );
      await expect(service.createCheckoutSession("u1")).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it("returns 500 when STRIPE_PRICE_ID is unset", async () => {
      const fakeStripeCtor = jest.fn(() => ({}));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(fakeStripeCtor);
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({ STRIPE_SECRET_KEY: "sk_test" }),
        prisma as unknown as PrismaService,
      );
      await expect(service.createCheckoutSession("u1")).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it("404s when the user cannot be found", async () => {
      const fakeStripeCtor = jest.fn(() => ({
        checkout: { sessions: { create: jest.fn() } },
      }));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(fakeStripeCtor);
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue(null);
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_PRICE_ID: "price_123",
        }),
        prisma as unknown as PrismaService,
      );
      await expect(
        service.createCheckoutSession("ghost"),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("creates a session with client_reference_id + customer_email when no Stripe customer yet", async () => {
      const create = jest
        .fn()
        .mockResolvedValue({ id: "cs_1", url: "https://stripe/checkout" });
      const fakeStripeCtor = jest.fn(() => ({
        checkout: { sessions: { create } },
      }));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(fakeStripeCtor);
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "u1@example.com",
        isPremium: false,
        stripeCustomerId: null,
      });
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_PRICE_ID: "price_123",
        }),
        prisma as unknown as PrismaService,
      );
      const result = await service.createCheckoutSession("u1");
      expect(result).toEqual({ url: "https://stripe/checkout" });
      expect(create).toHaveBeenCalledTimes(1);
      const args = create.mock.calls[0][0];
      expect(args.client_reference_id).toBe("u1");
      expect(args.metadata.userId).toBe("u1");
      expect(args.customer).toBeUndefined();
      expect(args.customer_email).toBe("u1@example.com");
      expect(args.line_items).toEqual([{ price: "price_123", quantity: 1 }]);
    });

    it("reuses an existing Stripe customer id and skips customer_email", async () => {
      const create = jest
        .fn()
        .mockResolvedValue({ id: "cs_2", url: "https://stripe/2" });
      const fakeStripeCtor = jest.fn(() => ({
        checkout: { sessions: { create } },
      }));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(fakeStripeCtor);
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({
        id: "u2",
        email: "u2@example.com",
        isPremium: false,
        stripeCustomerId: "cus_999",
      });
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_PRICE_ID: "price_123",
        }),
        prisma as unknown as PrismaService,
      );
      await service.createCheckoutSession("u2");
      const args = create.mock.calls[0][0];
      expect(args.customer).toBe("cus_999");
      expect(args.customer_email).toBeUndefined();
    });

    it("throws when Stripe returns a session without a URL", async () => {
      const create = jest.fn().mockResolvedValue({ id: "cs_x", url: null });
      const fakeStripeCtor = jest.fn(() => ({
        checkout: { sessions: { create } },
      }));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(fakeStripeCtor);
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({
        id: "u1",
        email: "u1@example.com",
        isPremium: false,
        stripeCustomerId: null,
      });
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_PRICE_ID: "price_123",
        }),
        prisma as unknown as PrismaService,
      );
      await expect(service.createCheckoutSession("u1")).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });
  });

  describe("handleWebhook", () => {
    function makeStripeWithWebhook(constructEventImpl: jest.Mock) {
      const stripeCtor = jest.fn(() => ({
        webhooks: { constructEvent: constructEventImpl },
      }));
      return stripeCtor;
    }

    it("returns 503 when Stripe SDK is not configured", async () => {
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock({ default: jest.fn() });
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({}),
        prisma as unknown as PrismaService,
      );
      await expect(
        service.handleWebhook(Buffer.from("{}"), "sig"),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it("throws when STRIPE_WEBHOOK_SECRET is missing", async () => {
      const ctor = makeStripeWithWebhook(jest.fn());
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({ STRIPE_SECRET_KEY: "sk_test" }),
        prisma as unknown as PrismaService,
      );
      await expect(
        service.handleWebhook(Buffer.from("{}"), "sig"),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it("throws when the signature is missing", async () => {
      const ctor = makeStripeWithWebhook(jest.fn());
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      await expect(
        service.handleWebhook(Buffer.from("{}"), undefined),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });

    it("translates a bad signature into 500 without leaking the Stripe error", async () => {
      const constructEvent = jest.fn(() => {
        throw new Error("signature mismatch");
      });
      const ctor = makeStripeWithWebhook(constructEvent);
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      try {
        await service.handleWebhook(Buffer.from("{}"), "bad");
        fail("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(InternalServerErrorException);
        // Generic message — should NOT echo the underlying SDK error.
        expect((err as Error).message).toBe("Invalid Stripe signature");
      }
    });

    it("on checkout.session.completed: flips isPremium=true and saves stripeCustomerId", async () => {
      const event = {
        id: "evt_1",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_1",
            client_reference_id: "u1",
            customer: "cus_abc",
            metadata: {},
          },
        },
      };
      const ctor = makeStripeWithWebhook(jest.fn(() => event));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      prisma.user.update.mockResolvedValue({ id: "u1" });
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      const result = await service.handleWebhook(Buffer.from("{}"), "sig");
      expect(result).toEqual({
        received: true,
        id: "evt_1",
        type: "checkout.session.completed",
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { isPremium: true, stripeCustomerId: "cus_abc" },
      });
    });

    it("falls back to metadata.userId when client_reference_id is empty", async () => {
      const event = {
        id: "evt_2",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_2",
            client_reference_id: null,
            customer: null,
            metadata: { userId: "u9" },
          },
        },
      };
      const ctor = makeStripeWithWebhook(jest.fn(() => event));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      prisma.user.update.mockResolvedValue({ id: "u9" });
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      await service.handleWebhook(Buffer.from("{}"), "sig");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u9" },
        data: { isPremium: true },
      });
    });

    it("silently skips checkout.session.completed when no userId is attached", async () => {
      const event = {
        id: "evt_3",
        type: "checkout.session.completed",
        data: {
          object: { id: "cs_3", client_reference_id: null, metadata: {} },
        },
      };
      const ctor = makeStripeWithWebhook(jest.fn(() => event));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      const result = await service.handleWebhook(Buffer.from("{}"), "sig");
      expect(result.received).toBe(true);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("on customer.subscription.deleted: flips isPremium=false for the matched customer", async () => {
      const event = {
        id: "evt_4",
        type: "customer.subscription.deleted",
        data: { object: { customer: "cus_xyz" } },
      };
      const ctor = makeStripeWithWebhook(jest.fn(() => event));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue({ id: "u5" });
      prisma.user.update.mockResolvedValue({ id: "u5" });
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      await service.handleWebhook(Buffer.from("{}"), "sig");
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_xyz" },
        select: { id: true },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "u5" },
        data: { isPremium: false },
      });
    });

    it("subscription.deleted: no-op when no user matches the customer", async () => {
      const event = {
        id: "evt_5",
        type: "customer.subscription.deleted",
        data: { object: { customer: "cus_unknown" } },
      };
      const ctor = makeStripeWithWebhook(jest.fn(() => event));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      prisma.user.findUnique.mockResolvedValue(null);
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      const result = await service.handleWebhook(Buffer.from("{}"), "sig");
      expect(result.received).toBe(true);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("unknown event types are acknowledged without side effects", async () => {
      const event = {
        id: "evt_6",
        type: "invoice.paid",
        data: { object: {} },
      };
      const ctor = makeStripeWithWebhook(jest.fn(() => event));
      const {
        StripeService,
        InternalServerErrorException,
        NotFoundException,
        ServiceUnavailableException,
      } = loadServiceWithMock(ctor);
      const prisma = makePrisma();
      const service = new StripeService(
        makeConfig({
          STRIPE_SECRET_KEY: "sk_test",
          STRIPE_WEBHOOK_SECRET: "whsec",
        }),
        prisma as unknown as PrismaService,
      );
      const result = await service.handleWebhook(Buffer.from("{}"), "sig");
      expect(result).toEqual({
        received: true,
        id: "evt_6",
        type: "invoice.paid",
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
