import { IsString, IsNotEmpty, IsUUID, MinLength } from 'class-validator';

/**
 * DTO para validación de mensaje entrante por WebSocket
 *
 * Este DTO valida la estructura y los tipos de datos del payload
 * recibido en el evento 'sendMessage' del WebSocket.
 *
 * Utiliza class-validator para decoradores de validación y
 * el pipeline de validación de NestJS.
 */
export class CreateMessageDto {
  /**
   * Contenido del mensaje
   *
   * @validation
   * - IsString: Debe ser texto
   * - IsNotEmpty: No puede estar vacío
   * - MinLength: Mínimo 1 carácter (evita espacios en blanco)
   */
  @IsString({ message: 'El contenido debe ser texto válido' })
  @IsNotEmpty({ message: 'El contenido del mensaje no puede estar vacío' })
  @MinLength(1, { message: 'El mensaje debe tener al menos 1 carácter' })
  content: string;

  /**
   * ID del proyecto donde se envía el mensaje
   *
   * @validation
   * - IsString: Debe ser texto (UUID format)
   * - IsNotEmpty: No puede estar vacío
   * - IsUUID: Debe ser un UUID válido
   */
  @IsString({ message: 'El projectId debe ser texto' })
  @IsNotEmpty({ message: 'El projectId no puede estar vacío' })
  @IsUUID('4', { message: 'El projectId debe ser un UUID válido' })
  projectId: string;
}
