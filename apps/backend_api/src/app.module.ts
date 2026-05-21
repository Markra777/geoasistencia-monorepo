import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { DevicesModule } from './devices/devices.module';

@Module({
  imports: [PrismaModule, AuthModule, AttendanceModule, DevicesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
