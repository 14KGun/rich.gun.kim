import { describe, expect, it } from 'vitest';
import { CodefClient } from './codef/codef.client';
import { CodefConnectionService } from './codef-connection.service';

/*
 * CODEF 샌드박스에 실제로 요청해서 토큰 발급, 요청·응답 인코딩, 응답 스키마 파싱을 확인한다.
 * `pnpm --filter @rich/api test:integration` 으로만 실행한다.
 *
 * - 환경은 항상 샌드박스로 고정한다. CODEF_ENVIRONMENT 를 읽지 않는다.
 * - 키는 샌드박스 전용 이름으로 받아서, 데모·정식 키와 섞이지 않게 한다.
 * - 키가 없으면 실패한다. 통합 테스트를 돌렸는데 아무것도 확인하지 않고 통과하는 일을 막기 위해서다.
 */
const clientId = process.env.CODEF_SANDBOX_CLIENT_ID ?? '';
const clientSecret = process.env.CODEF_SANDBOX_CLIENT_SECRET ?? '';
if (!clientId || !clientSecret) {
  throw new Error(
    'CODEF_SANDBOX_CLIENT_ID, CODEF_SANDBOX_CLIENT_SECRET 환경 변수에 샌드박스 키를 설정해야 통합 테스트를 실행할 수 있습니다.',
  );
}

/** 샌드박스는 실제 계정 없이 고정된 샘플 데이터를 돌려주므로 임의의 값을 쓴다. */
const SANDBOX_CONNECTED_ID = 'sandbox-connected-id';
const BANK = '0004';
const STOCK = '0240';
const CARD = '0309';
const RANGE = { startDate: '20260901', endDate: '20260930' };

describe('CodefConnectionService (CODEF 샌드박스)', () => {
  const service = new CodefConnectionService(
    new CodefClient({ environment: 'sandbox', clientId, clientSecret, publicKey: '' }),
  );

  it('환율', async () => {
    const result = await service.getExchangeRates();
    expect(result.resDetailList.length).toBeGreaterThan(0);
  });

  it('은행 보유계좌', async () => {
    const result = await service.getBankAccounts(SANDBOX_CONNECTED_ID, BANK);
    expect(Array.isArray(result.resDepositTrust)).toBe(true);
  });

  it('은행 수시입출 거래내역', async () => {
    const result = await service.getBankTransactions(SANDBOX_CONNECTED_ID, {
      organization: BANK,
      account: '02004130000000',
      ...RANGE,
    });
    expect(Array.isArray(result.resTrHistoryList)).toBe(true);
  });

  it('증권 전계좌', async () => {
    const result = await service.getStockAccounts(SANDBOX_CONNECTED_ID, STOCK);
    expect(Array.isArray(result)).toBe(true);
  });

  it('증권 주식잔고', async () => {
    const result = await service.getStockBalance(SANDBOX_CONNECTED_ID, {
      organization: STOCK,
      account: '45550000',
    });
    expect(Array.isArray(result.resItemList)).toBe(true);
  });

  it('카드 보유카드', async () => {
    const result = await service.getCards(SANDBOX_CONNECTED_ID, CARD);
    expect(Array.isArray(result)).toBe(true);
  });

  it('카드 승인내역', async () => {
    const result = await service.getCardApprovals(SANDBOX_CONNECTED_ID, {
      organization: CARD,
      ...RANGE,
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it('카드 청구내역', async () => {
    const result = await service.getCardBillings(SANDBOX_CONNECTED_ID, {
      organization: CARD,
      month: '202609',
    });
    expect(Array.isArray(result)).toBe(true);
  });
});
