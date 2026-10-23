import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ExternalConnectionModule } from './external-connection/external-connection.module';

@Module({
  imports: [ExternalConnectionModule],
  controllers: [AppController],
})
export class AppModule {}
