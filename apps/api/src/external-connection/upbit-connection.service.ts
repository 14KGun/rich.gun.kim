import { Injectable } from '@nestjs/common';
import { UpbitClient, type UpbitCredentials } from './upbit/upbit.client';
import {
  accountsSchema,
  marketsSchema,
  tickersSchema,
  type UpbitAccount,
  type UpbitTicker,
} from './upbit/upbit.schemas';

/**
 * 업비트로 코인 보유 현황과 현재가를 조회한다.
 * API Key 는 사용자마다 다르므로 호출하는 쪽이 사용자별로 저장해 두고 넘긴다.
 * 평가금액은 (balance + locked) × 현재가 로 계산한다. 각 API 명세는 docs/upbit 를 참고한다.
 */
@Injectable()
export class UpbitConnectionService {
  constructor(private readonly client: UpbitClient) {}

  /**
   * API Key 가 속한 포켓의 화폐별 보유수량과 매수 평균가 (원화 포함).
   * API Key 에 [자산조회] 권한이 있어야 하고, 호출하는 서버 IP 가 키의 허용 IP 에 등록되어 있어야 한다.
   */
  async getAccounts(credentials: UpbitCredentials): Promise<UpbitAccount[]> {
    const data = await this.client.get('/v1/accounts', {}, credentials);
    return accountsSchema.parse(data);
  }

  /**
   * 페어별 현재가 (예: ['KRW-BTC', 'KRW-ETH']). 인증이 필요 없다.
   * 업비트에 없는 페어(상장 폐지 등)는 결과에서 빠진다.
   * 없는 페어가 하나라도 섞이면 업비트가 요청 전체를 404 로 거절하므로, 페어 목록으로 먼저 거른다.
   */
  async getTickers(markets: string[]): Promise<UpbitTicker[]> {
    if (markets.length === 0) return [];
    const listed = await this.getListedMarkets();
    const available = [...new Set(markets)].filter((market) => listed.has(market));
    if (available.length === 0) return [];

    const data = await this.client.get('/v1/ticker', { markets: available.join(',') });
    return tickersSchema.parse(data);
  }

  /** 업비트에서 거래 중인 모든 페어 코드 */
  private async getListedMarkets(): Promise<Set<string>> {
    const data = await this.client.get('/v1/market/all');
    return new Set(marketsSchema.parse(data).map(({ market }) => market));
  }
}
