import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { RpcExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar como microserviço RabbitMQ (consumer)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URL')],
      queue: configService.get<string>('EVENTS_QUEUE'),
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  // Global Exception Filter
  app.useGlobalFilters(new RpcExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS para WebSocket
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  await app.startAllMicroservices();

  const port = configService.get<number>('PORT') || 3004;
  await app.listen(port);

  console.log(`Notifications Service rodando na porta ${port}`);
  console.log(`RabbitMQ Consumer:  ${configService.get('EVENTS_QUEUE')}`);
  console.log(`WebSocket disponível na porta ${port}`);
}

bootstrap();
