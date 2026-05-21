// src/devices/dto/create-device.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'device-001', description: 'Identificador único del celular (IMEI o UUID)' })
  @IsString()
  deviceIdentifier: string;

  @ApiProperty({ example: 'Android', required: false })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiProperty({ example: '1.0.0', required: false })
  @IsOptional()
  @IsString()
  appVersion?: string;
}