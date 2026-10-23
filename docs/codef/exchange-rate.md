# CODEF 환율조회

하나은행 고시 환율을 조회한다. 로그인이 필요 없어 커넥티드 아이디 없이 호출한다.

- 메소드: `getExchangeRates(date?)` — `date`(YYYYMMDD)를 생략하면 오늘의 최종 고시 환율
- 외화 예금, 해외주식 같은 외화 자산을 원화로 환산하는 데 쓰므로 **매매기준율**(`resAmount3`)만 수집한다.
- 응답의 `resDetailList` 는 `{ currency: "USD", currencyName: "미국 USD", baseRate: 1363.9 }` 형태로 바꿔서 돌려준다. `resAmount3` 이라는 키만으로는 의미를 알 수 없어서다.

표의 **전송** 열은 `CodefConnectionService` 가 요청에 넣는 파라미터, **수집** 열은 응답에서 남기는 필드다.
수집하지 않는 필드는 Zod 스키마(`apps/api/src/external-connection/codef/codef.schemas.ts`)에 정의하지 않아 파싱할 때 버려진다.
금액·수량·비율 필드는 `"1,234"` 같은 문자열에서 숫자로 바꾸고, 빈 값은 `null` 로 둔다.

## 환율조회 (`KR_BK_1_A_001`)

- 엔드포인트: `POST /v1/kr/bank/a/exchangerate/check`

> 이 API는 하나은행에서 은행의 환율 정보를 조회하는 서비스입니다. 환전 예상금액 확인, 외화 매매기준율 조회 등 다양한 자산관리·가계부 서비스에 활용할 수 있습니다. 사용자 인증이 요구되지 않는 비로그인 서비스입니다.
> 환율을 조회합니다

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O | 0081(하나은행) 고정 | ✅ |
| `date` | 일자 |  | YYYYMMDD (default : TODAY) | ✅ |
| `searchGbn` | 조회구분 |  | [고시회차] "0":현재(최종), "1":최초, "2":특정회차 (default : 0) |  |
| `roundNo` | 회차 |  | searchGbn="2"일 때 입력 조회할 회차 |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resDate` | 일자 | O | [고시일자] YYYYMMDD | ✅ |
| `resTime` | 시간 | O | [고시시간] hhmmss | ✅ |
| `resRoundNo` | 회차 | O | (ex. "166") | ✅ |
| `resDate1` | 일자1 | O | [조회일자] YYYYMMDD |  |
| `resTime1` | 시간1 | O | [조회시간] hhmmss |  |
| `resDetailList` | 상세내역 List | O |  | ✅ |
| 　└ `resAccountCurrency` | 통화 | O | (ex. "미국 USD") | ✅ |
| 　└ `resExchangeRate` | 환율 | O | [현찰 사실때 환율] (ex."1,387.76") |  |
| 　└ `resCommissionRate` | 수수료율 | O | [현찰 사실때 Spread] (ex."1.75") |  |
| 　└ `resExchangeRate1` | 환율1 | O | [현찰 파실때 환율] (ex."1,340.04") |  |
| 　└ `resCommissionRate1` | 수수료율1 | O | [현찰 파실때 Spread] (ex."1.75") |  |
| 　└ `resAmount` | 금액 | O | [송금 보낼때] (ex."1,377,20") |  |
| 　└ `resAmount1` | 금액1 | O | [송금 받을때] (ex."1,350.60") |  |
| 　└ `resAmount2` | 금액2 | O | [외화 수표 파실때] (ex."1,348.09") |  |
| 　└ `resAmount3` | 금액3 | O | [매매 기준율] (ex."1,363.90") | ✅ |
| 　└ `resCommissionRate2` | 수수료율2 | O | [환가료율] (ex."6.63385") |  |
| 　└ `resCommissionRate3` | 수수료율3 | O | [미화 환산율] (ex."1.0000") |  |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resDate": "YYYYMMDD",
    "resTime": "hhmmss",
    "resRoundNo": "166",
    "resDate1": "YYYYMMDD",
    "resTime1": "hhmmss",
    "resDetailList": [
        {
            "resAccountCurrency": "미국 USD",
            "resExchangeRate": "1,387.76",
            "resCommissionRate": "1.75",
            "resExchangeRate1": "1,340.04",
            "resCommissionRate1": "1.75",
            "resAmount": "1,377.20",
            "resAmount1": "1,350.60",
            "resAmount2": "1,348.09",
            "resAmount3": "1,363.90",
            "resCommissionRate2": "6.63385",
            "resCommissionRate3": "1.0000"
        }
    ]
}
```

</details>
