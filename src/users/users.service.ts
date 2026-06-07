import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/wasm-compiler-edge';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    try {
      // Verifica se email já existe
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `Email ${createUserDto.email} já está em uso`,
        );
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prismaService.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
          phone: createUserDto.phone,
          role: createUserDto.role || 'CLIENTE',
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'Usuário criado com sucesso',
        data: user,
      };
    } catch (error) {
      console.error('Erro ao criar usuário:', error);

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email já está em uso');
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(`Erro ao criar usuário: ${errorMessage}`);
    }
  }

  async findAllUsers() {
    try {
      const users = await this.prismaService.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        count: users.length,
        data: users,
      };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(`Erro ao listar usuários: ${errorMessage}`);
    }
  }

  async findUserById(id: string) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error(`Erro ao buscar usuário ${id}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(`Erro ao buscar usuário: ${errorMessage}`);
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Verifica se usuário existe
      await this.findUserById(id);

      // Se tiver email, verifica se não está em uso por outro usuário
      if (updateUserDto.email) {
        const existingUser = await this.prismaService.user.findFirst({
          where: {
            email: updateUserDto.email,
            NOT: { id },
          },
        });

        if (existingUser) {
          throw new ConflictException(
            `Email ${updateUserDto.email} já está em uso por outro usuário`,
          );
        }
      }

      // Se tiver senha, faz hash
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser,
      };
    } catch (error) {
      console.error(`Erro ao atualizar usuário ${id}:`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(
        `Erro ao atualizar usuário: ${errorMessage}`,
      );
    }
  }

  async removeUser(id: string) {
    try {
      // Verifica se usuário existe
      await this.findUserById(id);

      const deletedUser = await this.prismaService.user.delete({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return {
        success: true,
        message: 'Usuário removido com sucesso',
        data: deletedUser,
      };
    } catch (error) {
      console.error(`Erro ao remover usuário ${id}:`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(`Erro ao remover usuário: ${errorMessage}`);
    }
  }
}
