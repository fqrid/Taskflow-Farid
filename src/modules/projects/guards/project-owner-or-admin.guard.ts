import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../../common/enums/role.enum';
import { ProjectsService } from '../projects.service';
import { User } from '../../users/user.entity';

@Injectable()
export class ProjectOwnerOrAdminGuard implements CanActivate {
  constructor(private readonly projectsService: ProjectsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      params: { id: string };
      user: User;
    }>();
    const projectId = request.params.id;
    const user = request.user;

    const project = await this.projectsService.buscarPorId(projectId);
    if (!project) {
      throw new NotFoundException('Proyecto no encontrado');
    }

    if (user.rol?.nombre === Role.ADMIN || project.idUsuario === user.id) {
      return true;
    }

    throw new ForbiddenException(
      'Solo el usuario creador del proyecto o un ADMIN pueden actualizarlo',
    );
  }
}
