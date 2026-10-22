import { z } from 'zod';

/*
 * CODEF 응답 스키마.
 * 서비스 목적(자산 잔고·추이, 카드 지출, 환율)에 필요한 필드만 정의한다.
 * z.object 는 정의하지 않은 키를 버리므로, 상대방 이름·가맹점 주소 같은 값은 수집되지 않는다.
 * 필드 설명은 docs/codef 문서를 참고한다.
 */

/** CODEF 는 값을 모두 문자열로 주고, 값이 없으면 빈 문자열을 준다. */
const text = z.string().default('');

/** "1,234" 같은 금액·수량·비율 문자열을 숫자로 바꾼다. 빈 값이나 숫자가 아니면 null 이다. */
const amount = z
  .string()
  .optional()
  .transform((value) => {
    const normalized = value?.replaceAll(',', '').trim();
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  });

/** CODEF 는 목록 결과가 한 건이면 배열 대신 객체 하나를, 없으면 빈 값을 주기도 한다. */
const list = <T extends z.ZodType>(item: T) =>
  z.preprocess(
    (value) => (value == null || value === '' ? [] : Array.isArray(value) ? value : [value]),
    z.array(item),
  );

// ---- 계정 (커넥티드 아이디) ----

const accountResultSchema = z.object({
  code: text,
  message: text,
  businessType: text,
  organization: text,
});

export const accountRegistrationSchema = z.object({
  connectedId: text,
  successList: list(accountResultSchema),
  errorList: list(accountResultSchema),
});

export const registeredAccountsSchema = z.object({
  accountList: list(
    z.object({
      businessType: text,
      clientType: text,
      organization: text,
      loginType: text,
    }),
  ),
});

// ---- 은행 ----

const bankAccountSchema = z.object({
  resAccount: text,
  resAccountDisplay: text,
  resAccountName: text,
  resAccountNickName: text,
  /** 10·11: 수시입출, 12: 정기/적금, 13: 신탁, 14: 적금 또는 신탁, 20: 외화, 30: 펀드, 40: 대출 */
  resAccountDeposit: text,
  resAccountCurrency: text,
  resAccountBalance: amount,
  resAccountStartDate: text,
  resAccountEndDate: text,
  resLastTranDate: text,
});

export const bankAccountsSchema = z.object({
  resDepositTrust: list(bankAccountSchema.extend({ resOverdraftAcctYN: text })),
  resForeignCurrency: list(bankAccountSchema),
  resFund: list(
    bankAccountSchema.extend({ resAccountInvestedCost: amount, resEarningsRate: amount }),
  ),
  resLoan: list(bankAccountSchema.extend({ resAccountLoanExecNo: text })),
});

export const bankTransactionsSchema = z.object({
  /** 조회 가능한 가장 이른 날짜 (YYYYMMDD) */
  commStartDate: text,
  commEndDate: text,
  resTrHistoryList: list(
    z.object({
      resAccountTrDate: text,
      resAccountTrTime: text,
      resAccountIn: amount,
      resAccountOut: amount,
      resAfterTranBalance: amount,
    }),
  ),
});

// ---- 증권 ----

export const stockAccountsSchema = list(
  z.object({
    resAccount: text,
    resAccountDisplay: text,
    resAccountName: text,
    resAccountNickName: text,
    resDepositReceived: amount,
    resDepositReceivedD2: amount,
    resDepositReceivedF: amount,
    resPurchaseAmount: amount,
    resValuationAmt: amount,
    resValuationPL: amount,
    resEarningsRate: amount,
    resLoanAmt: amount,
  }),
);

export const stockBalanceSchema = z.object({
  resAccount: text,
  resDepositReceived: amount,
  resDepositReceivedD2: amount,
  resDepositReceivedF: amount,
  resItemList: list(
    z.object({
      /** 01: 국내주식, 04: 해외주식 */
      resProductTypeCd: text,
      resItemCode: text,
      resItemName: text,
      resQuantity: amount,
      resAvgPresentAmt: amount,
      resPresentAmt: amount,
      resPurchaseAmount: amount,
      resValuationAmt: amount,
      resValuationPL: amount,
      resEarningsRate: amount,
      resAccountCurrency: text,
    }),
  ),
});

// ---- 카드 ----

export const cardsSchema = list(
  z.object({
    resCardNo: text,
    resCardName: text,
    resCardType: text,
    resValidPeriod: text,
    resState: text,
    resSleepYN: text,
  }),
);

export const cardApprovalsSchema = list(
  z.object({
    resUsedDate: text,
    resUsedTime: text,
    resCardNo: text,
    resCardName: text,
    resMemberStoreName: text,
    resUsedAmount: amount,
    resAccountCurrency: text,
    resKRWAmt: amount,
    /** 1: 일시불, 2: 할부, 3: 그 외 */
    resPaymentType: text,
    resInstallmentMonth: text,
    /** 1: 국내, 2: 해외 */
    resHomeForeignType: text,
    /** 0: 정상, 1: 취소, 2: 부분취소, 3: 거절 */
    resCancelYN: text,
    resCancelAmount: amount,
    resApprovalNo: text,
  }),
);

export const cardBillingsSchema = list(
  z.object({
    resPaymentDueDate: text,
    resTotalAmount: amount,
    resFullAmt: amount,
    resInstallmentAmt: amount,
    resCashService: amount,
    resCardLoan: amount,
    resRevolving: amount,
    resAnnualFee: amount,
    resLateFee: amount,
    resChargeHistoryList: list(
      z.object({
        resUsedDate: text,
        resUsedCard: text,
        resMemberStoreName: text,
        resUsedAmount: amount,
        resPaymentType: text,
        resInstallmentMonth: text,
        resRoundNo: text,
        resPaymentPrincipal: amount,
        resFee: amount,
        resAfterPaymentBalance: amount,
      }),
    ),
  }),
);

// ---- 환율 ----

export const exchangeRatesSchema = z.object({
  /** 고시일자 (YYYYMMDD) */
  resDate: text,
  resTime: text,
  resRoundNo: text,
  resDetailList: list(
    z
      .object({
        /** 예: "미국 USD" */
        resAccountCurrency: text,
        /** 매매기준율 */
        resAmount3: amount,
      })
      .transform(({ resAccountCurrency, resAmount3 }) => ({
        currency: resAccountCurrency.split(' ').at(-1) ?? resAccountCurrency,
        currencyName: resAccountCurrency,
        baseRate: resAmount3,
      })),
  ),
});

export type AccountRegistration = z.output<typeof accountRegistrationSchema>;
export type RegisteredAccounts = z.output<typeof registeredAccountsSchema>;
export type BankAccounts = z.output<typeof bankAccountsSchema>;
export type BankTransactions = z.output<typeof bankTransactionsSchema>;
export type StockAccount = z.output<typeof stockAccountsSchema>[number];
export type StockBalance = z.output<typeof stockBalanceSchema>;
export type Card = z.output<typeof cardsSchema>[number];
export type CardApproval = z.output<typeof cardApprovalsSchema>[number];
export type CardBilling = z.output<typeof cardBillingsSchema>[number];
export type ExchangeRates = z.output<typeof exchangeRatesSchema>;
