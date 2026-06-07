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
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(100, { message: 'Email muito longo' })
  email: string;

  @IsString({ message: 'Nome deve ser texto' })
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(100, { message: 'Nome muito longo' })
  name: string;

  @IsString({ message: 'Senha deve ser texto' })
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Telefone muito longo' })
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser ADMIN ou CLIENTE' })
  role?: UserRole;
}
