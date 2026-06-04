import {
  Catch,
  ArgumentsHost,
  WsExceptionFilter as NestWsExceptionFilter,
  HttpException,
  BadRequestException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch(WsException, HttpException, BadRequestException)
export class WsExceptionFilter implements NestWsExceptionFilter {
  /**
   * Maneja las excepciones capturadas en eventos WebSocket
   *
   * @param exception - La excepción capturada
   * @param host - El host de argumentos
   */
  catch(exception: any, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();
    
    // Loguear el error para depuraciÃ³n en el servidor
    console.error('[WsExceptionFilter] Capturando error:', {
      message: exception.message,
      stack: exception.stack,
      response: exception.getResponse ? exception.getResponse() : null
    });

    let eventData: any;

    // Procesar WsException
    if (exception instanceof WsException) {
      eventData = {
        success: false,
        error: {
          type: 'WS_EXCEPTION',
          message: exception.getError(),
          statusCode: 400,
        },
      };
    }
    // Procesar HttpException (errores de validación, autorización, etc.)
    else if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const statusCode = exception.getStatus();

      eventData = {
        success: false,
        error: {
          type: 'HTTP_EXCEPTION',
          message:
            typeof response === 'object' && 'message' in response
              ? response['message']
              : exception.message,
          statusCode,
          details:
            typeof response === 'object' && 'error' in response ? response : undefined,
        },
      };
    }
    // Procesar BadRequestException (validación)
    else if (exception instanceof BadRequestException) {
      const response = exception.getResponse();

      eventData = {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: Array.isArray(response['message'])
            ? response['message'].join(', ')
            : response['message'] || 'Validation failed',
          statusCode: 400,
          validationErrors: Array.isArray(response['message'])
            ? response['message']
            : undefined,
        },
      };
    }
    // Procesar errores genéricos
    else {
      eventData = {
        success: false,
        error: {
          type: 'INTERNAL_SERVER_ERROR',
          message: exception?.message || 'An unexpected error occurred',
          statusCode: 500,
        },
      };
    }

    // Emitir el error al cliente de manera controlada
    client.emit('error', eventData);
  }
}
