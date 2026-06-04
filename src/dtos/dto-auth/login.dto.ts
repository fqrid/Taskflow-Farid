import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@example.com',
    description: 'Email registrado del usuario',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Contrasena del usuario',
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
