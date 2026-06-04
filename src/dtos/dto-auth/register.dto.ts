import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Email unico del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Contrasena del usuario',
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
