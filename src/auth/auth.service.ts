import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from './dto/register-auth-dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterAuthDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        name: registerDto.name,
        password: hashedPassword,
        phone: registerDto.phone,
        role: 'CLIENTE',
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return this.generateToken(user);
  }

  async login(loginDto: LoginAuthDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    return this.generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  }

  private generateToken(user: {
    id: string;
    email: string;
    name: string;
    role: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
