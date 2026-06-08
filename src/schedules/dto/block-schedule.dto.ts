import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class BlockDayDto {
  @ApiProperty({
    example: '2025-12-25',
    description: 'Data no formato YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Natal',
    required: false,
    description: 'Motivo do bloqueio',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BlockHourDto {
  @ApiProperty({
    example: '2025-01-20',
    description: 'Data no formato YYYY-MM-DD',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 14,
    description: 'Hora (0-23)',
    minimum: 0,
    maximum: 23,
  })
  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;

  @ApiProperty({
    example: 'Manutenção',
    required: false,
    description: 'Motivo do bloqueio',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
