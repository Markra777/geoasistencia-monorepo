// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión (CU-01)' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna JWT.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // --- NUEVA RUTA PROTEGIDA ---
  @Get('me')
  @UseGuards(AuthGuard('jwt')) // ¡Esta línea es la que protege la ruta (RN-03)!
  @ApiBearerAuth() // Le dice a Swagger que esta ruta requiere el candado verde
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Devuelve la información del usuario.' })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado.' })
  getProfile(@Request() req) {
    // req.user contiene lo que devolvió la función validate() de tu JwtStrategy
    return req.user; 
  }
}