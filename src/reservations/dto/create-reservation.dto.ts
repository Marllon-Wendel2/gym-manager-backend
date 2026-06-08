import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({
    example: 'f10e711e-0423-42e5-9bbd-6c9e952e05b7',
    description: 'ID do horário',
  })
  @IsUUID()
  scheduleId: string;
}
