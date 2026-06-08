import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReservation(
    userId: string,
    createReservationDto: CreateReservationDto,
  ) {
    // Buscar o horário
    const schedule = await this.prisma.schedule.findUnique({
      where: { id: createReservationDto.scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Horário não encontrado');
    }

    // Validar se horário está disponível
    if (schedule.isBlocked) {
      throw new BadRequestException(
        'Este horário está bloqueado pela administração',
      );
    }

    if (schedule.isBooked) {
      throw new BadRequestException('Este horário já está reservado');
    }

    // Validar se já tem reserva no mesmo dia
    const startOfDay = new Date(schedule.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(schedule.date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservation = await this.prisma.reservation.findFirst({
      where: {
        userId,
        status: 'ATIVA',
        schedule: {
          date: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
    });

    if (existingReservation) {
      throw new BadRequestException(
        'Você já possui uma reserva ativa para este dia',
      );
    }

    // Criar reserva
    const reservation = await this.prisma.reservation.create({
      data: {
        userId,
        scheduleId: createReservationDto.scheduleId,
        status: 'ATIVA',
      },
      include: {
        schedule: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Marcar horário como reservado
    await this.prisma.schedule.update({
      where: { id: schedule.id },
      data: { isBooked: true },
    });

    return reservation;
  }

  async findAllReservations(userId: string, userRole: string) {
    if (userRole === 'ADMIN') {
      // Admin vê todas as reservas
      return this.prisma.reservation.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          schedule: true,
        },
        orderBy: { reservedAt: 'desc' },
      });
    } else {
      // Cliente vê apenas suas reservas
      return this.prisma.reservation.findMany({
        where: { userId },
        include: { schedule: true },
        orderBy: { reservedAt: 'desc' },
      });
    }
  }

  async findMyReservations(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId, status: 'ATIVA' },
      include: { schedule: true },
      orderBy: { schedule: { date: 'asc' } },
    });
  }

  async cancelReservation(id: string, userId: string, userRole: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { schedule: true },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    // Verificar permissão
    if (userRole !== 'ADMIN' && reservation.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para cancelar esta reserva',
      );
    }

    // Verificar se já foi cancelada
    if (reservation.status !== 'ATIVA') {
      throw new BadRequestException(
        'Esta reserva já foi cancelada ou concluída',
      );
    }

    // Verificar se a data já passou
    const scheduleDate = new Date(reservation.schedule.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (scheduleDate < today && userRole !== 'ADMIN') {
      throw new BadRequestException(
        'Não é possível cancelar uma reserva de data passada',
      );
    }

    // Cancelar reserva
    const canceled = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        canceledAt: new Date(),
        canceledBy: userRole === 'ADMIN' ? 'ADMIN' : 'CLIENTE',
      },
    });

    // Liberar horário
    await this.prisma.schedule.update({
      where: { id: reservation.scheduleId },
      data: { isBooked: false },
    });

    return canceled;
  }

  async getReservationById(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        schedule: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reserva não encontrada');
    }

    return reservation;
  }
}
