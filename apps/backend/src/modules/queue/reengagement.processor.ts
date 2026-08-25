import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "@/prisma/prisma.service";
import { FirebaseMessagingService } from "@/modules/notifications/firebase-messaging.service";
import { NOTIFICATIONS_QUEUE } from "./queue.constants";

@Processor(NOTIFICATIONS_QUEUE)
export class ReengagementProcessor extends WorkerHost {
  private readonly logger = new Logger(ReengagementProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: FirebaseMessagingService,
  ) {
    super();
  }

  async process(job: Job<{ userId: string }>): Promise<void> {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const user = await this.prisma.user.findFirst({
      where: {
        id: job.data.userId,
        isActive: true,
        notificationConsent: true,
        lastActiveAt: { lte: cutoff },
      },
      select: {
        id: true,
        lastActiveAt: true,
        reengagementNotifiedAt: true,
        devices: {
          where: { isActive: true, fcmToken: { not: null } },
          select: { fcmToken: true },
        },
      },
    });
    if (
      !user ||
      (user.reengagementNotifiedAt &&
        user.lastActiveAt &&
        user.reengagementNotifiedAt >= user.lastActiveAt)
    ) {
      return;
    }

    const recent = await this.prisma.playHistory.findFirst({
      where: { userId: user.id },
      orderBy: { playedAt: "desc" },
      select: { track: { select: { id: true, title: true } } },
    });
    const tokens = user.devices.flatMap((device) =>
      device.fcmToken ? [device.fcmToken] : [],
    );
    const track = recent?.track;
    const sent = await this.messaging.sendToTokens({
      tokens,
      title: "MusicFlow te espera",
      body: track
        ? `${track.title} te espera para seguir escuchando`
        : "Vuelve donde tu musica es diferente, MusicFlow te espera",
      data: {
        type: "reengagement",
        route: track ? `/track/${track.id}` : "/home",
        ...(track ? { trackId: track.id } : {}),
      },
    });

    if (sent.invalidTokens.length > 0) {
      await this.prisma.device.updateMany({
        where: { fcmToken: { in: sent.invalidTokens } },
        data: { fcmToken: null, isActive: false },
      });
    }
    if (sent.successCount > 0) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { reengagementNotifiedAt: new Date() },
      });
    } else {
      this.logger.warn(`No FCM delivery succeeded for user ${user.id}`);
    }
  }
}
