import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
// In Stripe v22 the CJS entry exports `StripeConstructor` (a callable
// thing that doubles as the class), while the type namespace lives on the
// `Stripe` class re-exported from stripe.core. Importing the constructor
// for runtime and the namespaced types separately keeps both happy.
import StripeSDK = require("stripe");
import type { Stripe as StripeTypes } from "stripe/cjs/stripe.core.js";
import { PrismaService } from "@/prisma/prisma.service";

type StripeClient = StripeTypes;
type StripeEvent = StripeTypes.Event;
type StripeCheckoutSession = StripeTypes.Checkout.Session;
type StripeSubscription = StripeTypes.Subscription;

/**
 * Thin wrapper around the Stripe SDK so the rest of the codebase doesn't
 * need to know about Stripe primitives. The service holds a single SDK
 * instance, lazily instantiated on first use; if STRIPE_SECRET_KEY isn't
 * set the methods throw 503 so the rest of the app keeps booting in
 * environments without billing configured (CI, local).
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: StripeClient | null;
  private readonly priceId: string;
  private readonly successUrl: string;
  private readonly cancelUrl: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>("STRIPE_SECRET_KEY");
    this.priceId = this.config.get<string>("STRIPE_PRICE_ID", "");
    this.successUrl = this.config.get<string>(
      "STRIPE_SUCCESS_URL",
      "http://localhost:5173/settings/billing?status=success",
    );
    this.cancelUrl = this.config.get<string>(
      "STRIPE_CANCEL_URL",
      "http://localhost:5173/settings/billing?status=cancelled",
    );
    this.webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET", "");
    if (apiKey) {
      this.stripe = new StripeSDK(apiKey);
    } else {
      this.stripe = null;
      this.logger.warn(
        "STRIPE_SECRET_KEY not set — billing endpoints will return 503.",
      );
    }
  }

  /**
   * Create a Stripe Checkout session for the premium upgrade. The userId is
   * tucked into both `client_reference_id` (so the webhook can flip the
   * flag) and `metadata.userId` (for support diagnostics).
   */
  async createCheckoutSession(userId: string): Promise<{ url: string }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        "Stripe is not configured on this server.",
      );
    }
    if (!this.priceId) {
      throw new InternalServerErrorException(
        "STRIPE_PRICE_ID is not configured.",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isPremium: true,
        stripeCustomerId: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: this.priceId, quantity: 1 }],
      success_url: this.successUrl,
      cancel_url: this.cancelUrl,
      client_reference_id: user.id,
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      metadata: { userId: user.id },
    });

    if (!session.url) {
      throw new InternalServerErrorException(
        "Stripe did not return a checkout URL",
      );
    }
    return { url: session.url };
  }

  /**
   * Parse a webhook payload and apply the side effects. Returns the event
   * id so the controller can log it. Signature verification uses the raw
   * request body — the controller MUST pass the unparsed Buffer.
   */
  async handleWebhook(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{ received: true; id: string; type: string }> {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        "Stripe is not configured on this server.",
      );
    }
    if (!this.webhookSecret || !signature) {
      throw new InternalServerErrorException(
        "STRIPE_WEBHOOK_SECRET or signature missing",
      );
    }

    let event: StripeEvent;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Invalid Stripe signature: ${(err as Error).message}`);
      throw new InternalServerErrorException("Invalid Stripe signature");
    }

    switch (event.type) {
      case "checkout.session.completed":
        await this.onCheckoutCompleted(
          event.data.object as StripeCheckoutSession,
        );
        break;
      case "customer.subscription.deleted":
        await this.onSubscriptionEnded(event.data.object as StripeSubscription);
        break;
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    return { received: true, id: event.id, type: event.type };
  }

  private async onCheckoutCompleted(session: StripeCheckoutSession) {
    const userId =
      session.client_reference_id ??
      (session.metadata?.userId as string | undefined);
    if (!userId) {
      this.logger.warn(
        `checkout.session.completed without userId (session ${session.id})`,
      );
      return;
    }
    const customerId =
      typeof session.customer === "string" ? session.customer : undefined;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
      },
    });
    this.logger.log(`User ${userId} upgraded to premium via Stripe`);
  }

  private async onSubscriptionEnded(sub: StripeSubscription) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    if (!customerId) return;
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: customerId },
      select: { id: true },
    });
    if (!user) return;
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isPremium: false },
    });
    this.logger.log(`User ${user.id} downgraded — subscription ended`);
  }
}
