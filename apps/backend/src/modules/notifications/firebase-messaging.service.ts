import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

@Injectable()
export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    const rawCredentials = config.get<string>("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!rawCredentials) {
      this.enabled = false;
      this.logger.warn(
        "FCM disabled: FIREBASE_SERVICE_ACCOUNT_JSON is not configured",
      );
      return;
    }

    try {
      const credentials = JSON.parse(rawCredentials) as {
        project_id: string;
        client_email: string;
        private_key: string;
      };
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId: credentials.project_id,
            clientEmail: credentials.client_email,
            privateKey: credentials.private_key.replace(/\\n/g, "\n"),
          }),
        });
      }
      this.enabled = true;
    } catch (error) {
      this.enabled = false;
      this.logger.error(
        `FCM disabled: invalid service account JSON (${(error as Error).message})`,
      );
    }
  }

  async sendToTokens(input: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<{ successCount: number; invalidTokens: string[] }> {
    if (!this.enabled || input.tokens.length === 0) {
      return { successCount: 0, invalidTokens: [] };
    }

    const response = await getMessaging().sendEachForMulticast({
      tokens: input.tokens,
      notification: { title: input.title, body: input.body },
      data: input.data,
      android: {
        priority: "high",
        notification: { channelId: "musicflow_reengagement" },
      },
      apns: { payload: { aps: { sound: "default" } } },
    });
    const invalidTokens = response.responses
      .map((item, index) => ({ item, token: input.tokens[index] }))
      .filter(({ item }) => {
        const code = item.error?.code;
        return (
          code === "messaging/invalid-registration-token" ||
          code === "messaging/registration-token-not-registered"
        );
      })
      .map(({ token }) => token);

    return { successCount: response.successCount, invalidTokens };
  }
}
