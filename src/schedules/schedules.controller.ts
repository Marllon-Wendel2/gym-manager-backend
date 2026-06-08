import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { BlockDayDto, BlockHourDto } from './dto/block-schedule.dto';

@Controller('schedules')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('block-day')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bloquear dia inteiro',
    description: 'ADMIN: Bloqueia todos os horários de um dia',
  })
  @ApiBody({ type: BlockDayDto })
  @ApiResponse({ status: 200, description: 'Dia bloqueado' })
  @Roles('ADMIN')
  blockFullDay(@Body() blockDayDto: BlockDayDto) {
    return this.schedulesService.blockFullDay(blockDayDto);
  }

  @Get('calendar')
  @ApiOperation({
    summary: 'Calendário 30 dias',
    description:
      'Retorna calendário completo para os próximos 30 dias com status de cada horário',
  })
  @ApiResponse({ status: 200, description: 'Calendário com dias e horários' })
  async getCalendar() {
    return this.schedulesService.getCalendarForNext30Days();
  }

  @Delete('unblock-day/:date')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desbloquear dia inteiro',
    description: 'ADMIN: Desbloqueia todos os horários de um dia',
  })
  @ApiParam({
    name: 'date',
    example: '2025-12-25',
    description: 'Data no formato YYYY-MM-DD',
  })
  unblockFullDay(@Param('date') date: string) {
    return this.schedulesService.unblockFullDay(date);
  }

  @Post('block-hour')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bloquear horário específico',
    description: 'ADMIN: Bloqueia um horário específico',
  })
  @ApiBody({ type: BlockHourDto })
  @ApiResponse({ status: 200, description: 'Horário bloqueado' })
  blockSpecificHour(@Body() blockHourDto: BlockHourDto) {
    return this.schedulesService.blockSpecificHour(blockHourDto);
  }

  @Delete('unblock-hour')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desbloquear horário específico',
    description:
      'ADMIN: Desbloqueia um horário específico que foi previamente bloqueado',
  })
  @ApiResponse({
    status: 200,
    description: 'Horário desbloqueado',
    schema: {
      example: {
        success: true,
        message: 'Horário 14:00 do dia 2025-01-20 desbloqueado com sucesso',
        schedule: {
          id: 'uuid',
          date: '2025-01-20T00:00:00.000Z',
          hour: 14,
          isBlocked: false,
          isBooked: false,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Horário não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Horário está reservado, não pode ser desbloqueado',
  })
  unblockSpecificHour(@Body() unblockHourDto: BlockHourDto) {
    return this.schedulesService.unblockSpecificHour(unblockHourDto);
  }

  @Get('blocked')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar horários bloqueados',
    description:
      'ADMIN: Retorna todos os horários que estão bloqueados (isBlocked = true)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de horários bloqueados',
    schema: {
      example: {
        success: true,
        count: 35,
        data: [
          {
            id: 'uuid',
            date: '2025-12-25T00:00:00.000Z',
            hour: 6,
            isBlocked: true,
            isBooked: false,
          },
        ],
      },
    },
  })
  findBlockedSchedules() {
    return this.schedulesService.findBlockedSchedules();
  }

  @Get('blocked-days')
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar dias completamente bloqueados',
    description:
      'ADMIN: Retorna as datas onde todos os horários do dia estão bloqueados',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de datas com bloqueio total',
    schema: {
      example: {
        success: true,
        count: 2,
        data: ['2025-12-25', '2026-01-01'],
      },
    },
  })
  findFullyBlockedDays() {
    return this.schedulesService.findFullyBlockedDays();
  }
}
