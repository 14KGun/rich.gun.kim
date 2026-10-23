# CODEF 카드 (개인)

개인 카드 상품의 명세. 카드 상품은 커넥티드 아이디 없이 로그인 정보를 직접 보내는 방식도 지원하지만, 이 프로젝트는 커넥티드 아이디 방식만 쓴다.

| 상품 | 사용 | 메소드 |
|---|---|---|
| 보유카드 | ✅ | `getCards(connectedId, organization)` |
| 승인내역 | ✅ | `getCardApprovals(connectedId, { organization, startDate, endDate })` — 전체 카드(`inquiryType: "1"`)를 한 번에 조회 |
| 청구내역 | ✅ | `getCardBillings(connectedId, { organization, month? })` — `month`(YYYYMM)를 `startDate` 로 보낸다 |

한도조회, 실적조회 상품도 있지만 지금은 쓰지 않아 명세를 옮기지 않았다.

표의 **전송** 열은 `CodefConnectionService` 가 요청에 넣는 파라미터, **수집** 열은 응답에서 남기는 필드다.
수집하지 않는 필드는 Zod 스키마(`apps/api/src/external-connection/codef/codef.schemas.ts`)에 정의하지 않아 파싱할 때 버려진다.
금액·수량·비율 필드는 `"1,234"` 같은 문자열에서 숫자로 바꾸고, 빈 값은 `null` 로 둔다.

- 가맹점 상세(사업자번호, 업종, 전화번호, 주소)는 요청하지 않는다(`memberStoreInfoType: "0"`, `memberStoreInfoYN: "0"`).
- 청구내역의 결제계좌(`resPaymentAccount`)는 계좌번호라 수집하지 않는다.

## 보유카드 (`KR_CD_P_001`)

- 엔드포인트: `POST /v1/kr/card/p/account/card-list`

> 이 API는 개인 보유카드 정보를 조회하는 서비스입니다. 보유카드 목록 확인, 카드 유효기간 조회 등 다양한 지출관리·소비분석 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 |  | 로그인 파라미터(loginType 등) 미입력 시 필수 | ✅ |
| `cardNo` | 카드번호 |  | 현대카드 아이디로그인(필수) : 인증할 카드번호 KB 카드소지확인 인증이 필요한 경우 : 카드번호 전체 하나카드 아이디로그인(필수) : 인증할 카드번호 |  |
| `cardPassword` | 카드비밀번호 |  | (RSA 암호화된 카드 비밀번호) 현대카드 아이디로그인(필수) : 카드 비밀번호 4자리 KB 카드소지확인 인증이 필요한 경우 : 카드비밀번호 앞 2자리 하나카드 아이디로그인(필수) : 카드 비밀번호 앞 2자리 |  |
| `birthDate` | 생년월일 |  | [생년월일/주민등록번호] 제한직전 필수 입력하는 기관존재(YYYYMMDD) |  |
| `inquiryType` | 조회구분 |  | [카드이미지포함여부] "0" : 미포함, "1" : 포함 | ✅ |
| `userName` | 사용자 이름 |  | [롯데카드 추가인증] 사용자 이름 |  |
| `identity` | 사용자 주민번호 |  | [롯데카드 추가인증] 생년월일 6자리 + 뒷자리 첫째자리 |  |
| `telecom` | 통신사 |  | [롯데카드 추가인증] "0":SKT, "1":KT, "2":LG U+, "3":알뜰폰(SKT), "4":알뜰폰(KT), "5":알뜰폰(LG U+) |  |
| `phoneNo` | 휴대폰번호 |  | [롯데카드 추가인증] 계정 사용자 명의의 휴대폰 번호 |  |
| `commSession` | 세션 |  | [롯데카드 추가인증] 인증 세션 유지용 값 |  |
| `loginType` | 로그인 구분 |  | connectedId 미입력 시 필수 "0" : 인증서, "1" : 아이디 |  |
| `certType` | 인증서 구분 |  | loginType="0" 필수 "1" : 기본인증서(der/key)타입 "pfx" : 인증서 pfx 타입 |  |
| `certFile` | 인증서 der 파일 |  | loginType="0" 필수 [기본인증서(der/key)타입] - 인증서 der파일 문자열 [인증서 pfx 타입] - pfx 인증서 문자열 |  |
| `keyFile` | 인증서 key 파일 |  | loginType="0"이고 certType="1" 필수 [기본인증서(der/key)타입] - 인증서 key파일 문자열 |  |
| `certPassword` | 인증서 비밀번호 |  | loginType="0" 필수 RSA암호화된 비밀번호 |  |
| `id` | 아이디 |  | loginType="1" 필수 |  |
| `password` | 비밀번호 |  | loginType="1" 필수 RSA암호화된 비밀번호 |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resCardNo` | 카드번호 | O |  | ✅ |
| `resSleepYN` | 휴면카드여부 |  | "N": false, "Y": true | ✅ |
| `resCardName` | 카드명 | O | [카드명] or [카드명\|발급사], (예: 참! 좋은친구카드_체크\|IBK기업은행) | ✅ |
| `resCardType` | 카드구분 |  | (ex. 본인, 체크 비자, 본인 비자, 본인신용, 신용/본인, 체크/본인, 본인카드, 주카드, 부카드-가족) | ✅ |
| `resTrafficYN` | 교통카드 여부 |  | 기관에서 표시되는 형태 그대로 사용됨 (Y/N, 가능/불가능, 유/무, 서울교통후불 등) |  |
| `resImageLink` | 이미지링크 |  | [카드 이미지 링크], (조회 요청시 제공) |  |
| `resIssueDate` | 발급일자 |  |  |  |
| `resValidPeriod` | 유효기간 |  |  | ✅ |
| `resState` | 상태 |  | [카드상태] | ✅ |
| `commSession` | 세션 |  | 로그인 세션값 (base64) |  |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resCardNo": "9490981234560000",
    "resSleepYN": "N",
    "resCardName": "원카드",
    "resCardType": "",
    "resTrafficYN": "",
    "resImageLink": "",
    "resIssueDate": "",
    "resValidPeriod": "20220531",
    "resState": "",
    "commSession": ""
}
```

</details>

## 승인내역 (`KR_CD_P_002`)

- 엔드포인트: `POST /v1/kr/card/p/account/approval-list`

> 이 API는 개인카드 승인내역을 조회하는 서비스입니다. 카드 사용내역 확인, 가맹점별 지출 분석 등 다양한 지출관리·소비분석 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 |  | 로그인 파라미터(loginType 등) 미입력 시 필수 | ✅ |
| `birthDate` | 생년월일 |  |  |  |
| `startDate` | 시작일자 | O |  | ✅ |
| `endDate` | 종료일자 | O |  | ✅ |
| `orderBy` | 일자정렬순서 | O | "0": 최신순, "1": 과거순 (default :"0") | ✅ |
| `inquiryType` | 조회구분 |  | "0": 카드별 조회, "1": 전체조회 (default: "0") | ✅ |
| `cardName` | 카드명 |  | inquiryType="0"인 경우 보유카드 조회 결과의 카드명을 사용 |  |
| `duplicateCardIdx` | 중복카드 일련번호 |  | [중복카드 선택 순번] inquiryType="0"인 경우 필수 "1" 이상: 승인내역 조회 카드목록에서 중복된 카드의 순서 |  |
| `loginCardNo` | 카드번호 |  | 현대카드 아이디로그인(필수) : 인증할 카드번호 KB 카드소지확인 인증이 필요한 경우 : 카드번호 전체 하나카드 아이디로그인(필수) : 인증할 카드번호 |  |
| `cardNo` | 카드번호 |  | 카드별 조회시 카드번호 필수(inquiryType = "0" 인 경우 필수) |  |
| `cardPassword` | 카드비밀번호 |  | (RSA 암호화된 카드 비밀번호) 현대카드 아이디로그인(필수) : 카드 비밀번호 4자리 KB 카드소지확인 인증이 필요한 경우 : 카드비밀번호 앞 2자리 하나카드 아이디로그인(필수) : 카드 비밀번호 앞 2자리 |  |
| `memberStoreInfoType` | 가맹점정보 포함 여부 |  | "0": 미포함, "1": 가맹점 포함, "2":부가세 포함, "3":전체 (가맹점 +부가세) 포함 (default: "0") | ✅ |
| `userName` | 사용자 이름 |  | [롯데카드 추가인증] 사용자 이름 |  |
| `identity` | 사용자 주민번호 |  | [롯데카드 추가인증] 생년월일 6자리 + 뒷자리 첫째자리 |  |
| `telecom` | 통신사 |  | [롯데카드 추가인증] "0":SKT, "1":KT, "2":LG U+, "3":알뜰폰(SKT), "4":알뜰폰(KT), "5":알뜰폰(LG U+) |  |
| `phoneNo` | 휴대폰번호 |  | [롯데카드 추가인증] 계정 사용자 명의의 휴대폰 번호 |  |
| `commSession` | 세션 |  | [롯데카드 추가인증] 인증 세션 유지용 값 |  |
| `loginType` | 로그인 구분 |  | connectedId 미입력 시 필수 "0" : 인증서, "1" : 아이디 |  |
| `certType` | 인증서 구분 |  | loginType="0" 필수 "1" : 기본인증서(der/key)타입 "pfx" : 인증서 pfx 타입 |  |
| `certFile` | 인증서 der 파일 |  | loginType="0" 필수 [기본인증서(der/key)타입] - 인증서 der파일 문자열 [인증서 pfx 타입] - pfx 인증서 문자열 |  |
| `keyFile` | 인증서 key 파일 |  | loginType="0"이고 certType="1" 필수 [기본인증서(der/key)타입] - 인증서 key파일 문자열 |  |
| `certPassword` | 인증서 비밀번호 |  | loginType="0" 필수 RSA암호화된 비밀번호 |  |
| `id` | 아이디 |  | loginType="1" 필수 |  |
| `password` | 비밀번호 |  | loginType="1" 필수 RSA암호화된 비밀번호 |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resUsedDate` | 사용일자 | O |  | ✅ |
| `resUsedTime` | 사용일시 | O |  | ✅ |
| `resCardNo` | 카드번호 | O | 1234********5678 | ✅ |
| `resCardNo1` | 카드번호1 |  | 주1) 가맹점정보 포함하여 조회할 경우 매출전표에 있는 카드번호 |  |
| `resCardName` | 카드명 | O |  | ✅ |
| `resMemberStoreName` | 가맹점명 | O |  | ✅ |
| `resUsedAmount` | 이용금액 | O |  | ✅ |
| `resPaymentType` | 결제방법 | O | "1":일시불, "2":할부, "3": 그외 | ✅ |
| `resInstallmentMonth` | 할부개월 |  | 결제방법이 할부일 경우 필수 | ✅ |
| `resApprovalNo` | 승인번호 | O |  | ✅ |
| `resPaymentDueDate` | 결제예정일 |  |  |  |
| `resHomeForeignType` | 국내/외 구분 | O | "1":국내, "2":해외 | ✅ |
| `resMemberStoreCorpNo` | 가맹점 사업자번호 |  | memberStoreInfoType="1" or "3"인 경우 |  |
| `resMemberStoreType` | 가맹점 업종 |  | memberStoreInfoType="1" or "3"인 경우 |  |
| `resMemberStoreTelNo` | 가맹점 전화번호 |  | memberStoreInfoType="1" or "3"인 경우 |  |
| `resMemberStoreAddr` | 가맹점 주소 |  | memberStoreInfoType="1" or "3"인 경우 |  |
| `resMemberStoreNo` | 가맹점번호 |  | 가맹점번호 또는 가맹점 정보조회시 필요 데이터. 해외건 또는 미승인내역의 경우 미제공 |  |
| `resCancelYN` | 취소여부 | O | "0": 정상, "1": 취소, "2": 부분취소, "3": 거절 | ✅ |
| `resCancelAmount` | 취소금액 |  | 취소건인 경우만 제공 | ✅ |
| `resVAT` | 부가세 |  | memberStoreInfoType="2" or "3"인 경우 |  |
| `resCashBack` | 봉사료 |  | memberStoreInfoType="2" or "3"인 경우 |  |
| `resKRWAmt` | 원화금액 |  |  | ✅ |
| `commStartDate` | 시작일자 | O | (요청일 기준 최대 조회 가능시작일, YYYYMMDD) |  |
| `commEndDate` | 종료일자 | O | (YYYYMMDD) |  |
| `resAccountCurrency` | 통화코드 | O | KRW: 한국원화, JPY: 일본 엔, USD: 미국 달러, EUR: 유로... ( ISO 4217 코드) | ✅ |
| `commSession` | 세션 |  | 로그인 세션값 (base64) |  |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resUsedDate": "20190620",
    "resUsedTime": "120117",
    "resCardNo": "5361481234560000",
    "resCardNo1": "",
    "resCardName": "",
    "resMemberStoreName": "온라인예매",
    "resUsedAmount": "22000",
    "resPaymentType": "1",
    "resInstallmentMonth": "",
    "resAccountCurrency": "KRW",
    "resApprovalNo": "69331111",
    "resPaymentDueDate": "",
    "resHomeForeignType": "1",
    "resMemberStoreCorpNo": "",
    "resMemberStoreType": "",
    "resMemberStoreTelNo": "",
    "resMemberStoreAddr": "",
    "resMemberStoreNo": "158364905|Rz1Ag6pRqgU9CbCtWaIWFw==",
    "resCancelYN": "0",
    "resCancelAmount": "",
    "resVAT": "",
    "resCashBack": "",
    "resKRWAmt": "",
    "commStartDate": "20200208",
    "commEndDate": "20200211",
    "commSession": ""
}
```

</details>

## 청구내역 (`KR_CD_P_003`)

- 엔드포인트: `POST /v1/kr/card/p/account/billing-list`

> 이 API는 개인카드 청구내역을 조회하는 서비스입니다. 결제 예정금액 확인, 할부·리볼빙 내역 파악 등 다양한 지출관리·소비분석 서비스에 활용할 수 있습니다. 인증 방식은 공동인증서 또는 아이디 로그인을 지원합니다. 추가 인증 절차 없이 이용 가능합니다.
> 본 서비스는 과도한 API 호출 시 대상기관으로부터 IP가 차단될 수 있습니다. 배치형 서비스 또는 비정상 호출로 간주될 경우, 서비스 이용이 제한될 수 있으니 유의하시기 바랍니다.

### 입력

| 키 | 이름 | 필수 | 설명 | 전송 |
|---|---|---|---|---|
| `organization` | 기관코드 | O |  | ✅ |
| `connectedId` | 커넥티드 아이디 |  | 로그인 파라미터(loginType 등) 미입력 시 필수 | ✅ |
| `birthDate` | 생년월일 |  | [생년월일/주민등록번호], 제한직전 필수 입력하는 기관존재(YYYYMMDD) |  |
| `startDate` | 시작일자 |  | 청구년월 (YYYYMM), 미입력시 최근 명세서 조회 | ✅ |
| `memberStoreInfoYN` | 가맹점정보 포함여부 |  | "0": 미포함, "1": 가맹점 포함 (default: "0") | ✅ |
| `cardNo` | 카드번호 |  | 현대카드 아이디로그인(필수) : 인증할 카드번호 KB 카드소지확인 인증이 필요한 경우 : 카드번호 전체 하나카드 아이디로그인(필수) : 인증할 카드번호 |  |
| `cardPassword` | 카드비밀번호 |  | (RSA 암호화된 카드 비밀번호) 현대카드 아이디로그인(필수) : 카드 비밀번호 4자리 KB 카드소지확인 인증이 필요한 경우 : 카드비밀번호 앞 2자리 하나카드 아이디로그인(필수) : 카드 비밀번호 앞 2자리 |  |
| `userName` | 사용자 이름 |  | [롯데카드 추가인증] 사용자 이름 |  |
| `identity` | 사용자 주민번호 |  | [롯데카드 추가인증] 생년월일 6자리 + 뒷자리 첫째자리 |  |
| `telecom` | 통신사 |  | [롯데카드 추가인증] "0":SKT, "1":KT, "2":LG U+, "3":알뜰폰(SKT), "4":알뜰폰(KT), "5":알뜰폰(LG U+) |  |
| `phoneNo` | 휴대폰번호 |  | [롯데카드 추가인증] 계정 사용자 명의의 휴대폰 번호 |  |
| `commSession` | 세션 |  | [롯데카드 추가인증] 인증 세션 유지용 값 |  |
| `loginType` | 로그인 구분 |  | connectedId 미입력 시 필수 "0" : 인증서, "1" : 아이디 |  |
| `certType` | 인증서 구분 |  | loginType="0" 필수 "1" : 기본인증서(der/key)타입 "pfx" : 인증서 pfx 타입 |  |
| `certFile` | 인증서 der 파일 |  | loginType="0" 필수 [기본인증서(der/key)타입] - 인증서 der파일 문자열 [인증서 pfx 타입] - pfx 인증서 문자열 |  |
| `keyFile` | 인증서 key 파일 |  | loginType="0"이고 certType="1" 필수 [기본인증서(der/key)타입] - 인증서 key파일 문자열 |  |
| `certPassword` | 인증서 비밀번호 |  | loginType="0" 필수 RSA암호화된 비밀번호 |  |
| `id` | 아이디 |  | loginType="1" 필수 |  |
| `password` | 비밀번호 |  | loginType="1" 필수 RSA암호화된 비밀번호 |  |

### 출력

| 키 | 이름 | 필수 | 설명 | 수집 |
|---|---|---|---|---|
| `resTotalAmount` | 합계금액 | O | 총결제금액 | ✅ |
| `resBillType` | 명세서 구분 | O | 명세서구분 또는 발급사등 구분 |  |
| `resPaymentAccount` | 결제계좌 | O | 은행명 계좌번호 |  |
| `resFullAmt` | 일시불(금액) | O |  | ✅ |
| `resInstallmentAmt` | 할부(금액) | O |  | ✅ |
| `resMinDepositAmt` | 최소입금금액 |  |  |  |
| `resAmountOutstanding` | 미결제금액 | O | [전월 미결제금액] |  |
| `resLateFee` | 연체료 | O | [전월 연체료] | ✅ |
| `resCashService` | 현금서비스(금액) | O | [단기카드대출(현금서비스)] | ✅ |
| `resCardLoan` | 카드론 |  | [장기카드대출(카드론)], KB BC 카드 명세서일경우 미제공 | ✅ |
| `resRevolving` | 리볼빙 | O | [일부결제금액이월약정(리볼빙)] | ✅ |
| `resAnnualFee` | 연회비 | O |  | ✅ |
| `resPreWithdrawal` | 기출금액 |  |  |  |
| `resOverseasUse` | 해외이용 | O |  |  |
| `resWithdrawalDueDate` | 출금예정일 | O | yyyyMMdd, (결제예정내역 매칭시 사용) |  |
| `resPaymentDueDate` | 결제예정일 | O | yyyyMMdd | ✅ |
| `resChargeHistoryList` | 청구내역 List | O |  | ✅ |
| 　└ `resFee` | 수수료 | O | 수수료/ 선입금/ 할인, 면제등 | ✅ |
| 　└ `resMemberStoreName` | 가맹점명 | O |  | ✅ |
| 　└ `resUsedAmount` | 이용금액 | O | 롯데카드 빈값으로 표시됨 | ✅ |
| 　└ `resPaymentType` | 결제방법 | O | "1":일시불, "2":할부, "3":그외, "4":단기카드대출, "5":장기카드대출 | ✅ |
| 　└ `resInstallmentMonth` | 할부개월 |  | 할부건인 경우 필수 | ✅ |
| 　└ `resRoundNo` | 회차 |  | [당월 할부회차], 할부건인 경우 필수 | ✅ |
| 　└ `resPaymentAmt` | 결제금액 |  |  |  |
| 　└ `resAfterPaymentBalance` | 결제후 잔액 |  |  | ✅ |
| 　└ `resEarnPoint` | 적립 포인트 | O |  |  |
| 　└ `resUsedCard` | 이용카드 | O | [이용카드], ex) 마스터096 | ✅ |
| 　└ `resPaymentPrincipal` | 결제금액_원금 | O |  | ✅ |
| 　└ `resMemberStoreCorpNo` | 가맹점 사업자번호 |  |  |  |
| 　└ `resMemberStoreType` | 가맹점 업종 |  |  |  |
| 　└ `resMemberStoreTelNo` | 가맹점 전화번호 |  |  |  |
| 　└ `resMemberStoreAddr` | 가맹점 주소 |  |  |  |
| 　└ `resMemberStoreNo` | 가맹점번호 |  |  |  |
| 　└ `resApprovalNo` | 승인번호 |  |  |  |
| 　└ `resUsedDate` | 사용일자 | O |  | ✅ |
| `commSession` | 세션 |  | 로그인 세션값 (base64) |  |

<details><summary>응답 예시 (개발가이드 샘플)</summary>

```json
{
    "resTotalAmount": "696051",
    "resBillType": "0",
    "resPaymentAccount": "은행10020000*****",
    "resFullAmt": "515363",
    "resInstallmentAmt": "180688",
    "resMinDepositAmt": "",
    "resAmountOutstanding": "",
    "resLateFee": "0",
    "resCashService": "0",
    "resCardLoan": "0",
    "resRevolving": "0",
    "resAnnualFee": "0",
    "resPreWithdrawal": "",
    "resOverseasUse": "43196",
    "resWithdrawalDueDate": "",
    "resPaymentDueDate": "20190626",
    "resChargeHistoryList": [
        {
            "resFee": "0",
            "resMemberStoreName": "서울강남",
            "resUsedAmount": "17100",
            "resPaymentType": "1",
            "resInstallmentMonth": "0",
            "resRoundNo": "",
            "resPaymentAmt": "",
            "resAfterPaymentBalance": "0",
            "resEarnPoint": "",
            "resUsedCard": "1791",
            "resPaymentPrincipal": "17100",
            "resMemberStoreCorpNo": "",
            "resMemberStoreType": "",
            "resMemberStoreTelNo": "",
            "resMemberStoreAddr": "",
            "resMemberStoreNo": "",
            "resApprovalNo": "",
            "resUsedDate": "20171219"
        }
    ],
    "commSession": ""
}
```

</details>
