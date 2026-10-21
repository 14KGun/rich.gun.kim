import { NestFactory } from '@nestjs/core';
import { API_PORT, API_PREFIX } from '@rich/constants';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(API_PREFIX);
  await app.listen(process.env.PORT ?? API_PORT);
}
void bootstrap();
