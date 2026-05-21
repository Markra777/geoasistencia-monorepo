// src/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@attendance.com', description: 'Correo del usuario' })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  email: string;

  @ApiProperty({ example: 'Admin12345*', description: 'Contraseña' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}