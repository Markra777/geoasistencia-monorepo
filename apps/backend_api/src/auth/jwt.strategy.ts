// src/auth/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // Extrae el token del header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // Rechaza tokens vencidos
      secretOrKey: process.env.JWT_SECRET || '*<hvOF_=CS0)QMd?dZ=?x?]eo7qLm_I;CqcYv6}i:Cr',
    });
  }

  // Esta función se ejecuta solo si el token es válido y no ha expirado
  async validate(payload: any) {
    // Retornamos los datos que inyectamos en el login (sub, email, role).
    // NestJS inyectará esto automáticamente en "request.user" (CU-13)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}