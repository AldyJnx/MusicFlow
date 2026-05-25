import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Send password reset email. In dev (no SMTP_HOST), logs the link instead.
   */
  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:5173";
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    if (!this.config.get<string>("SMTP_HOST")) {
      this.logger.warn(`[DEV] Password reset for ${to} — open: ${resetUrl}`);
      return;
    }

    await this.mailer.sendMail({
      to,
      subject: "Restablece tu contraseña — MusicFlow",
      template: "password-reset",
      context: { resetUrl, year: new Date().getFullYear() },
    });
  }

  /**
   * Send email verification. In dev (no SMTP_HOST), logs the link instead.
   */
  async sendVerifyEmail(to: string, verifyToken: string): Promise<void> {
    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:5173";
    const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;

    if (!this.config.get<string>("SMTP_HOST")) {
      this.logger.warn(
        `[DEV] Email verification for ${to} — open: ${verifyUrl}`,
      );
      return;
    }

    await this.mailer.sendMail({
      to,
      subject: "Verifica tu cuenta — MusicFlow",
      template: "verify-email",
      context: { verifyUrl, year: new Date().getFullYear() },
    });
  }
}
