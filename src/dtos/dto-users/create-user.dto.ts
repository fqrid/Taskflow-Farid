import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Email único del usuario (debe ser válido)',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario (mínimo 2 caracteres)',
  })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Contraseña del usuario (mínimo 6 caracteres)',
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'ADMIN',
    description:
      'Rol a asignar: ADMIN, GERENTE o DESARROLLADOR. Si no se proporciona, se asigna DESARROLLADOR por defecto.',
    enum: ['ADMIN', 'GERENTE', 'DESARROLLADOR'],
  })
  @IsOptional()
  @IsIn(['ADMIN', 'GERENTE', 'DESARROLLADOR'])
  rol?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Estado del usuario. Por defecto: activo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
