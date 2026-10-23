# CODEF 연동 자료

`apps/api` 의 `CodefConnectionService` 가 쓰는 CODEF API 자료를 모아 둔 곳이다.
상품 명세는 [CODEF 개발가이드](https://developer.codef.io/)에서 2026-10-22 에 옮겨 왔다.
개발가이드가 바뀌었을 수 있으니, 구현 전에 원문을 한 번 더 확인한다.

## 이 프로젝트에서 CODEF 가 맡는 데이터

[이슈 #4](https://github.com/14KGun/rich.gun.kim/issues/4)에서 데이터 출처를 아래처럼 나눴다.

| 출처 | 데이터 |
|---|---|
| CODEF | 은행 계좌별 잔고 스냅샷과 잔고 추이, 증권 잔고, 카드 사용·청구 내역, 환율 |
| 뱅크샐러드 내보내기 | 카테고리로 분류된 지출 |
| 업비트 API | 코인 |

서비스 목적에 필요한 데이터만 수집한다. 응답 스키마에 정의하지 않은 필드는 파싱할 때 버려진다.
상대방 이름, 가맹점 주소, 결제 계좌번호 같은 값은 수집하지 않는다.

## 메소드와 CODEF 상품

| 분류 | 메소드 | CODEF 상품 | 엔드포인트 |
|---|---|---|---|
| 계정 | `createConnectedId(accounts)` | 계정 등록 | `/v1/account/create` |
| 계정 | `addAccounts(connectedId, accounts)` | 계정 추가 | `/v1/account/add` |
| 계정 | `deleteAccounts(connectedId, accounts)` | 계정 삭제 | `/v1/account/delete` |
| 계정 | `getRegisteredAccounts(connectedId)` | 계정 목록 | `/v1/account/list` |
| 은행 | `getBankAccounts(connectedId, organization)` | 보유계좌 | `/v1/kr/bank/p/account/account-list` |
| 은행 | `getBankTransactions(connectedId, params)` | 수시입출 거래내역 | `/v1/kr/bank/p/account/transaction-list` |
| 증권 | `getStockAccounts(connectedId, organization)` | 전계좌 | `/v1/kr/stock/a/account/account-list` |
| 증권 | `getStockBalance(connectedId, params)` | 주식잔고조회 | `/v1/kr/stock/a/account/balance-inquiry` |
| 카드 | `getCards(connectedId, organization)` | 보유카드 | `/v1/kr/card/p/account/card-list` |
| 카드 | `getCardApprovals(connectedId, params)` | 승인내역 | `/v1/kr/card/p/account/approval-list` |
| 카드 | `getCardBillings(connectedId, params)` | 청구내역 | `/v1/kr/card/p/account/billing-list` |
| 환율 | `getExchangeRates(date?)` | 환율조회 | `/v1/kr/bank/a/exchangerate/check` |

## 문서

- [common.md](./common.md) — 환경, 토큰, 요청·응답 형식, 오류, 커넥티드 아이디(계정 등록)
- [bank.md](./bank.md) — 은행 개인 상품 (보유계좌, 수시입출·적금·대출 거래내역, 빠른조회, 등록여부)
- [stock.md](./stock.md) — 증권 상품 (전계좌, 주식잔고조회, 종합자산, 입출금내역)
- [card.md](./card.md) — 카드 개인 상품 (보유카드, 승인내역, 청구내역)
- [exchange-rate.md](./exchange-rate.md) — 환율조회

## 설정 (환경 변수)

| 변수 | 설명 |
|---|---|
| `CODEF_ENVIRONMENT` | `sandbox` · `development`(데모, 기본값) · `production` |
| `CODEF_CLIENT_ID` | 키 관리 화면의 clientId |
| `CODEF_CLIENT_SECRET` | 키 관리 화면의 clientSecret |
| `CODEF_PUBLIC_KEY` | 키 관리 화면의 publicKey. 비밀번호 RSA 암호화에 쓴다 |

키가 없어도 앱은 뜬다. CODEF 를 실제로 호출할 때 키가 없으면 오류가 난다.

커넥티드 아이디는 환경 변수가 아니다. 사용자가 자기 기관 계정을 등록할 때마다 사용자별로 발급되므로,
`createConnectedId` 결과의 `connectedId` 를 사용자 정보와 함께 저장해 두고, 조회 메소드의 첫 인자로 넘긴다.
커넥티드 아이디만으로는 사용자가 누구인지 알 수 없으니 둘의 연결은 우리 쪽에서 관리해야 한다.

## 운영할 때 주의할 점

- **호출 빈도:** 모든 상품 문서에 "과도한 API 호출 시 대상기관으로부터 IP 가 차단될 수 있다"는 경고가 있다. 하루 한 번 정도의 배치 스냅샷으로 쓰고, 화면을 열 때마다 호출하지 않는다.
- **인증서:** 은행 개인 상품은 공동인증서 로그인만 지원한다(빠른조회 제외). 인증서를 갱신하면 계정 정보를 수정해야 한다.
- **데모 기간:** 데모(`development`) 버전은 3개월 기간 제한이 있다.

## 참고

- [CODEF API 개발가이드](https://developer.codef.io/)
- [codef-io/easycodefpy](https://github.com/codef-io/easycodefpy) — 공식 Python SDK. 호스트, 토큰 발급, 요청·응답 인코딩 방식을 확인했다
- [codef-io/codef-python](https://github.com/codef-io/codef-python) — 계정 관리 엔드포인트와 응답 예시
