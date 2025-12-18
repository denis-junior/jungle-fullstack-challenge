import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar como microserviço RabbitMQ
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URL')],
      queue: configService.get<string>('TASKS_QUEUE'),
      queueOptions: {
        durable: true,
      },
    },
  });

  // Global Exception Filter
  app.useGlobalFilters(new RpcExceptionFilter());

  // Validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT') || 3003;
  await app.listen(port);

  console.log(`Tasks Service rodando na porta ${port}`);
  console.log(`RabbitMQ conectado:  ${configService.get('TASKS_QUEUE')}`);
}

bootstrap();
