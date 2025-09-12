import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(
          errors.map((err) => ({
            field: err.property,
            errors: Object.values(err.constraints ?? {}),
          })),
        );
      },
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // app.enableCors({
  //   // origin: true,
  //   origin: [
  //     process.env.WEB_APP_URL,
  //     'https://brics-trade-back-2.loca.lt',
  //     // 'http://localhost:5173',
  //     // 'http://127.0.0.1:5173',
  //   ],
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  //   credentials: true,
  // });

  await app.listen(3000);
  // await app.listen(3000, '0.0.0.0');
}
bootstrap();
