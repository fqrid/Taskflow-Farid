import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos, permitir acceso
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;

    if (!usuario) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // usuario.rol es una entidad Role => comparar con su campo "nombre"
    const rolNombreUsuario: string = usuario.rol?.nombre;

    if (!rolNombreUsuario || !rolesRequeridos.includes(rolNombreUsuario)) {
      throw new ForbiddenException(
        `No tienes permisos. Se requieren los siguientes roles: ${rolesRequeridos.join(', ')}`,
      );
    }

    return true;
  }
}
