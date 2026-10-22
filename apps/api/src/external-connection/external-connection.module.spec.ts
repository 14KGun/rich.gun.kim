import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { BanksaladConnectionService } from './banksalad-connection.service';
import { CodefConnectionService } from './codef-connection.service';
import { ExternalConnectionModule } from './external-connection.module';
import { UpbitConnectionService } from './upbit-connection.service';

describe('ExternalConnectionModule', () => {
  it('세 연동 서비스를 모두 주입할 수 있다', async () => {
    const module = await Test.createTestingModule({
      imports: [ExternalConnectionModule],
    }).compile();

    expect(module.get(CodefConnectionService)).toBeInstanceOf(CodefConnectionService);
    expect(module.get(UpbitConnectionService)).toBeInstanceOf(UpbitConnectionService);
    expect(module.get(BanksaladConnectionService)).toBeInstanceOf(BanksaladConnectionService);
  });
});
