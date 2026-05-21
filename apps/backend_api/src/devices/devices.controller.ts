// src/devices/devices.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Dispositivos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo dispositivo para el usuario (RN-19)' })
  registerDevice(@Request() req, @Body() dto: CreateDeviceDto) {
    return this.devicesService.registerDevice(req.user.userId, dto);
  }
}