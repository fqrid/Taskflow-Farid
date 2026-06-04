import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { ChatService } from './chat.service';

@ApiTags('💬 Chat')
@ApiBearerAuth('Bearer')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages/:projectId')
  @ApiOperation({
    summary: '📜 Obtener historial de mensajes',
    description: 'Recupera los últimos mensajes de un proyecto específico. Solo accesible para usuarios con acceso al proyecto.',
  })
  @ApiParam({ name: 'projectId', description: 'ID del proyecto' })
  @ApiOkResponse({ description: 'Historial recuperado exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token no proporcionado o inválido' })
  @ApiForbiddenResponse({ description: 'No tienes acceso a este proyecto' })
  async getMessages(
    @Param('projectId') projectId: string,
    @Query('limit') limit?: number,
    @Req() req?: any,
  ) {
    const userId = req.user.id;
    
    // Validar que el usuario tenga acceso al proyecto
    const hasAccess = await this.chatService.validateUserProjectAccess(userId, projectId);
    if (!hasAccess) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    return await this.chatService.getProjectMessages(projectId, limit);
  }
}
