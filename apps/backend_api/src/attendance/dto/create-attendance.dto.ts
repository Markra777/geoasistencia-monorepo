// src/attendance/dto/create-attendance.dto.ts
import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAttendanceDto {
  @ApiProperty() @IsUUID() id: string;
  @ApiProperty() @IsString() localDateTime: string;
  @ApiProperty() @IsString() utcDateTime: string;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
  @ApiProperty() @IsNumber() accuracy: number;
  @ApiProperty() @IsString() signatureUrl: string;
  @ApiProperty() @IsString() photoUrl: string;
  @ApiProperty() @IsUUID() deviceId: string;

  @ApiProperty({ required: false, example: 'Retraso por tráfico' })
  @IsOptional()
  @IsString()
  comments?: string; // 🚀 NUEVO: Validar comentario opcional
}