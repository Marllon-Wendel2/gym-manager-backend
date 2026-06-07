import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Cria o pool de conexões para o Neon
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Cria o adapter do Prisma usando o pool
    const adapter = new PrismaPg(pool);

    // Passa o adapter para o PrismaClient
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Conectado ao DB com sucesso!');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Desconectado do banco de dados');
  }
}
