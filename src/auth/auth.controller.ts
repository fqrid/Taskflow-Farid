import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService, LoginResponse } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { User } from '../modules/users/user.entity';
import { RegisterDto } from '../dtos/dto-auth/register.dto';
import { LoginDto } from '../dtos/dto-auth/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({
    summary: '📝 Registrar nuevo usuario',
    description:
      'Permite que un nuevo usuario se registre en el sistema. La contraseña se encriptará automáticamente.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'Usuario registrado exitosamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'usuario@example.com',
        nombre: 'Juan Pérez',
        rol: 'desarrollador',
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
      },
    },
  })
  @ApiConflictResponse({
    description: 'El correo electrónico ya está registrado',
  })
  @ApiBadRequestResponse({ description: 'Datos de entrada inválidos' })
  @Post('registro')
  @HttpCode(201)
  async registro(@Body() dto: RegisterDto): Promise<Partial<User>> {
    return await this.authService.registro(dto.email, dto.nombre, dto.password);
  }

  @ApiOperation({
    summary: '🔐 Iniciar sesión',
    description:
      'Valida las credenciales del usuario y genera un token JWT válido por 24 horas.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Login exitoso. Token JWT generado',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        usuario: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'usuario@example.com',
          nombre: 'Juan Pérez',
          rol: 'admin',
          activo: true,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas o usuario inactivo',
  })
  @ApiBadRequestResponse({ description: 'Email o contraseña faltante' })
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return await this.authService.login(dto.email, dto.password);
  }

  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '👤 Ver perfil propio',
    description: 'Retorna la información del usuario autenticado actualmente.',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario autenticado',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'usuario@example.com',
        nombre: 'Juan Pérez',
        rol: 'admin',
        activo: true,
        fechaCreacion: '2025-04-19T10:30:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o ausente' })
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@Request() req: any): Promise<Partial<User>> {
    const { contraseña: _, ...usuarioSinContraseña } = req.user;
    return usuarioSinContraseña;
  }

  @ApiBearerAuth('Bearer')
  @ApiOperation({
    summary: '✅ Validar token JWT',
    description:
      'Verifica que el token JWT proporcionado es válido y no ha expirado.',
  })
  @ApiOkResponse({
    description: 'Token es válido',
    schema: {
      example: {
        mensaje: 'Token válido',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  @Get('validar-token')
  @UseGuards(JwtAuthGuard)
  async validarToken(): Promise<{ mensaje: string }> {
    return { mensaje: 'Token válido' };
  }
}
