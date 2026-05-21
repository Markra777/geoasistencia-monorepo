// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    // Registramos el módulo JWT leyendo el secreto del .env
    JwtModule.register({
      global: true, // Lo hacemos global para usarlo luego en los Guards
      secret: process.env.JWT_SECRET || 'change_this_secret_super_secure_2026',
      signOptions: { expiresIn: '1d' }, // El token expirará en 1 día
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}