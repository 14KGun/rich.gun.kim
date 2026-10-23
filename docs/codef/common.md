# CODEF 공통 가이드

CODEF 개발가이드의 공통가이드(Rest API, 커넥티드 아이디, 추가 인증)와 공식 SDK(easycodefpy)에서 확인한 내용이다.
구현은 `apps/api/src/external-connection/codef/codef.client.ts` 에 있다.

## 환경과 호스트

| 환경 | 호스트 | 설명 |
|---|---|---|
| `sandbox` | `https://sandbox.codef.io` | 회원가입만 하면 쓸 수 있다. 고정된 샘플 데이터를 돌려준다 |
| `development` | `https://development.codef.io` | 데모 버전. 서비스 신청 후 실제 기관 데이터를 조회한다. 3개월 기간 제한 |
| `production` | `https://api.codef.io` | 정식 버전 |

토큰은 환경과 관계없이 `https://oauth.codef.io/oauth/token` 에서 발급받는다. 키는 환경마다 따로 발급된다.

## API 키

키는 CODEF 홈페이지의 마이페이지 > 키 관리에서 확인한다.

| 키 | 용도 |
|---|---|
| `clientId`, `clientSecret` | 액세스 토큰 발급 |
| `publicKey` | 비밀번호 RSA 암호화. 계정 등록, 계좌 비밀번호 등에서 쓴다 |

키가 없거나 잘못되면 `CF-00015`(퍼블릭키 필요), `CF-04007`(비공개키 없음) 같은 오류가 온다.

## 액세스 토큰

- OAuth 2.0 `client_credentials` 방식이다.
- 요청: `POST https://oauth.codef.io/oauth/token`
  - 헤더 `Authorization: Basic base64(clientId:clientSecret)`, `Content-Type: application/x-www-form-urlencoded`
  - 본문 `grant_type=client_credentials&scope=read`
- 응답: `{ "access_token": "...", "expires_in": 604799, ... }`
- **토큰은 일주일간 유효하다.** 호출할 때마다 발급하지 말고 저장해 두고 재사용하라고 권장한다. 만료되면 다시 발급한다.
- 상품 요청에는 `Authorization: Bearer <accessToken>` 헤더를 붙인다.

구현에서는 토큰을 메모리에 두고, 만료 1분 전이나 401 응답을 받은 뒤에 다시 발급한다.

## 요청과 응답 형식

- 모든 상품 요청은 `POST` 이다.
- **요청 본문은 JSON 문자열을 URL 인코딩한 값이다.** (`encodeURIComponent(JSON.stringify(body))`)
- **응답 본문도 URL 인코딩된 JSON 이다.** 공백이 `+` 로 오므로 `+` 를 공백으로 바꾼 뒤 디코딩한다.
- 응답은 `result` 와 `data` 로 나뉜다.

```json
{
  "result": {
    "code": "CF-00000",
    "extraMessage": null,
    "message": "성공",
    "transactionId": "f41d087dd6314"
  },
  "data": {
    "resDepositTrust": [],
    "resForeignCurrency": [],
    "resFund": [],
    "resLoan": [],
    "resInsurance": []
  }
}
```

| `result` 키 | 설명 |
|---|---|
| `code` | 결과 코드. 성공은 `CF-00000` |
| `message` | 메시지 |
| `extraMessage` | 추가 메시지 |
| `transactionId` | 트랜잭션 아이디 |

- `data` 의 값은 모두 문자열이고, 값이 없으면 빈 문자열이다.
- 목록 결과가 한 건이면 배열 대신 객체 하나로 오기도 한다. 구현에서는 항상 배열로 바꾼다.
- 성공이 아닌 결과 코드는 `CodefError` 로 던진다.

## 추가 인증 (`CF-03002`)

기관이 SMS, 보안문자, 간편인증 같은 추가 인증을 요구하면 `CF-03002` 가 온다.
`data.method` 가 인증 수단(`smsAuthNo`, `secureNo`, `simpleAuth` 등)이고, 같은 엔드포인트로 기본 파라미터와 추가 인증 파라미터를 다시 보내야 한다.
추가 인증을 기다리는 약 3분 동안은 같은 계정으로 상품을 다시 요청할 수 없다.

이 프로젝트에서 쓰는 은행·증권·카드 상품은 대부분 "추가 인증 절차 없이 이용 가능"하다고 안내되어 있어서, 지금은 추가 인증을 지원하지 않고 `CodefError` 로 처리한다.
예외는 롯데카드(추가 인증 파라미터 있음)와 씨티은행 빠른조회(SMS)다.

## 커넥티드 아이디

- 커넥티드 아이디(Connected ID)는 엔드 유저의 기관 로그인 정보(인증서, 아이디·비밀번호)를 식별하는 키다.
- 계정을 한 번 등록하면 이후에는 로그인 정보 없이 커넥티드 아이디로 기관 데이터를 조회한다.
- 커넥티드 아이디 하나에 여러 기관(은행 1, 은행 2, 카드 1 …)을 등록할 수 있다.
- 커넥티드 아이디로는 엔드 유저가 누구인지 알 수 없다. 엔드 유저와 커넥티드 아이디의 연결은 클라이언트가 관리한다.
- 인증서를 갱신하거나 비밀번호를 바꾸면 계정 정보를 수정(`/v1/account/update`)해야 한다.
- 계정을 모두 삭제하면 커넥티드 아이디도 삭제된다.

| 기능 | 엔드포인트 | 입력 | 메소드 |
|---|---|---|---|
| 계정 등록 | `/v1/account/create` | `accountList` | `createConnectedId` |
| 계정 추가 | `/v1/account/add` | `connectedId`, `accountList` | `addAccounts` |
| 계정 수정 | `/v1/account/update` | `connectedId`, `accountList` | (미구현) |
| 계정 삭제 | `/v1/account/delete` | `connectedId`, `accountList` | `deleteAccounts` |
| 계정 목록 | `/v1/account/list` | `connectedId` | `getRegisteredAccounts` |
| 커넥티드 아이디 목록 | `/v1/account/connectedId-list` | `pageNo` | (미구현) |

### 계정 정보 (`accountList` 항목)

비밀번호는 `publicKey` 로 RSA 암호화해서 보낸다. 인증서 파일은 Base64 문자열로 보낸다.

| 키 | 이름 | 필수 | 설명 |
|---|---|---|---|
| `countryCode` | 국가코드 | O | `KR` |
| `businessType` | 업무 구분 | O | 은행·저축은행 `BK`, 카드 `CD`, 증권 `ST`, 보험 `IS` |
| `organization` | 기관코드 | O | |
| `clientType` | 고객 구분 | O | 개인 `P`, 기업·법인 `B`, 통합 `A` |
| `loginType` | 로그인 방식 | O | 인증서 `0`, 아이디·비밀번호 `1` |
| `derFile` | 인증서 der 파일 | △ | 기본 인증서일 때 필수. Base64 |
| `keyFile` | 인증서 key 파일 | △ | 기본 인증서일 때 필수. Base64 |
| `certFile` | 인증서 pfx 파일 | △ | pfx 인증서일 때 필수. Base64 |
| `certType` | 인증서 구분 | O | 기본 인증서(der/key) `1`, pfx `pfx` (기본값 `1`) |
| `id` | 아이디 | △ | 아이디 방식일 때 필수 |
| `password` | 비밀번호 | O | 인증서 비밀번호 또는 아이디 비밀번호. RSA 암호화 |
| `birthDate` | 생년월일 | △ | |
| `identity`, `userName` | 주민번호·이름 | △ | 보험사 |
| `cardNo`, `cardPassword` | 카드번호·비밀번호 | △ | 현대카드 아이디 로그인, KB 카드 소지 확인 |

고객 구분은 업무마다 정해져 있다. 개인(`P`)은 은행·저축은행·카드, 통합(`A`)은 보험·증권이다.
삭제할 때는 `countryCode`, `businessType`, `organization`, `clientType`, `loginType` 만 보낸다.

### 등록 결과

```json
{
  "connectedId": "9LUm.uhVQb",
  "successList": [
    { "code": "CF-00000", "message": "성공", "countryCode": "KR", "clientType": "P", "organization": "0004", "businessType": "BK" }
  ],
  "errorList": []
}
```

- 등록에 모두 실패하면 `connectedId` 가 없다.
- 이미 등록된 계정을 다시 등록하면 `errorList` 에 들어간다.
