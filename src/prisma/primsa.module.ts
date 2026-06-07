import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // ← Isso garante que o PrismaService seja singleton
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
