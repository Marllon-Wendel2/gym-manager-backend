import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

// Interface para o usuário que vem do JWT
interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Interface estendida do Request com o usuário
interface RequestWithUser extends Request {
  user: RequestUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Pega as roles requeridas do decorator @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não tem @Roles(), permite acesso
    if (!requiredRoles) {
      return true;
    }

    // Pega o request com tipagem correta
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verifica se o usuário tem uma das roles requeridas
    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acesso negado. Função '${user.role}' não tem permissão. Necessário: ${requiredRoles.join(' ou ')}`,
      );
    }

    return true;
  }
}
