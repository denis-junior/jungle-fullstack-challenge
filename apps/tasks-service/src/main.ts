import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar como microserviço RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URL')],
      queue: configService.get('TASKS_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  });

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();

  const port = configService.get('PORT') || 3003;
  await app.listen(port);

  console.log(`🚀 Tasks Service rodando na porta ${port}`);
  console.log(`📬 RabbitMQ conectado:  ${configService.get('TASKS_QUEUE')}`);
}

bootstrap();
