import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

// Configuração do banco
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('❌ DATABASE_URL não está definida no arquivo .env');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Interface para o schedule
interface ScheduleData {
  date: Date;
  hour: number;
  isBlocked: boolean;
  isBooked: boolean;
}

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // 1. Criar usuário ADMIN
  const adminPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@academia.com' },
    update: {},
    create: {
      email: 'admin@academia.com',
      name: 'Administrador',
      password: adminPassword,
      role: 'ADMIN',
      phone: '11999999990',
    },
  });
  console.log('✅ Admin criado: admin@academia.com');

  // 2. Configurações padrão do sistema
  const configs = [
    {
      key: 'OPERATING_START_HOUR',
      value: '6',
      description: 'Hora de início do funcionamento (6 = 06:00)',
    },
    {
      key: 'OPERATING_END_HOUR',
      value: '22',
      description: 'Hora de término do funcionamento (22 = 22:00)',
    },
    {
      key: 'ADVANCE_DAYS_TO_GENERATE',
      value: '30',
      description: 'Quantos dias à frente gerar horários automaticamente',
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }
  console.log('✅ Configurações do sistema criadas');

  // 3. Gerar horários para os próximos dias
  console.log('📅 Gerando horários para os próximos dias...');

  const startHourConfig = await prisma.systemConfig.findUnique({
    where: { key: 'OPERATING_START_HOUR' },
  });
  const endHourConfig = await prisma.systemConfig.findUnique({
    where: { key: 'OPERATING_END_HOUR' },
  });
  const advanceDaysConfig = await prisma.systemConfig.findUnique({
    where: { key: 'ADVANCE_DAYS_TO_GENERATE' },
  });

  const startHour = parseInt(startHourConfig?.value || '6');
  const endHour = parseInt(endHourConfig?.value || '22');
  const advanceDays = parseInt(advanceDaysConfig?.value || '30');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let totalSchedulesCreated = 0;

  for (let day = 0; day <= advanceDays; day++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + day);

    // Verifica se já existem horários para esta data
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);

    const existingSchedules = await prisma.schedule.findFirst({
      where: {
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
    });

    if (!existingSchedules) {
      // Criar horários para esta data
      const schedules: ScheduleData[] = []; // Tipagem explícita

      for (let hour = startHour; hour <= endHour; hour++) {
        schedules.push({
          date: targetDate,
          hour,
          isBlocked: false,
          isBooked: false,
        });
      }

      if (schedules.length > 0) {
        await prisma.schedule.createMany({
          data: schedules,
          skipDuplicates: true,
        });
        totalSchedulesCreated += schedules.length;
        const dateStr = targetDate.toISOString().split('T')[0];
        console.log(`   📆 ${dateStr}: ${schedules.length} horários criados`);
      }
    }
  }

  console.log(`✅ ${totalSchedulesCreated} horários gerados com sucesso!`);
  console.log('📋 Resumo:');
  console.log(`   - Horário funcionamento: ${startHour}:00 às ${endHour}:00`);
  console.log(`   - Dias gerados: ${advanceDays} dias à frente`);
  console.log(`   - Total de horários: ${totalSchedulesCreated}`);

  console.log('\n🔐 Credenciais do admin:');
  console.log('   Email: admin@academia.com');
  console.log('   Senha: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
