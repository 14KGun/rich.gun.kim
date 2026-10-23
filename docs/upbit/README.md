# 업비트 연동 자료

`apps/api` 의 `UpbitConnectionService` 가 쓰는 업비트 Open API 자료를 모아 둔 곳이다.
명세는 [업비트 개발자 센터](https://docs.upbit.com/kr)에서 2026-10-23 에 옮겨 왔다.
조사 배경은 [이슈 #3](https://github.com/14KGun/rich.gun.kim/issues/3) 을 참고한다.

## 원문

업비트 개발자 센터의 Markdown 원문을 그대로 저장해 두었다. 이 README 는 원문에서 이 프로젝트에 필요한 내용만 추린 것이다.
각 파일 맨 위 `updatedAt` 이 업비트 쪽 마지막 수정 시각이다.

| 파일 | 원문 |
|---|---|
| [auth.md](./auth.md) | [인증](https://docs.upbit.com/kr/reference/auth) |
| [get-balance.md](./get-balance.md) | [포켓 잔고 조회](https://docs.upbit.com/kr/reference/get-balance) |
| [list-tickers.md](./list-tickers.md) | [페어 단위 현재가 조회](https://docs.upbit.com/kr/reference/list-tickers) |
| [list-trading-pairs.md](./list-trading-pairs.md) | [페어 목록 조회](https://docs.upbit.com/kr/reference/list-trading-pairs) |
| [rest-api-best-practice.md](./rest-api-best-practice.md) | [REST API 연동 Best Practice](https://docs.upbit.com/kr/docs/rest-api-best-practice) |

## 이 프로젝트에서 업비트가 맡는 데이터

코인 보유 현황과 평가금액이다. 업비트 계좌 조회에는 평가금액이 없으므로 현재가를 곱해서 계산한다.

- 평가금액 = `(balance + locked) × 현재가`
- 수익률 = `현재가 / avg_buy_price - 1`

주문 내역, 입출금 내역, 호가·캔들·WebSocket 은 쓰지 않는다.

## 메소드와 업비트 API

| 메소드 | 업비트 API | 엔드포인트 | 인증 |
|---|---|---|---|
| `getAccounts(credentials)` | 포켓 잔고 조회 | `GET /v1/accounts` | 필요 ([자산조회] 권한) |
| `getTickers(markets)` | 페어 목록 조회 → 페어 단위 현재가 조회 | `GET /v1/market/all` → `GET /v1/ticker?markets=KRW-BTC,KRW-ETH` | 필요 없음 |

호스트는 `https://api.upbit.com` 이다.

```ts
const accounts = await upbit.getAccounts({ accessKey, secretKey });
const markets = accounts
  .filter((a) => a.currency !== a.unit_currency) // 원화(KRW) 잔고 제외
  .map((a) => `${a.unit_currency}-${a.currency}`); // 예: KRW-BTC
const tickers = await upbit.getTickers(markets);
```

## API Key

- API Key 는 **사용자마다 다르다.** 각 사용자가 업비트에서 발급받아 등록하는 값이라 환경 변수로 두지 않고, 메소드 인자(`UpbitCredentials`)로 받는다.
- Access Key 와 Secret Key 쌍이다. Secret Key 는 발급할 때만 볼 수 있다.
- Secret Key 는 계좌 조회 권한이 있는 비밀값이다. 저장할 때 암호화해야 한다.
- **권한:** 계좌 조회에는 [자산조회] 권한만 있으면 된다. 주문·출금 권한은 주지 않게 안내한다. 권한이 없으면 `out_of_scope` 오류가 난다.
- **허용 IP:** 키는 등록한 IP 에서만 동작한다(키 하나에 최대 10개). 사용자가 키를 만들 때 **우리 api 서버의 공인 IP** 를 등록해야 한다. 아니면 `no_authorization_ip` 오류가 난다. 그래서 api 서버의 나가는 IP 가 고정돼 있어야 한다.
- **유효기간:** 1년이고 연장할 수 없다. 만료되면 사용자가 다시 발급해야 한다.

## 인증 (JWT)

인증이 필요한 API 는 요청마다 JWT 를 만들어 `Authorization: Bearer <JWT>` 헤더로 보낸다.
구현은 `apps/api/src/external-connection/upbit/upbit.client.ts` 에 있다.

- **헤더:** `{ "alg": "HS512", "typ": "JWT" }` (HS512 권장)
- **페이로드:**

| 키 | 설명 | 필수 |
|---|---|---|
| `access_key` | Access Key | O |
| `nonce` | 무작위 UUID. 요청마다 새로 만든다 | O |
| `query_hash` | 쿼리 문자열의 SHA512 해시(hex). 실제로 보내는 쿼리 문자열과 순서·인코딩이 같아야 한다 | 쿼리나 본문이 있을 때 |
| `query_hash_alg` | `query_hash` 알고리즘. 기본값 `SHA512` | |

- **서명:** `HMAC-SHA512(base64url(header) + "." + base64url(payload), Secret Key)`. Secret Key 는 Base64 디코딩하지 않고 그대로 쓴다.

## 포켓 잔고 조회 — `GET /v1/accounts`

API Key 가 속한 **포켓**이 보유한 자산 목록과 잔고를 돌려준다. 서브 포켓 잔고는 이 API 로 오지 않는다.
요청 제한은 포켓 단위로 초당 30회다.

| 필드 | 타입 | 설명 | 수집 |
|---|---|---|---|
| `currency` | string | 화폐 코드 (KRW, BTC …) | ✅ |
| `balance` | decimal string | 주문 가능 수량. KRW 는 금액 | ✅ (숫자로 변환) |
| `locked` | decimal string | 출금·주문 등에 묶여 있는 잔액 | ✅ (숫자로 변환) |
| `avg_buy_price` | decimal string | 매수 평균가 | ✅ (숫자로 변환) |
| `avg_buy_price_modified` | boolean | 매수 평균가 수정 여부 | ✅ |
| `unit_currency` | string | 평균가 기준 화폐 (KRW, BTC, USDT) | ✅ |

```json
[
  { "currency": "KRW", "balance": "1000000.0", "locked": "0.0", "avg_buy_price": "0", "avg_buy_price_modified": false, "unit_currency": "KRW" },
  { "currency": "BTC", "balance": "2.0", "locked": "0.0", "avg_buy_price": "140000000", "avg_buy_price_modified": false, "unit_currency": "KRW" }
]
```

## 페어 단위 현재가 조회 — `GET /v1/ticker`

- 입력: `markets` (필수) — 쉼표로 구분한 페어 목록. 예: `KRW-BTC,KRW-ETH`
- 없는 페어를 넣으면 `404` (`{"error":{"name":404,"message":"Code not found"}}`). **없는 페어가 하나라도 섞이면 요청 전체가 404 다.**
  - 상장 폐지된 코인이 계좌에 남아 있을 수 있다. 그래서 `getTickers` 는 먼저 [페어 목록 조회](https://docs.upbit.com/kr/reference/list-trading-pairs)(`GET /v1/market/all`)로 거래 중인 페어만 남기고 조회한다.
  - 걸러진 페어는 결과에 없다. 호출하는 쪽은 결과에 없는 페어를 "현재가 없음"으로 다룬다.
- 시세 API 요청 제한은 IP 단위로 초당 10회다.

| 필드 | 타입 | 설명 | 수집 |
|---|---|---|---|
| `market` | string | 페어 코드 (예: KRW-BTC) | ✅ |
| `trade_date`, `trade_time` | string | 최근 체결 일자·시각 (UTC, yyyyMMdd / HHmmss) | |
| `trade_date_kst`, `trade_time_kst` | string | 최근 체결 일자·시각 (KST) | |
| `trade_timestamp` | integer | 체결 시각 (ms) | |
| `opening_price`, `high_price`, `low_price` | number | 시가, 고가, 저가 | |
| `trade_price` | number | 현재가 | ✅ |
| `prev_closing_price` | number | 전일 종가 (UTC 0시 기준) | |
| `change` | string | `EVEN` 보합, `RISE` 상승, `FALL` 하락 | |
| `change_price`, `change_rate` | number | 전일 종가 대비 변화 (절대값) | |
| `signed_change_price`, `signed_change_rate` | number | 전일 종가 대비 변화 (부호 포함) | |
| `trade_volume` | number | 최근 거래 수량 | |
| `acc_trade_price`, `acc_trade_price_24h` | number | 누적 거래 금액 (UTC 0시 기준 / 24시간) | |
| `acc_trade_volume`, `acc_trade_volume_24h` | number | 누적 거래량 (UTC 0시 기준 / 24시간) | |
| `highest_52_week_price`, `highest_52_week_date` | number, string | 52주 신고가와 날짜 | |
| `lowest_52_week_price`, `lowest_52_week_date` | number, string | 52주 신저가와 날짜 | |
| `timestamp` | integer | 현재가 정보가 반영된 시각 (ms) | ✅ |

## 오류

2xx 가 아니면 `UpbitError` 를 던진다. `status` 는 HTTP 상태 코드, `code` 는 업비트 오류 이름이다.

```json
{ "error": { "name": "no_authorization_ip", "message": "This is not a verified IP." } }
```

- `name` 이 숫자(예: `404`)로 오거나, `message` 가 없을 때도 있다. 둘 다 처리한다.
- 자주 보는 이름: `no_authorization_token`(토큰 없음), `invalid_access_key`(키 오류), `no_authorization_ip`(허용 IP 아님), `out_of_scope`(권한 없음)
- `429` 는 요청 제한 초과다. 해당 그룹 호출을 멈추고 잠시 뒤 다시 시도해야 한다. 응답 헤더 `Remaining-Req` (예: `group=default; min=1800; sec=29`) 로 남은 횟수를 알 수 있다.

## 참고

- [인증](https://docs.upbit.com/kr/reference/auth)
- [포켓 잔고 조회](https://docs.upbit.com/kr/reference/get-balance)
- [페어 단위 현재가 조회](https://docs.upbit.com/kr/reference/list-tickers)
- [페어 목록 조회](https://docs.upbit.com/kr/reference/list-trading-pairs)
- [REST API 연동 Best Practice](https://docs.upbit.com/kr/docs/rest-api-best-practice)
