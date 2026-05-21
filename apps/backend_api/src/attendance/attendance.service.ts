// src/attendance/attendance.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private async getLastRecord(userId: string) {
    return this.prisma.attendanceRecord.findFirst({
      where: { userId: userId },
      orderBy: { utcDateTime: 'desc' },
    });
  }

  // CU-02: Registrar Entrada (Con Idempotencia)
  async checkIn(userId: string, dto: CreateAttendanceDto) {
    // 1. Verificamos si el registro ya existe (ID enviado desde Flutter)
    const existingRecord = await this.prisma.attendanceRecord.findUnique({
      where: { id: dto.id },
    });

    // Si ya existe, simplemente lo devolvemos (Idempotencia RN-27)
    if (existingRecord) {
      return existingRecord;
    }

    // 2. Si no existe, aplicamos reglas y creamos
    const lastRecord = await this.getLastRecord(userId);

    if (lastRecord && lastRecord.type === 'entry') {
      throw new BadRequestException('No puedes registrar una entrada si no has registrado tu salida anterior.');
    }

    return this.prisma.attendanceRecord.create({
      data: {
        id: dto.id,
        userId: userId,
        type: 'entry',
        localDateTime: new Date(dto.localDateTime),
        utcDateTime: new Date(dto.utcDateTime),
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        signatureUrl: dto.signatureUrl,
        photoUrl: dto.photoUrl, // Tu nuevo requerimiento
        deviceId: dto.deviceId,
        comments: dto.comments,
      },
    });
  }

  // CU-03: Registrar Salida (Con Idempotencia)
  async checkOut(userId: string, dto: CreateAttendanceDto) {
    // 1. Verificamos si ya existe
    const existingRecord = await this.prisma.attendanceRecord.findUnique({
      where: { id: dto.id },
    });

    if (existingRecord) {
      return existingRecord; // Idempotencia
    }

    // 2. Si no existe, aplicamos reglas y creamos
    const lastRecord = await this.getLastRecord(userId);

    if (!lastRecord || lastRecord.type === 'exit') {
      throw new BadRequestException('No puedes registrar una salida sin una entrada previa válida.');
    }

    return this.prisma.attendanceRecord.create({
      data: {
        id: dto.id,
        userId: userId,
        type: 'exit',
        localDateTime: new Date(dto.localDateTime),
        utcDateTime: new Date(dto.utcDateTime),
        latitude: dto.latitude,
        longitude: dto.longitude,
        accuracy: dto.accuracy,
        signatureUrl: dto.signatureUrl,
        photoUrl: dto.photoUrl,
        deviceId: dto.deviceId,
        comments: dto.comments,
      },
    });
  }

  // CU-04: Historial Personal
  async getMyHistory(userId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { userId: userId },
      orderBy: { utcDateTime: 'desc' },
    });
  }

  // src/attendance/attendance.service.ts
async findAllRecords() {
  return this.prisma.attendanceRecord.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: {
      localDateTime: 'desc',
    },
  });
}
}