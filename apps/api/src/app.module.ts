import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { ExternalConnectionModule } from './external-connection/external-connection.module';

@Module({
  imports: [DatabaseModule, ExternalConnectionModule],
  controllers: [AppController],
})
export class AppModule {}
