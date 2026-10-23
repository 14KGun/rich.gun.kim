# CODEF 증권

증권사 상품의 명세. 증권은 계정 등록 시 고객 구분(`clientType`)이 통합(`A`)이다.

| 상품 | 사용 | 메소드 / 쓰지 않는 이유 |
|---|---|---|
| 전계좌 | ✅ | `getStockAccounts(connectedId, organization)` — 계좌별 예수금·평가금액·수익률 |
| 주식잔고조회 | ✅ | `getStockBalance(connectedId, { organization, account, accountPassword? })` — 종목별 보유수량·평가금액 |
| 종합자산 | | 주식잔고조회에 펀드·CMA 등 다른 상품 유형까지 포함한 것. 주식 외 상품이 필요해지면 검토한다 |
| 입출금내역 | | 잔고는 전계좌 스냅샷으로 충분하다 |

표의 **전송** 열은 `CodefConnectionService` 가 요청에 넣는 파라미터, **수집** 열은 응답에서 남기는 필드다.
수집하지 않는 필드는 Zod 스키마(`apps/api/src/external-connection/codef/codef.schemas.ts`)에 정의하지 않아 파싱할 때 버려진다.
금액·수량·비율 필드는 `"1,234"` 같은 문자열에서 숫자로 바꾸고, 빈 값은 `null` 로 둔다.

- 계좌 비밀번호(`accountPassword`)는 공개키로 RSA 암호화해서 보낸다.

## 전계좌 (`KR_ST_A_001`)

- 엔드포인트: `POST /v1/kr/stock/a/account/account-list`

> 이 API는 국내 주요 증권사 대상으로 전계좌 목록을 조회하는 서비스입니다. 계좌유형·계좌별칭 확인, 예수금·평가금액·수익률 확인 등 다양한 증권 전계좌 조회 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 | O |  | ✅ |
| `id` | 복수계정 아이디 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |  |
| `add_password` | 복수계정 패스워드 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resDepositReceivedF` | 외화예수금 |  |  | ✅ |
| `resDepositReceivedD2` | 예수금(D+2) |  |  | ✅ |
| `resDepositReceivedD1` | 예수금(D+1) |  |  |  |
| `resLoanAmt` | 대출금액 |  |  | ✅ |
| `resValuationPL` | 평가손익 |  |  | ✅ |
| `resValuationAmt` | 평가금액 |  |  | ✅ |
| `resDepositReceived` | 예수금 |  |  | ✅ |
| `resPurchaseAmount` | 매입금액 |  |  | ✅ |
| `resAccountDisplay` | 계좌번호_표시용 | O |  | ✅ |
| `resPrincipal` | 원금 |  | (총잔고) |  |
| `resEarningsRate` | 수익률 [%] |  |  | ✅ |
| `resAccountName` | 계좌명(유형) | O | 계좌유형 | ✅ |
| `resWithdrawalAmt` | 출금가능금액 |  |  |  |
| `resAccountNickName` | 계좌별칭 |  |  | ✅ |
| `resAccount` | 계좌번호 | O |  | ✅ |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resDepositReceivedF": "",
    "resDepositReceivedD2": "",
    "resDepositReceivedD1": "",
    "resLoanAmt": "",
    "resValuationPL": "",
    "resValuationAmt": "",
    "resDepositReceived": "",
    "resPurchaseAmount": "",
    "resAccountDisplay": "4555-****",
    "resPrincipal": "",
    "resEarningsRate": "",
    "resAccountName": "위탁",
    "resWithdrawalAmt": "",
    "resAccountNickName": "",
    "resAccount": "4555****"
}
```

</details>

## 주식잔고조회 (`KR_ST_A_011`)

- 엔드포인트: `POST /v1/kr/stock/a/account/balance-inquiry`

> 이 API는 국내 주요 증권사 대상으로 계좌의 주식잔고를 조회하는 서비스입니다. 국내·해외주식 종목별 보유수량·평가금액 확인, 매입금액·수익률 확인 등 다양한 주식잔고조회 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 | O |  | ✅ |
| `account` | 계좌번호 | O | 숫자만 입력 | ✅ |
| `accountPassword` | 계좌비밀번호 |  |  | ✅ |
| `id` | 복수계정 아이디 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |  |
| `add_password` | 복수계정 패스워드 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resAccount` | 계좌번호 | O |  | ✅ |
| `resDepositReceived` | 예수금 |  |  | ✅ |
| `resDepositReceivedD1` | 예수금(D+1) |  |  |  |
| `resDepositReceivedD2` | 예수금(D+2) |  |  | ✅ |
| `resDepositReceivedF` | 외화예수금 |  | [원화환산 외화예수금] | ✅ |
| `resDepositReceivedFList` | 외화예수금 반복부 키 | O | [통화별 외화예수금] |  |
| 　└ `resAmount` | 금액 | O |  |  |
| 　└ `resAccountCurrency` | 통화코드 | O |  | ✅ |
| `resItemList` | 종목별상세 반복부 키 | O |  | ✅ |
| 　└ `resProductType` | 상품유형 | O | (주식, 해외주식) |  |
| 　└ `resProductTypeCd` | 상품유형코드 | O | (01: 주식, 04: 해외주식) | ✅ |
| 　└ `resItemName` | 상품/종목명 | O |  | ✅ |
| 　└ `resItemCode` | 상품/종목코드 | O |  | ✅ |
| 　└ `resBalanceType` | 잔고유형 | O |  |  |
| 　└ `resQuantity` | 수량 | O | [보유수량] | ✅ |
| 　└ `resSettleQuantity` | 정산수량 |  |  |  |
| 　└ `resPresentAmt` | 현재가 | O |  | ✅ |
| 　└ `resAvgPresentAmt` | 평균매입가 |  |  | ✅ |
| 　└ `resPurchaseAmount` | 매입금액 | O |  | ✅ |
| 　└ `resValuationAmt` | 평가금액 | O |  | ✅ |
| 　└ `resValuationPL` | 평가손익 | O |  | ✅ |
| 　└ `resEarningsRate` | 수익률 | O |  | ✅ |
| 　└ `resAccountCurrency` | 통화코드 | O |  | ✅ |
| 　└ `resAccountEx` | 계좌번호 확장 |  |  |  |
| 　└ `resResultCode` | 결과코드 | O | [상품유형별 메뉴조회결과] 0: false, 1: true |  |
| 　└ `resResultDesc` | 결과 메시지 |  | [처리결과] |  |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resAccount": "",
    "resDepositReceived": "",
    "resDepositReceivedD1": "",
    "resDepositReceivedD2": "",
    "resDepositReceivedF": "",
    "resDepositReceivedFList": [
        {
            "resAmount": "",
            "resAccountCurrency": ""
        }
    ],
    "resItemList": [
        {
            "resProductType": "",
            "resProductTypeCd": "",
            "resItemName": "",
            "resItemCode": "",
            "resBalanceType": "",
            "resQuantity": "",
            "resSettleQuantity": "",
            "resPresentAmt": "",
            "resAvgPresentAmt": "",
            "resPurchaseAmount": "",
            "resValuationAmt": "",
            "resValuationPL": "",
            "resEarningsRate": "",
            "resAccountCurrency": "",
            "resAccountEx": "",
            "resResultCode": "",
            "resResultDesc": ""
        }
    ]
}
```

</details>

## 종합자산 (`KR_ST_A_003`)

- 엔드포인트: `POST /v1/kr/stock/a/account/financial-assets`
- 이 프로젝트에서는 쓰지 않는다. 참고용으로 명세만 남긴다.

> 이 API는 국내 주요 증권사 대상으로 계좌의 종합자산 현황을 조회하는 서비스입니다. 주식·펀드·CMA 등 상품유형별 평가금액·수익률 확인, 종목별 매입금액·수량 확인 등 다양한 종합자산 조회 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `organization` | 기관코드 | O |  |
| `connectedId` | 커넥티드 아이디 | O |  |
| `account` | 계좌번호 | O | 숫자만 입력 |
| `accountPassword` | 계좌비밀번호 |  |  |
| `inquiryType` | 조회구분 |  | "0" : (주식)결제기준, "1" : 계좌비번 검증, "2" : (주식)체결기준 (default = 0) |
| `id` | 복수계정 아이디 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |
| `add_password` | 복수계정 패스워드 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |

### 출력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `resItemList` | 종목별 상세 List | O |  |
| 　└ `resResultDesc` | 결과 메시지 |  | [처리결과] |
| 　└ `resResultCode` | 결과코드 | O | [상품유형별 메뉴조회결과] 0: false, 1: true (Boolean to Number) |
| 　└ `resAccountEx` | 계좌번호 확장 |  |  |
| 　└ `resProductTypeCd` | 상품유형코드 | O | 01: 주식, 02: 펀드, 03: CMA, 04: 해외주식, 05: 신탁/퇴직연금, 06: 채권, 07: RP, 08: CD/CP, 09: ELS/DLS, 10: 해외무추얼펀드, 11: Wrap, 12: 외화RP, 13: 연금저축, 14: 선물옵션, 99: 기타 |
| 　└ `resProductType` | 상품유형 | O |  |
| 　└ `resAvgPresentAmt` | 평균매입가 |  |  |
| 　└ `resPresentAmt` | 현재가 |  |  |
| 　└ `resBalanceType` | 잔고유형 |  |  |
| 　└ `resItemName` | 상품/종목명 | O |  |
| 　└ `resValuationPL` | 평가손익 | O |  |
| 　└ `resValuationAmt` | 평가금액 | O |  |
| 　└ `resQuantity` | 수량 | O |  |
| 　└ `resPurchaseAmount` | 매입금액 | O |  |
| 　└ `resEarningsRate` | 수익률 [%] | O |  |
| 　└ `resAccountCurrency` | 통화코드 |  |  |
| 　└ `resSettleQuantity` | 정산수량 |  |  |
| 　└ `resItemCode` | 상품/종목코드 |  |  |
| `resDepositReceived` | 예수금 | O | [예수금(D+2)] 우선제공이나 기관에 따라 제공불가시 D |
| `resAccount` | 계좌번호 | O |  |

## 입출금내역 (`KR_ST_A_002`)

- 엔드포인트: `POST /v1/kr/stock/a/account/transaction-list`
- 이 프로젝트에서는 쓰지 않는다. 참고용으로 명세만 남긴다.

> 이 API는 국내 주요 증권사 대상으로 계좌의 입출금내역을 조회하는 서비스입니다. 기간별 입금·출금 거래내역 확인, 거래 후 잔액·거래일시 확인 등 다양한 증권 입출금내역 조회 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `organization` | 기관코드 | O |  |
| `connectedId` | 커넥티드 아이디 | O |  |
| `account` | 계좌번호 | O | 숫자만 입력 |
| `accountPassword` | 계좌비밀번호 |  | RSA 암호화 |
| `startDate` | 시작일자 | O |  |
| `endDate` | 종료일자 | O |  |
| `orderBy` | 일자 정렬순서 | O | "0": 최신순, "1": 과거순 (default:"0") |
| `id` | 복수계정 아이디 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |
| `add_password` | 복수계정 패스워드 |  | (키움) 복수 아이디 보유 고객의 경우 아이디+인증서 사용, (대신) 잔고조회 모듈 조회 시 또는 법인 다계좌 계정일 경우 아이디+인증서 사용 |

### 출력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `resTrHistoryList` | 거래내역 반복부 키 | O |  |
| 　└ `resAfterTranBalance` | 거래후 잔액 |  |  |
| 　└ `resAccountDesc1` | 거래내역 비고1 |  | [보낸분/받는분] |
| 　└ `resAccountDesc2` | 거래내역 비고2 |  | [거래구분] |
| 　└ `resAccountDesc3` | 거래내역 비고3 |  | [적요] |
| 　└ `resAccountDesc4` | 거래내역 비고4 |  | [거래점] |
| 　└ `resAccountIn` | 입금금액 | O |  |
| 　└ `resAccountOut` | 출금금액 | O |  |
| 　└ `resAccountTrTime` | 거래시각 |  | (HHMMSS) |
| 　└ `resAccountTrDate` | 거래일자 | O | (YYYYMMDD) |
| `resAccountHolder` | 예금주명 | O |  |
| `resAccountName` | 계좌명(유형) | O |  |
| `resWithdrawalAmt` | 출금가능금액 | O |  |
| `resAccountBalance` | 현재잔액 | O | [예수금/평가금액] |
| `resAccount` | 계좌번호 | O |  |
| `commStartDate` | 시작일자 | O | (요청일 기준 최대 조회 가능시작일, YYYYMMDD) |
| `commEndDate` | 종료일자 | O | (YYYYMMDD) |
