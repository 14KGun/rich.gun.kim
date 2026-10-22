import { Injectable } from '@nestjs/common';
import { CodefClient } from './codef/codef.client';
import {
  type AccountRegistration,
  accountRegistrationSchema,
  type BankAccounts,
  bankAccountsSchema,
  type BankTransactions,
  bankTransactionsSchema,
  type Card,
  type CardApproval,
  cardApprovalsSchema,
  type CardBilling,
  cardBillingsSchema,
  cardsSchema,
  type ExchangeRates,
  exchangeRatesSchema,
  type RegisteredAccounts,
  registeredAccountsSchema,
  type StockAccount,
  stockAccountsSchema,
  type StockBalance,
  stockBalanceSchema,
} from './codef/codef.schemas';

/** BK: 은행·저축은행, CD: 카드, ST: 증권 */
export type CodefBusinessType = 'BK' | 'CD' | 'ST';

export interface CodefAccountKey {
  businessType: CodefBusinessType;
  /** 기관코드 (예: 국민은행 0004) */
  organization: string;
}

/** certificate: 공동인증서(der/key), id: 아이디·비밀번호 */
export type CodefLoginType = 'certificate' | 'id';

/** 등록할 기관 계정. 비밀번호는 평문으로 받아 서비스에서 RSA 암호화한다. */
export type CodefAccountInput = CodefAccountKey &
  (
    | { loginType: 'certificate'; derFile: string; keyFile: string; password: string }
    | { loginType: 'id'; id: string; password: string; birthDate?: string }
  );

export interface DateRange {
  /** YYYYMMDD */
  startDate: string;
  /** YYYYMMDD */
  endDate: string;
}

/** 하나은행 고시 환율을 쓴다 (CODEF 환율조회는 하나은행만 지원) */
const EXCHANGE_RATE_ORGANIZATION = '0081';

/**
 * CODEF 로 은행 잔고·거래내역, 증권 잔고, 카드 사용내역, 환율을 조회한다.
 * 각 상품의 입출력 명세는 docs/codef 를 참고한다.
 */
@Injectable()
export class CodefConnectionService {
  constructor(private readonly client: CodefClient) {}

  // ---- 계정 (커넥티드 아이디) ----

  /** 기관 계정을 등록하고 새 커넥티드 아이디를 발급받는다. */
  async createConnectedId(accounts: CodefAccountInput[]): Promise<AccountRegistration> {
    const data = await this.client.request('/v1/account/create', {
      accountList: accounts.map((account) => this.toAccountParam(account)),
    });
    return accountRegistrationSchema.parse(data);
  }

  /** 설정된 커넥티드 아이디에 기관 계정을 추가한다. */
  async addAccounts(accounts: CodefAccountInput[]): Promise<AccountRegistration> {
    const data = await this.client.request('/v1/account/add', {
      connectedId: this.client.connectedId,
      accountList: accounts.map((account) => this.toAccountParam(account)),
    });
    return accountRegistrationSchema.parse(data);
  }

  /** 설정된 커넥티드 아이디에서 기관 계정을 삭제한다. 삭제한 계정은 복구할 수 없다. */
  async deleteAccounts(
    accounts: (CodefAccountKey & { loginType: CodefLoginType })[],
  ): Promise<AccountRegistration> {
    const data = await this.client.request('/v1/account/delete', {
      connectedId: this.client.connectedId,
      accountList: accounts.map((account) => ({
        countryCode: 'KR',
        businessType: account.businessType,
        clientType: this.clientTypeOf(account.businessType),
        organization: account.organization,
        loginType: this.loginTypeCode(account.loginType),
      })),
    });
    return accountRegistrationSchema.parse(data);
  }

  /** 설정된 커넥티드 아이디에 등록된 기관 계정 목록 */
  async getRegisteredAccounts(): Promise<RegisteredAccounts> {
    const data = await this.client.request('/v1/account/list', {
      connectedId: this.client.connectedId,
    });
    return registeredAccountsSchema.parse(data);
  }

  // ---- 은행 ----

  /** 은행 하나의 보유계좌와 잔액 (예금·신탁, 외화, 펀드, 대출) */
  async getBankAccounts(organization: string): Promise<BankAccounts> {
    const data = await this.client.request('/v1/kr/bank/p/account/account-list', {
      connectedId: this.client.connectedId,
      organization,
    });
    return bankAccountsSchema.parse(data);
  }

  /** 수시입출 계좌의 거래내역. 거래 후 잔액으로 잔고 추이를 복원하는 데 쓴다. */
  async getBankTransactions(
    params: DateRange & { organization: string; account: string },
  ): Promise<BankTransactions> {
    const data = await this.client.request('/v1/kr/bank/p/account/transaction-list', {
      connectedId: this.client.connectedId,
      organization: params.organization,
      account: params.account,
      startDate: params.startDate,
      endDate: params.endDate,
      orderBy: '1', // 과거순
      inquiryType: '0', // 계좌 상세 미포함
    });
    return bankTransactionsSchema.parse(data);
  }

  // ---- 증권 ----

  /** 증권사 하나의 전체 계좌와 계좌별 예수금·평가금액·수익률 */
  async getStockAccounts(organization: string): Promise<StockAccount[]> {
    const data = await this.client.request('/v1/kr/stock/a/account/account-list', {
      connectedId: this.client.connectedId,
      organization,
    });
    return stockAccountsSchema.parse(data);
  }

  /** 증권 계좌 하나의 종목별 보유수량·평균매입가·평가금액 */
  async getStockBalance(params: {
    organization: string;
    account: string;
    accountPassword?: string;
  }): Promise<StockBalance> {
    const data = await this.client.request('/v1/kr/stock/a/account/balance-inquiry', {
      connectedId: this.client.connectedId,
      organization: params.organization,
      account: params.account,
      accountPassword: params.accountPassword && this.client.encrypt(params.accountPassword),
    });
    return stockBalanceSchema.parse(data);
  }

  // ---- 카드 ----

  /** 카드사 하나의 보유카드 목록 */
  async getCards(organization: string): Promise<Card[]> {
    const data = await this.client.request('/v1/kr/card/p/account/card-list', {
      connectedId: this.client.connectedId,
      organization,
      inquiryType: '0', // 카드 이미지 미포함
    });
    return cardsSchema.parse(data);
  }

  /** 카드사 하나의 모든 카드 승인내역 */
  async getCardApprovals(params: DateRange & { organization: string }): Promise<CardApproval[]> {
    const data = await this.client.request('/v1/kr/card/p/account/approval-list', {
      connectedId: this.client.connectedId,
      organization: params.organization,
      startDate: params.startDate,
      endDate: params.endDate,
      orderBy: '1', // 과거순
      inquiryType: '1', // 전체 카드 조회
      memberStoreInfoType: '0', // 가맹점 상세 미포함
    });
    return cardApprovalsSchema.parse(data);
  }

  /** 카드사 하나의 청구 명세서. month(YYYYMM) 를 생략하면 최근 명세서다. */
  async getCardBillings(params: { organization: string; month?: string }): Promise<CardBilling[]> {
    const data = await this.client.request('/v1/kr/card/p/account/billing-list', {
      connectedId: this.client.connectedId,
      organization: params.organization,
      startDate: params.month,
      memberStoreInfoYN: '0', // 가맹점 상세 미포함
    });
    return cardBillingsSchema.parse(data);
  }

  // ---- 환율 ----

  /** 통화별 매매기준율. date(YYYYMMDD) 를 생략하면 오늘의 최종 고시 환율이다. 로그인이 필요 없다. */
  async getExchangeRates(date?: string): Promise<ExchangeRates> {
    const data = await this.client.request('/v1/kr/bank/a/exchangerate/check', {
      organization: EXCHANGE_RATE_ORGANIZATION,
      date,
    });
    return exchangeRatesSchema.parse(data);
  }

  /** 증권은 통합(A), 은행·카드는 개인(P) 고객 구분으로 등록한다. */
  private clientTypeOf(businessType: CodefBusinessType): 'A' | 'P' {
    return businessType === 'ST' ? 'A' : 'P';
  }

  private loginTypeCode(loginType: CodefLoginType): '0' | '1' {
    return loginType === 'certificate' ? '0' : '1';
  }

  private toAccountParam(account: CodefAccountInput): Record<string, string | undefined> {
    const common = {
      countryCode: 'KR',
      businessType: account.businessType,
      clientType: this.clientTypeOf(account.businessType),
      organization: account.organization,
      loginType: this.loginTypeCode(account.loginType),
      password: this.client.encrypt(account.password),
    };
    if (account.loginType === 'certificate') {
      return {
        ...common,
        certType: '1',
        derFile: account.derFile,
        keyFile: account.keyFile,
      };
    }
    return { ...common, id: account.id, birthDate: account.birthDate };
  }
}
