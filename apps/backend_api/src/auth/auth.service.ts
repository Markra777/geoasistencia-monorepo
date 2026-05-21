// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario por email
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas'); // Mensaje genérico por seguridad
    }

    // 2. Verificar si está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // 3. Comparar contraseñas con bcrypt (RN-02)
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 4. Generar el JWT (RN-03)
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }
}