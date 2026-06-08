import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  BlockDayDto,
  BlockHourDto,
  UnblockHourDto,
} from './dto/block-schedule.dto';
import { PrismaService } from '../prisma/prisma.service';
import { DaySchedule, HourSchedule } from './dto/calendar-response';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  private getDateWithoutTimezone(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  private getDayRange(dateString: string) {
    const startDate = this.getDateWithoutTimezone(dateString);
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 1);
    return { startDate, endDate };
  }

  // ⭐ BLOQUEAR DIA INTEIRO
  async blockFullDay(blockDayDto: BlockDayDto) {
    const { startDate, endDate } = this.getDayRange(blockDayDto.date);

    // Verificar se existem horários para esta data
    const schedules = await this.prisma.schedule.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    if (schedules.length === 0) {
      throw new NotFoundException(
        `Nenhum horário encontrado para o dia ${blockDayDto.date}`,
      );
    }

    // Bloquear todos os horários do dia
    const updated = await this.prisma.schedule.updateMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      data: {
        isBlocked: true,
      },
    });

    return {
      success: true,
      message: `Dia ${blockDayDto.date} bloqueado com sucesso`,
      reason: blockDayDto.reason || 'Bloqueio administrativo',
      schedulesBlocked: updated.count,
    };
  }

  // ⭐ DESBLOQUEAR DIA INTEIRO (CORRIGIDO)
  async unblockFullDay(date: string) {
    const { startDate, endDate } = this.getDayRange(date);

    const updated = await this.prisma.schedule.updateMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        isBooked: false,
      },
      data: {
        isBlocked: false,
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        `Nenhum horário foi desbloqueado. Pode ser que todos já estejam desbloqueados ou tenham reservas.`,
      );
    }

    return {
      success: true,
      message: `Dia ${date} desbloqueado com sucesso`,
      schedulesUnblocked: updated.count,
    };
  }

  // ⭐ BLOQUEAR HORÁRIO ESPECÍFICO (CORRIGIDO)
  async blockSpecificHour(blockHourDto: BlockHourDto) {
    const { startDate, endDate } = this.getDayRange(blockHourDto.date);

    // Buscar o horário específico
    const schedule = await this.prisma.schedule.findFirst({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        hour: blockHourDto.hour,
      },
    });

    if (!schedule) {
      throw new NotFoundException(
        `Horário ${blockHourDto.hour}:00 do dia ${blockHourDto.date} não encontrado`,
      );
    }

    if (schedule.isBooked) {
      throw new BadRequestException(
        `Não é possível bloquear um horário que já está reservado`,
      );
    }

    const updated = await this.prisma.schedule.update({
      where: { id: schedule.id },
      data: { isBlocked: true },
    });

    return {
      success: true,
      message: `Horário ${blockHourDto.hour}:00 do dia ${blockHourDto.date} bloqueado com sucesso`,
      reason: blockHourDto.reason || 'Bloqueio administrativo',
      schedule: updated,
    };
  }

  // ⭐ DESBLOQUEAR HORÁRIO ESPECÍFICO (CORRIGIDO)
  async unblockSpecificHour(unblockHourDto: UnblockHourDto) {
    const { startDate, endDate } = this.getDayRange(unblockHourDto.date);

    const schedule = await this.prisma.schedule.findFirst({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
        hour: unblockHourDto.hour,
      },
    });

    if (!schedule) {
      throw new NotFoundException(
        `Horário ${unblockHourDto.hour}:00 do dia ${unblockHourDto.date} não encontrado`,
      );
    }

    if (schedule.isBooked) {
      throw new BadRequestException(
        `Não é possível desbloquear um horário que já está reservado`,
      );
    }

    const updated = await this.prisma.schedule.update({
      where: { id: schedule.id },
      data: { isBlocked: false },
    });

    return {
      success: true,
      message: `Horário ${unblockHourDto.hour}:00 do dia ${unblockHourDto.date} desbloqueado com sucesso`,
      schedule: updated,
    };
  }

  // ⭐ LISTAR HORÁRIOS BLOQUEADOS
  async findBlockedSchedules() {
    const blocked = await this.prisma.schedule.findMany({
      where: { isBlocked: true },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    });

    return {
      success: true,
      count: blocked.length,
      data: blocked,
    };
  }

  // ⭐ LISTAR DIAS COM BLOQUEIO TOTAL
  async findFullyBlockedDays() {
    const schedules = await this.prisma.schedule.findMany({
      where: { isBlocked: true },
      orderBy: { date: 'asc' },
    });

    // Contar quantos horários bloqueados por dia
    const blockedCountByDay = new Map<string, number>();

    for (const schedule of schedules) {
      const dateStr = schedule.date.toISOString().split('T')[0];
      blockedCountByDay.set(dateStr, (blockedCountByDay.get(dateStr) || 0) + 1);
    }

    // Buscar total de horas por dia
    const startHourConfig = await this.prisma.systemConfig.findUnique({
      where: { key: 'OPERATING_START_HOUR' },
    });
    const endHourConfig = await this.prisma.systemConfig.findUnique({
      where: { key: 'OPERATING_END_HOUR' },
    });

    const startHour = parseInt(startHourConfig?.value || '6');
    const endHour = parseInt(endHourConfig?.value || '22');
    const totalHoursPerDay = endHour - startHour + 1;

    // Filtrar dias que estão 100% bloqueados
    const fullyBlockedDays = Array.from(blockedCountByDay.entries())
      .filter(([, count]) => count === totalHoursPerDay)
      .map(([date]) => date);

    return {
      success: true,
      count: fullyBlockedDays.length,
      data: fullyBlockedDays,
    };
  }

  async getCalendarForNext30Days() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);

    // Buscar todos os horários no período
    const schedules = await this.prisma.schedule.findMany({
      where: {
        date: {
          gte: today,
          lt: endDate,
        },
      },
      include: {
        reservations: {
          where: { status: 'ATIVA' },
          select: { id: true },
        },
      },
      orderBy: [{ date: 'asc' }, { hour: 'asc' }],
    });

    // Buscar configurações de horário
    const startHourConfig = await this.prisma.systemConfig.findUnique({
      where: { key: 'OPERATING_START_HOUR' },
    });
    const endHourConfig = await this.prisma.systemConfig.findUnique({
      where: { key: 'OPERATING_END_HOUR' },
    });

    const startHour = parseInt(startHourConfig?.value || '6');
    const endHour = parseInt(endHourConfig?.value || '22');
    const totalHoursPerDay = endHour - startHour + 1;

    // Agrupar por data
    const schedulesByDate = new Map<string, typeof schedules>();

    for (const schedule of schedules) {
      const dateStr = schedule.date.toISOString().split('T')[0];
      if (!schedulesByDate.has(dateStr)) {
        schedulesByDate.set(dateStr, []);
      }
      schedulesByDate.get(dateStr)!.push(schedule);
    }

    // Montar o calendário
    const days: DaySchedule[] = [];

    for (let i = 0; i <= 30; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const existingSchedules = schedulesByDate.get(dateStr) || [];

      // Verificar se o dia está 100% bloqueado
      const blockedHoursCount = existingSchedules.filter(
        (s) => s.isBlocked,
      ).length;
      const isFullyBlocked =
        blockedHoursCount === totalHoursPerDay && existingSchedules.length > 0;

      // Criar array de horas (preencher todas as horas do dia)
      const hours: HourSchedule[] = [];

      for (let hour = startHour; hour <= endHour; hour++) {
        const schedule = existingSchedules.find((s) => s.hour === hour);

        if (schedule) {
          hours.push({
            hour,
            scheduleId: schedule.id,
            isAvailable: !schedule.isBlocked && !schedule.isBooked,
            isBlocked: schedule.isBlocked,
            isBooked: schedule.isBooked,
            reservationId: schedule.reservations[0]?.id,
          });
        } else {
          // Horário não existe no banco (não foi gerado ainda)
          hours.push({
            hour,
            scheduleId: '',
            isAvailable: false,
            isBlocked: false,
            isBooked: false,
          });
        }
      }

      days.push({
        date: dateStr,
        isFullyBlocked,
        hours,
      });
    }

    return {
      success: true,
      startDate: today.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      days,
    };
  }
}
