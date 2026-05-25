import { join } from "path";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";

import { MailService } from "./mail.service";

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.get<string>("SMTP_HOST");
        // No SMTP configured: use jsonTransport so MailService can decide to
        // log instead of actually sending. MailService also checks SMTP_HOST.
        if (!host) {
          return {
            transport: { jsonTransport: true },
            defaults: {
              from:
                config.get<string>("MAIL_FROM") ?? "no-reply@musicflow.local",
            },
            template: {
              dir: join(__dirname, "templates"),
              adapter: new HandlebarsAdapter(),
              options: { strict: true },
            },
          };
        }
        return {
          transport: {
            host,
            port: Number(config.get<string>("SMTP_PORT") ?? 587),
            secure: config.get<string>("SMTP_SECURE") === "true",
            auth: {
              user: config.get<string>("SMTP_USER"),
              pass: config.get<string>("SMTP_PASS"),
            },
          },
          defaults: {
            from: config.get<string>("MAIL_FROM") ?? "no-reply@musicflow.local",
          },
          template: {
            dir: join(__dirname, "templates"),
            adapter: new HandlebarsAdapter(),
            options: { strict: true },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
