import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

// Interface para tipagem
interface ScheduleData {
  date: Date;
  hour: number;
  isBlocked: boolean;
  isBooked: boolean;
}

@Injectable()
export class SchedulesCronService {
  private readonly logger = new Logger(SchedulesCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Função auxiliar para criar datas no início do dia (sem fuso)
  private getDateWithoutTimezone(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  }

  // Função auxiliar para obter o range do dia
  private getDayRange(date: Date): { startDate: Date; endDate: Date } {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const startDate = new Date(Date.UTC(year, month, day, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, day + 1, 0, 0, 0));

    return { startDate, endDate };
  }

  // Executa todo dia 20 de cada mês às 02:00 AM
  @Cron('0 2 20 * *')
  async generateSchedulesForNext40Days() {
    this.logger.log('🔄 Iniciando geração automática de horários...');

    try {
      // Buscar configurações do sistema
      const startHourConfig = await this.prisma.systemConfig.findUnique({
        where: { key: 'OPERATING_START_HOUR' },
      });
      const endHourConfig = await this.prisma.systemConfig.findUnique({
        where: { key: 'OPERATING_END_HOUR' },
      });

      const startHour = parseInt(startHourConfig?.value || '6');
      const endHour = parseInt(endHourConfig?.value || '22');
      const daysToGenerate = 40;

      // Usar UTC para evitar problemas de fuso
      const today = new Date();
      const utcToday = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate(),
          0,
          0,
          0,
        ),
      );

      let totalSchedulesCreated = 0;
      let totalSchedulesSkipped = 0;

      for (let day = 0; day <= daysToGenerate; day++) {
        const targetDate = new Date(utcToday);
        targetDate.setUTCDate(utcToday.getUTCDate() + day);

        const { startDate, endDate } = this.getDayRange(targetDate);

        const existingSchedules = await this.prisma.schedule.findFirst({
          where: {
            date: {
              gte: startDate,
              lt: endDate,
            },
          },
        });

        if (!existingSchedules) {
          // Criar horários para esta data com tipagem explícita
          const schedules: ScheduleData[] = [];

          for (let hour = startHour; hour <= endHour; hour++) {
            schedules.push({
              date: startDate,
              hour,
              isBlocked: false,
              isBooked: false,
            });
          }

          if (schedules.length > 0) {
            await this.prisma.schedule.createMany({
              data: schedules,
              skipDuplicates: true,
            });
            totalSchedulesCreated += schedules.length;
            const dateStr = startDate.toISOString().split('T')[0];
            this.logger.log(
              `📆 ${dateStr}: ${schedules.length} horários criados`,
            );
          }
        } else {
          totalSchedulesSkipped++;
        }
      }

      this.logger.log(`✅ JOB concluído!`);
      this.logger.log(`   📊 Criados: ${totalSchedulesCreated} horários`);
      this.logger.log(
        `   ⏭️ Pulados: ${totalSchedulesSkipped} dias (já existiam)`,
      );
      this.logger.log(`   📅 Período: ${daysToGenerate} dias à frente`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(`❌ Erro ao gerar horários: ${errorMessage}`);
    }
  }

  // Endpoint manual para testar
  async manualGenerateSchedules() {
    this.logger.log('🔄 Executando geração manual de horários...');
    await this.generateSchedulesForNext40Days();
    return { message: 'Geração manual concluída' };
  }
}
