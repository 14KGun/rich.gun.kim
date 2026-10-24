import { Module } from '@nestjs/common';
import { SecretCipher } from '../crypto/secret-cipher';
import { BanksaladConnectionService } from './banksalad-connection.service';
import { CodefClient } from './codef/codef.client';
import { CODEF_CONFIG, codefConfigFromEnv } from './codef/codef.config';
import { CodefConnectionService } from './codef-connection.service';
import { ExternalConnectionRepository } from './storage/external-connection.repository';
import { UpbitClient } from './upbit/upbit.client';
import { UpbitConnectionService } from './upbit-connection.service';

const services = [
  CodefConnectionService,
  UpbitConnectionService,
  BanksaladConnectionService,
  ExternalConnectionRepository,
  SecretCipher,
];

/** 외부 서비스(CODEF, 업비트, 뱅크샐러드) 연동을 묶는 모듈 */
@Module({
  providers: [
    { provide: CODEF_CONFIG, useFactory: () => codefConfigFromEnv() },
    CodefClient,
    UpbitClient,
    ...services,
  ],
  exports: services,
})
export class ExternalConnectionModule {}
