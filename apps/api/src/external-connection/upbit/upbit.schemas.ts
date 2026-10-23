import { z } from 'zod';

/*
 * 업비트 응답 스키마.
 * 코인 평가금액 계산(보유수량 × 현재가)에 필요한 필드만 정의한다.
 * z.object 는 정의하지 않은 키를 버린다. 필드 설명은 docs/upbit 문서를 참고한다.
 */

/** 업비트는 수량·금액을 "2.0" 같은 decimal 문자열로 준다. 숫자가 아니면 파싱에 실패한다. */
const decimal = z
  .string()
  .transform((value) => Number(value))
  .pipe(z.number().finite());

export const accountsSchema = z.array(
  z.object({
    /** 화폐 코드 (KRW, BTC, ETH …) */
    currency: z.string(),
    /** 주문 가능 수량. KRW 는 금액 */
    balance: decimal,
    /** 주문·출금 등에 묶여 있는 수량 */
    locked: decimal,
    /** 매수 평균가 (unit_currency 기준) */
    avg_buy_price: decimal,
    avg_buy_price_modified: z.boolean(),
    /** 평균가 기준 화폐 (보통 KRW) */
    unit_currency: z.string(),
  }),
);

export const marketsSchema = z.array(
  z.object({
    /** 페어 코드 (예: KRW-BTC) */
    market: z.string(),
  }),
);

export const tickersSchema = z.array(
  z.object({
    /** 페어 코드 (예: KRW-BTC) */
    market: z.string(),
    /** 현재가 */
    trade_price: z.number(),
    /** 현재가가 반영된 시각 (ms) */
    timestamp: z.number(),
  }),
);

export type UpbitAccount = z.output<typeof accountsSchema>[number];
export type UpbitTicker = z.output<typeof tickersSchema>[number];
