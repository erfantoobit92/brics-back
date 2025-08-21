import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <<-- این رو import کن

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(process.env.WEB_APP_URL);

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true, // پراپرتی‌های اضافه در body رو به صورت خودکار حذف می‌کنه
  //     transform: true, // داده‌های ورودی رو به نوع DTO تبدیل می‌کنه (مثلا string رو به number)
  //   }),
  // );

  app.enableCors({
    origin: true,
    // origin: [
    //   process.env.WEB_APP_URL,
    //   'https://brics-trade-back.loca.lt',
    //   'http://localhost:5173',
    //   'http://127.0.0.1:5173',
    // ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();
