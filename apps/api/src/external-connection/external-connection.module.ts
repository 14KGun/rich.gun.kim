import { Module } from '@nestjs/common';
import { BanksaladConnectionService } from './banksalad-connection.service';
import { CodefClient } from './codef/codef.client';
import { CODEF_CONFIG, codefConfigFromEnv } from './codef/codef.config';
import { CodefConnectionService } from './codef-connection.service';
import { UpbitConnectionService } from './upbit-connection.service';

const services = [CodefConnectionService, UpbitConnectionService, BanksaladConnectionService];

/** 외부 서비스(CODEF, 업비트, 뱅크샐러드) 연동을 묶는 모듈 */
@Module({
  providers: [
    { provide: CODEF_CONFIG, useFactory: () => codefConfigFromEnv() },
    CodefClient,
    ...services,
  ],
  exports: services,
})
export class ExternalConnectionModule {}
