import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Gym API - SoloGym Manager')
    .setDescription(
      `
      API para gestão de academia individual.
      
      ## Funcionalidades:
      - 🔐 Autenticação JWT (login/register)
      - 👥 CRUD de usuários (admin)
      - 📅 Gestão de horários com bloqueios
      - 📝 Sistema de reservas
      - 🤖 Geração automática de horários (CRON)
      
      ## Roles:
      - **ADMIN**: Acesso total (gestão de usuários, bloqueios, etc)
      - **CLIENTE**: Apenas reservas e visualização
    `,
    )
    .setVersion('1.0')
    .setContact(
      'Marllon Ferreira',
      'https://github.com/seu-usuario',
      'email@academia.com',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticação')
    .addTag('users', 'Gestão de usuários (admin)')
    .addTag('schedules', 'Horários e calendário')
    .addTag('reservations', 'Reservas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Gym API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // Habilitar CORS
  app.enableCors();

  await app.listen(3000);
  console.log(`🚀 Server running on http://localhost:3000`);
  console.log(`📚 Swagger UI: http://localhost:3000/api/docs`);
}
bootstrap();
