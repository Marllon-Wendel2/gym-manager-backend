import {
  IsDateString,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class BlockDayDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BlockHourDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UnblockHourDto {
  @IsDateString()
  date: string;

  @IsInt()
  @Min(0)
  @Max(23)
  hour: number;
}
