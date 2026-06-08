import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENTE = 'CLIENTE',
}

export class CreateUserDto {
  @ApiProperty({
    example: 'usuario@academia.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(100)
  email: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: '11999999999',
    required: false,
    description: 'Telefone',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.CLIENTE,
    required: false,
    description: 'Função do usuário',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
