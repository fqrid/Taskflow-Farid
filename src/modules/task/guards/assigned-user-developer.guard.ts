import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { AssignTaskDto } from '../../../dtos/dto-task/assign-task.dto';
import { UsersService } from '../../users/users.service';

@Injectable()
export class AssignedUserDeveloperGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ body: AssignTaskDto }>();
    const usuario = await this.usersService.buscarPorId(
      request.body.idUsuarioAsignado,
    );

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.rol?.nombre !== Role.DESARROLLADOR) {
      throw new BadRequestException(
        'Solo se pueden asignar tareas a usuarios con rol DESARROLLADOR',
      );
    }

    return true;
  }
}
