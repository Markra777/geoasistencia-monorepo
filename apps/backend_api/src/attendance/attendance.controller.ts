// src/attendance/attendance.controller.ts
import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Asistencia')
@ApiBearerAuth() // Swagger pedirá el candado para todos
@UseGuards(AuthGuard('jwt')) // Protege todos los endpoints de este controlador
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Registrar entrada (CU-02)' })
  checkIn(@Request() req, @Body() dto: CreateAttendanceDto) {
    // req.user.userId viene del token JWT
    return this.attendanceService.checkIn(req.user.userId, dto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Registrar salida (CU-03)' })
  checkOut(@Request() req, @Body() dto: CreateAttendanceDto) {
    return this.attendanceService.checkOut(req.user.userId, dto);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'Historial personal de asistencia (CU-04)' })
  getMyHistory(@Request() req) {
    return this.attendanceService.getMyHistory(req.user.userId);
  }

  // src/attendance/attendance.controller.ts
@Get('admin/all')
@ApiOperation({ summary: 'Obtener todas las marcaciones (Solo Admin)' })
getAllRecords() {
  return this.attendanceService.findAllRecords();
}
}