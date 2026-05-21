// src/devices/devices.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly prisma: PrismaService) {}

  async registerDevice(userId: string, dto: CreateDeviceDto) {
    // Busca si el dispositivo ya existe para este identificador
    let device = await this.prisma.device.findUnique({
      where: { deviceIdentifier: dto.deviceIdentifier },
    });

    // Si no existe, lo crea asociado al usuario (RN-19)
    if (!device) {
      device = await this.prisma.device.create({
        data: {
          userId: userId,
          deviceIdentifier: dto.deviceIdentifier,
          platform: dto.platform,
          appVersion: dto.appVersion,
        },
      });
    }

    return device;
  }
}