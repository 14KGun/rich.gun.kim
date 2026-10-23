# CODEF 은행 (개인)

은행 개인 상품 6종의 명세. 이 프로젝트에서는 **보유계좌**와 **수시입출 거래내역**만 쓴다.

| 상품 | 사용 | 메소드 / 쓰지 않는 이유 |
|---|---|---|
| 보유계좌 | ✅ | `getBankAccounts(connectedId, organization)` — 계좌별 잔고 스냅샷 |
| 수시입출 거래내역 | ✅ | `getBankTransactions(connectedId, { organization, account, startDate, endDate })` — 거래 후 잔액으로 잔고 추이 복원 |
| 적금 거래내역 | | 보유계좌 잔액을 매일 쌓으면 추이가 나온다 |
| 대출 거래내역 | | 대출 잔액은 보유계좌의 `resLoan` 으로 온다 |
| 빠른조회 | | 수시입출 거래내역과 겹친다. 인증서 없이 아이디로 조회하는 대안이다 |
| 등록여부 | | 연결 상태 점검용. 필요해지면 추가한다 |

표의 **전송** 열은 `CodefConnectionService` 가 요청에 넣는 파라미터, **수집** 열은 응답에서 남기는 필드다.
수집하지 않는 필드는 Zod 스키마(`apps/api/src/external-connection/codef/codef.schemas.ts`)에 정의하지 않아 파싱할 때 버려진다.
금액·수량·비율 필드는 `"1,234"` 같은 문자열에서 숫자로 바꾸고, 빈 값은 `null` 로 둔다.

- 보유계좌의 보험(`resInsurance`)은 잔고가 아니라 보험료라서 수집하지 않는다.
- 거래내역의 비고(`resAccountDesc1~4`: 보낸분·받는분, 적요, 거래점)는 지출 분석용 데이터라 수집하지 않는다. 지출은 카드 승인내역과 뱅크샐러드가 맡는다.
- 거래내역은 계좌 하나씩 호출한다. 보유계좌에서 `resAccountDeposit` 이 `10`·`11` 인 계좌만 조회하면 된다.

## 보유계좌 (`KR_BK_1_P_001`)

- 엔드포인트: `POST /v1/kr/bank/p/account/account-list`

> 이 API는 국내 개인뱅킹 보유계좌 및 잔액 정보를 조회하는 서비스입니다. 예금·적금 계좌 잔액 조회, 외화·펀드·보험 계좌 확인 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 | O |  | ✅ |
| `birthDate` | 생년월일 |  | [아이디 로그인] 추가정보 |  |
| `withdrawAccountNo` | 출금계좌번호 |  | 대구은행 [아이디 로그인] 추가정보 |  |
| `withdrawAccountPassword` | 출금계좌비밀번호 |  | 대구은행 [아이디 로그인] 추가정보, RSA암호화된 비밀번호 |  |
| `timeOut` | 제한시간 |  |  |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resDepositTrust` | 예금/신탁 | O |  | ✅ |
| 　└ `resOverdraftAcctYN` | 마이너스 통장 여부 | O | 0: false, 1: true | ✅ |
| 　└ `resAccountDisplay` | 계좌번호_표시용 | O |  | ✅ |
| 　└ `resLastTranDate` | 최종거래일 |  |  | ✅ |
| 　└ `resAccountLifetime` | 평생계좌번호 |  |  |  |
| 　└ `resAccountEndDate` | 만기일 |  |  | ✅ |
| 　└ `resAccountStartDate` | 신규일 | O |  | ✅ |
| 　└ `resAccountNickName` | 계좌별칭 |  |  | ✅ |
| 　└ `resAccountCurrency` | 통화코드 | O | KRW: 한국원화, JPY: 일본 엔, USD: 미국 달러, EUR: 유로... ( ISO 4217 코드) | ✅ |
| 　└ `resAccountBalance` | 현재잔액 | O |  | ✅ |
| 　└ `resAccount` | 계좌번호 | O |  | ✅ |
| 　└ `resAccountDeposit` | 예금구분 | O | 10: 미분류 (수시입출 구분안됨) 11:수시입출, 12: 정기/적금 (저축성), 13:신탁, 14: 미분류 (적금 or 신탁) | ✅ |
| 　└ `resAccountName` | 계좌명(종류) | O |  | ✅ |
| `resForeignCurrency` | 외화 | O |  | ✅ |
| 　└ `resAccountDisplay` | 계좌번호_표시용 | O |  | ✅ |
| 　└ `resAccountCurrency` | 통화코드 | O | KRW: 한국원화, JPY: 일본 엔, USD: 미국 달러, EUR: 유로... ( ISO 4217 코드) | ✅ |
| 　└ `resLastTranDate` | 최종거래일 |  |  | ✅ |
| 　└ `resAccountEndDate` | 만기일 |  |  | ✅ |
| 　└ `resAccountStartDate` | 신규일 |  |  | ✅ |
| 　└ `resAccountBalance` | 현재잔액 | O |  | ✅ |
| 　└ `resAccountNickName` | 계좌별칭 |  |  | ✅ |
| 　└ `resAccount` | 계좌번호 | O |  | ✅ |
| 　└ `resAccountName` | 계좌명(종류) | O |  | ✅ |
| 　└ `resAccountDeposit` | 예금구분 | O | 20:외화 | ✅ |
| `resFund` | 펀드 | O |  | ✅ |
| 　└ `resAccountDisplay` | 계좌번호_표시용 | O |  | ✅ |
| 　└ `resEarningsRate` | 수익률 [%] | O |  | ✅ |
| 　└ `resAccountInvestedCost` | 투자원금 | O |  | ✅ |
| 　└ `resAccountCurrency` | 통화코드 | O | KRW: 한국원화, JPY: 일본 엔, USD: 미국 달러, EUR: 유로... ( ISO 4217 코드) | ✅ |
| 　└ `resAccountBalance` | 현재잔액 | O | 평가금액 | ✅ |
| 　└ `resAccountEndDate` | 만기일 |  |  | ✅ |
| 　└ `resAccountStartDate` | 신규일 | O |  | ✅ |
| 　└ `resAccountNickName` | 계좌별칭 |  |  | ✅ |
| 　└ `resAccount` | 계좌번호 | O |  | ✅ |
| 　└ `resAccountName` | 계좌명(종류) | O |  | ✅ |
| 　└ `resAccountDeposit` | 예금구분 | O | 30:펀드 | ✅ |
| `resLoan` | 대출 | O |  | ✅ |
| 　└ `resAccountDisplay` | 계좌번호_표시용 | O |  | ✅ |
| 　└ `resAccountLoanExecNo` | 대출실행번호 |  |  | ✅ |
| 　└ `resAccountCurrency` | 통화코드 | O | KRW: 한국원화, JPY: 일본 엔, USD: 미국 달러, EUR: 유로... ( ISO 4217 코드) | ✅ |
| 　└ `resAccountBalance` | 현재잔액 | O |  | ✅ |
| 　└ `resAccountEndDate` | 만기일 |  |  | ✅ |
| 　└ `resAccountStartDate` | 신규일 |  |  | ✅ |
| 　└ `resAccount` | 계좌번호 | O |  | ✅ |
| 　└ `resAccountNickName` | 계좌별칭 |  |  | ✅ |
| 　└ `resAccountName` | 계좌명(종류) | O |  | ✅ |
| 　└ `resAccountDeposit` | 예금구분 | O | 40:대출 | ✅ |
| `resInsurance` | 보험 | O |  |  |
| 　└ `resAccountDisplay` | 계좌번호_표시용 | O |  | ✅ |
| 　└ `resAccountEndDate` | 만기일 |  |  | ✅ |
| 　└ `resAccountBalance` | 현재잔액 | O | 보험료 | ✅ |
| 　└ `resAccountStartDate` | 신규일 | O | 계약일자 | ✅ |
| 　└ `resAccount` | 계좌번호 | O | 증권번호 | ✅ |
| 　└ `resAccountNickName` | 계좌별칭 | O | 보험사명 | ✅ |
| 　└ `resAccountName` | 계좌명(종류) | O | 상품명 | ✅ |
| 　└ `resAccountDeposit` | 예금구분 | O | 50:보험 | ✅ |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resDepositTrust": [
        {
            "resOverdraftAcctYN": "0",
            "resAccountDisplay": "020-0420-0000-000",
            "resLastTranDate": "",
            "resAccountLifetime": "",
            "resAccountEndDate": "",
            "resAccountStartDate": "",
            "resAccountNickName": "",
            "resAccountCurrency": "KRW",
            "resAccountBalance": "",
            "resAccount": "02004200000000",
            "resAccountDeposit": "",
            "resAccountName": "입출금통장"
        }
    ],
    "resForeignCurrency": [
        {
            "resAccountDisplay": "020-0420-0000-000",
            "resAccountCurrency": "KRW",
            "resLastTranDate": "",
            "resAccountEndDate": "",
            "resAccountStartDate": "",
            "resAccountBalance": "",
            "resAccountNickName": "",
            "resAccount": "02004200000000",
            "resAccountName": "입출금통장",
            "resAccountDeposit": ""
        }
    ],
    "resFund": [
        {
            "resAccountDisplay": "020-0420-0000-000",
            "resEarningsRate": "5.45",
            "resAccountInvestedCost": "",
            "resAccountCurrency": "KRW",
            "resAccountBalance": "",
            "resAccountEndDate": "",
            "resAccountStartDate": "",
            "resAccountNickName": "",
            "resAccount": "02004200000000",
            "resAccountName": "입출금통장",
            "resAccountDeposit": ""
        }
    ],
    "resLoan": [
        {
            "resAccountDisplay": "020-0420-0000-000",
            "resAccountLoanExecNo": "",
            "resAccountCurrency": "KRW",
            "resAccountBalance": "",
            "resAccountEndDate": "",
            "resAccountStartDate": "",
            "resAccount": "02004200000000",
            "resAccountNickName": "",
            "resAccountName": "입출금통장",
            "resAccountDeposit": ""
        }
    ],
    "resInsurance": [
        {
            "resAccountDisplay": "020-0420-0000-000",
            "resAccountEndDate": "",
            "resAccountBalance": "",
            "resAccountStartDate": "",
            "resAccount": "02004200000000",
            "resAccountNickName": "",
            "resAccountName": "입출금통장",
            "resAccountDeposit": ""
        }
    ]
}
```

</details>

## 수시입출 거래내역 (`KR_BK_1_P_002`)

- 엔드포인트: `POST /v1/kr/bank/p/account/transaction-list`

> 이 API는 국내 개인뱅킹 수시입출 계좌에 대한 거래내역을 조회하는 서비스입니다. 입출금 거래내역 조회, 계좌 잔액 확인 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 | O |  | ✅ |
| `account` | 계좌번호 | O | 숫자만 입력 | ✅ |
| `startDate` | 시작일자 | O |  | ✅ |
| `endDate` | 종료일자 | O |  | ✅ |
| `orderBy` | 일자정렬순서 | O | "0" : 최신순, "1": 과거순 (default: "0") | ✅ |
| `inquiryType` | 조회구분 |  | [계좌상세포함여부] "0":미포함, "1":포함 ( default: "1") | ✅ |
| `accountPassword` | 계좌비밀번호 |  | RSA암호화된 비밀번호 |  |
| `birthDate` | 생년월일 |  | [아이디 로그인] 추가정보 |  |
| `timeOut` | 제한시간 |  |  |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resAccountBalance` | 현재잔액 | O |  |  |
| `resWithdrawalAmt` | 출금가능금액 |  |  |  |
| `resAccount` | 계좌번호 | O |  |  |
| `resAccountNickName` | 계좌별칭 |  |  |  |
| `resAccountStartDate` | 신규일 | O |  |  |
| `resLastTranDate` | 최종거래일 | O |  |  |
| `resLoanLimitAmt` | 대출한도 |  |  |  |
| `resAccountName` | 계좌명(종류) | O |  |  |
| `resAccountHolder` | 예금주 | O |  |  |
| `resManagementBranch` | 관리지점 | O |  |  |
| `resInterestRate` | 대출이율 |  |  |  |
| `resAccountDisplay` | 계좌번호_표시용 | O |  |  |
| `resLoanEndDate` | 대출만기일 |  |  |  |
| `resAccountStatus` | 계좌상태 | O | ex)정상, 잡좌(휴면) |  |
| `commStartDate` | 시작일자 | O | 요청일 기준 최대 조회 가능시작일, YYYYMMDD | ✅ |
| `commEndDate` | 종료일자 | O | YYYYMMDD | ✅ |
| `resTrHistoryList` | 거래내역 반복부 키 | O |  | ✅ |
| 　└ `resAccountTrTime` | 거래시각 | O | hhmmss | ✅ |
| 　└ `resAccountOut` | 출금금액 | O |  | ✅ |
| 　└ `resAccountIn` | 입금금액 | O |  | ✅ |
| 　└ `resAfterTranBalance` | 거래후 잔액 | O |  | ✅ |
| 　└ `resAccountDesc1` | 거래내역 비고1 |  | [보낸분/받는분] |  |
| 　└ `resAccountDesc2` | 거래내역 비고2 |  | [거래구분/메모] |  |
| 　└ `resAccountDesc3` | 거래내역 비고3 |  | [적요] |  |
| 　└ `resAccountDesc4` | 거래내역 비고4 |  | [거래점] |  |
| 　└ `resAccountTrDate` | 거래일자 | O | yyyyMMdd | ✅ |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
  "resAccountBalance": "546",
  "resWithdrawalAmt": "546",
  "resAccount": "02004130000000",
  "resAccountNickName": "",
  "resAccountStartDate": "20081224",
  "resLastTranDate": "20190624",
  "resLoanLimitAmt": "",
  "resAccountName": "",
  "resAccountHolder": "",
  "resManagementBranch": "여의도지점",
  "resInterestRate": "",
  "resAccountDisplay": "020-0413-0000-000",
  "resLoanEndDate": "",
  "resAccountStatus": "",
  "commStartDate": "",
  "commEndDate": "",
  "resTrHistoryList": [
    {
      "resAccountTrTime": "004219",
      "resAccountOut": "0",
      "resAccountIn": "1",
      "resAfterTranBalance": "11517",
      "resAccountDesc1": "",
      "resAccountDesc2": "이자원가",
      "resAccountDesc3": "(이자:1세금:0)",
      "resAccountDesc4": "여의도지점",
      "resAccountTrDate": "20160125"
    }
  ]
}
```

</details>

## 적금 거래내역 (`KR_BK_1_P_003`)

- 엔드포인트: `POST /v1/kr/bank/p/installment-savings/transaction-list`
- 이 프로젝트에서는 쓰지 않는다. 참고용으로 명세만 남긴다.

> 이 API는 국내 개인뱅킹 적금 계좌에 대한 거래내역을 조회하는 서비스입니다. 적금 납입내역 확인, 만기·이율 조회 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `organization` | 기관코드 | O |  |
| `connectedId` | 커넥티드 아이디 | O |  |
| `account` | 계좌번호 | O | 숫자만 입력 |
| `startDate` | 시작일자 | O |  |
| `endDate` | 종료일자 | O |  |
| `orderBy` | 일자정렬순서 | O | "0" : 최신순, "1": 과거순 (default:"0") |
| `inquiryType` | 조회구분 |  | "0" : 계좌상세내역 미포함 |
| `birthDate` | 생년월일 |  | [아이디 로그인] 추가정보 |
| `timeOut` | 제한시간 |  |  |

### 출력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `resAccountStatus` | 계좌상태 | O |  |
| `resAccount` | 계좌번호 | O |  |
| `resAccountDisplay` | 계좌번호_표시용 | O |  |
| `resAccountName` | 계좌명(종류) | O |  |
| `resAccountNickName` | 계좌별칭 |  |  |
| `resAccountHolder` | 예금주 | O |  |
| `resFinalRoundNo` | 최종회차 |  |  |
| `resAccountStartDate` | 신규일 | O | YYYYMMDD |
| `resAccountEndDate` | 만기일 |  | YYYYMMDD |
| `resAccountBalance` | 현재잔액 | O |  |
| `resMonthlyPayment` | 월부금 |  |  |
| `resValidPeriod` | 유효기간 | O | MM (계약기간) |
| `resType` | 구분 | O | (과세적용구분) |
| `resManagementBranch` | 관리지점 | O |  |
| `resRate` | 이율 |  | (적용이율) |
| `resContractAmount` | 계약금액 |  |  |
| `resPaymentMethods` | 납입방법 |  |  |
| `resLastTranDate` | 최종거래일 | O | YYYYMMDD |
| `commStartDate` | 시작일자 | O | (요청일 기준 최대 조회 가능시작일, YYYYMMDD) |
| `commEndDate` | 종료일자 | O | (YYYYMMDD) |
| `resTrHistoryList` | 거래내역 반복부 키 | O |  |
| 　└ `resRoundNo` | 회차 |  |  |
| 　└ `resMonth` | 월분 |  | MM |
| 　└ `resAccountTrDate` | 거래일자 |  | YYYYMMDD |
| 　└ `resAccountIn` | 입금금액 | O |  |
| 　└ `resAccountDesc1` | 거래내역 비고1 |  | 적요 |
| 　└ `resAccountDesc2` | 거래내역 비고2 |  | - |
| 　└ `resAccountDesc3` | 거래내역 비고3 |  | - |
| 　└ `resAccountDesc4` | 거래내역 비고4 |  | 거래점 |
| 　└ `resAfterTranBalance` | 거래후 잔액 |  |  |

## 대출 거래내역 (`KR_BK_1_P_004`)

- 엔드포인트: `POST /v1/kr/bank/p/loan/transaction-list`
- 이 프로젝트에서는 쓰지 않는다. 참고용으로 명세만 남긴다.

> 이 API는 국내 개인뱅킹 대출 계좌에 대한 거래내역을 조회하는 서비스입니다. 대출 잔액 조회, 거래 내역 조회 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `organization` | 기관코드 | O |  |
| `connectedId` | 커넥티드 아이디 | O |  |
| `account` | 계좌번호 | O |  |
| `startDate` | 시작일자 | O |  |
| `endDate` | 종료일자 | O |  |
| `orderBy` | 일자정렬순서 | O | "0": 최신순, "1": 과거순 (default:"0") |
| `inquiryType` | 조회구분 |  | "0": 계좌상세내역 미포함, 빈값 입력 시 포함 |
| `accountLoanExecNo` | 대출실행번호 |  | 보유계좌 조회 결과에서 대출실행번호 있을 경우 입력 필수 |
| `birthDate` | 생년월일 |  | YYYYMMDD, [아이디 로그인] 추가정보 |
| `timeOut` | 제한시간 |  |  |

### 출력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `resAccount` | 계좌번호 | O |  |
| `resAccountStartDate` | 신규일 | O | YYYYMMDD |
| `resAccountEndDate` | 만기일 | O | YYYYMMDD |
| `resAccountHolder` | 예금주 | O |  |
| `resDatePayment` | 납부일자 |  |  |
| `resPrincipal` | 대출원금 | O | 약정금액 |
| `resAccountDisplay` | 계좌번호_표시용 | O |  |
| `resLoanKind` | 대출종류 | O |  |
| `resLoanBalance` | 대출잔액 | O |  |
| `resState` | 연체여부 | O |  |
| `resRate` | 이율 | O | 약정이율 |
| `commStartDate` | 시작일자 | O | 요청일 기준 최대 조회 가능시작일, YYYYMMDD |
| `commEndDate` | 종료일자 | O | YYYYMMDD |
| `resTrHistoryList` | 거래내역 반복부 키 | O |  |
| 　└ `commStartDate` | 이자시작일 |  | YYYYMMDD |
| 　└ `commEndDate` | 이자종료일 |  | YYYYMMDD |
| 　└ `resAccountTrDate` | 거래일자 | O | YYYYMMDD |
| 　└ `resTransTypeNm` | 거래구분 | O |  |
| 　└ `resTranAmount` | 거래금액 | O |  |
| 　└ `resPrincipal` | 원금 | O | [거래원금] |
| 　└ `resInterest` | 이자금액 | O |  |
| 　└ `resInterestRate` | 대출이율 |  | % |
| 　└ `resType` | 구분 |  | 이자종류 |
| 　└ `resLoanBalance` | 대출잔액 | O |  |

## 빠른조회 (`KR_BK_1_P_005`)

- 엔드포인트: `POST /v1/kr/bank/p/fast-account/transaction-list`
- 이 프로젝트에서는 쓰지 않는다. 참고용으로 명세만 남긴다.

> 이 API는 국내 개인뱅킹 계좌에 대한 빠른 거래내역을 조회하는 서비스입니다. 인증서 없이 계좌 잔액 확인, 간편 거래내역 조회 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 인증 방식은 아이디 로그인을 지원합니다. 씨티은행 이용 시 SMS 추가 인증 절차가 진행됩니다.
> 빠른 조회는 인증서 정보 없이 간편하게 계좌 정보를 조회할 수 있습니다. 빠른 조회 서비스를 이용하려면 엔드 유저가 각 은행 빠른 조회 서비스에 가입해야 합니다. 빠른 조회는 수시입출 계좌 기반입니다. 적금 및 외화계좌 조회 불가합니다. 씨티은행은 추가 인증이 필요합니다. 씨티은행 빠른 조회 추가 인증 방법은 페이지 하단에서 소개합니다.

### 입력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `organization` | 기관코드 | O |  |
| `id` | 아이디 |  |  |
| `password` | 비밀번호 |  | RSA암호화된 비밀번호 |
| `fastId` | 조회전용 아이디 |  | 안전계좌번호 |
| `fastPassword` | 조회전용 비밀번호 |  | 안전계좌비밀번호, RSA암호화된 비밀번호 |
| `account` | 계좌번호 |  | 숫자만 입력 |
| `accountPassword` | 계좌비밀번호 |  | RSA암호화된 비밀번호 |
| `startDate` | 시작일자 | O |  |
| `endDate` | 종료일자 | O |  |
| `orderBy` | 일자정렬순서 | O | "0" : 최신순, "1": 과거순 |
| `identity` | 사용자 주민번호/사업자 번호 |  | (개인/개인사업자) 생년월일 6자리 (YYMMDD) |
| `smsAuthNo` | SMS 인증번호 |  | "USER_CANCEL" : 취소, [씨티은행 등록된 전화번호 표시됨(UI 표시 권장)] |

### 출력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `resAccountBalance` | 현재잔액 | O |  |
| `resWithdrawalAmt` | 출금가능금액 |  |  |
| `commStartDate` | 시작일자 | O | 요청일 기준 최대 조회 가능시작일, YYYYMMDD |
| `commEndDate` | 종료일자 | O | YYYYMMDD |
| `resTrHistoryList` | 거래내역 반복부 키 | O |  |
| 　└ `resAccountTrDate` | 거래일자 | O |  |
| 　└ `resAccountTrTime` | 거래시각 | O |  |
| 　└ `resAccountOut` | 출금금액 |  |  |
| 　└ `resAccountIn` | 입금금액 |  |  |
| 　└ `resAccountDesc1` | 거래내역 비고1 |  | [보낸분/받는분] |
| 　└ `resAccountDesc2` | 거래내역 비고2 |  | [거래구분/메모] |
| 　└ `resAccountDesc3` | 거래내역 비고3 |  | [적요] |
| 　└ `resAccountDesc4` | 거래내역 비고4 |  | [거래점] |
| 　└ `resAfterTranBalance` | 거래후 잔액 | O |  |

## 등록여부 (`KR_BK_1_P_006`)

- 엔드포인트: `POST /v1/kr/bank/p/user/registration-status`
- 이 프로젝트에서는 쓰지 않는다. 참고용으로 명세만 남긴다.

> 이 API는 국내 개인뱅킹 계정 등록 여부를 조회하는 서비스입니다. 계정 연동상태 확인, 재등록 필요 여부 판단 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `connectedId` | 커넥티드 아이디 | O |  |
| `organization` | 기관코드 | O |  |
| `birthDate` | 생년월일 |  | [아이디 로그인] 추가정보 |
| `timeOut` | 제한시간 |  |  |

### 출력

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `resRegistrationStatus` | 등록여부 | O | [(계정)등록여부], 0: false, 1: true (Boolean to Number) |
| `resResultDesc` | 결과 메시지 |  | 미등록 사유 |
