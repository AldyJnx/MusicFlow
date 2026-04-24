import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.device.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateDeviceDto) {
    return this.prisma.device.create({
      data: {
        userId,
        deviceType: dto.deviceType,
        deviceName: dto.deviceName,
        fcmToken: dto.fcmToken,
      },
    });
  }

  async updateFcmToken(id: string, userId: string, fcmToken: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.prisma.device.update({
      where: { id },
      data: { fcmToken },
    });
  }

  async updateLastSync(id: string) {
    return this.prisma.device.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });
  }

  async remove(id: string, userId: string) {
    const device = await this.prisma.device.findFirst({
      where: { id, userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    return this.prisma.device.delete({
      where: { id },
    });
  }
}
