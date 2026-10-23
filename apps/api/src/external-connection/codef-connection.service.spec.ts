import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CodefClient } from './codef/codef.client';
import { CodefConnectionService } from './codef-connection.service';

describe('CodefConnectionService', () => {
  const request = vi.fn<CodefClient['request']>();
  let service: CodefConnectionService;

  beforeEach(() => {
    request.mockReset();
    const client = {
      request,
      encrypt: (plainText: string) => `enc(${plainText})`,
    } as unknown as CodefClient;
    service = new CodefConnectionService(client);
  });

  describe('계정', () => {
    it('평문 비밀번호를 암호화해 등록하고, 증권은 통합(A) 고객 구분을 쓴다', async () => {
      request.mockResolvedValueOnce({
        connectedId: 'new-cid',
        successList: { code: 'CF-00000', message: '성공', businessType: 'BK', organization: '0004' },
        errorList: [],
      });

      const result = await service.createConnectedId([
        { businessType: 'BK', organization: '0004', loginType: 'certificate', derFile: 'der', keyFile: 'key', password: 'pw' },
        { businessType: 'ST', organization: '0240', loginType: 'id', id: 'me', password: 'pw2' },
      ]);

      expect(request).toHaveBeenCalledWith('/v1/account/create', {
        accountList: [
          { countryCode: 'KR', businessType: 'BK', clientType: 'P', organization: '0004', password: 'enc(pw)', loginType: '0', certType: '1', derFile: 'der', keyFile: 'key' },
          { countryCode: 'KR', businessType: 'ST', clientType: 'A', organization: '0240', password: 'enc(pw2)', loginType: '1', id: 'me', birthDate: undefined },
        ],
      });
      expect(result.connectedId).toBe('new-cid');
      expect(result.successList).toHaveLength(1);
    });

    it('계정 삭제는 설정된 커넥티드 아이디로 요청한다', async () => {
      request.mockResolvedValueOnce({ connectedId: 'cid', successList: [], errorList: [] });

      await service.deleteAccounts('cid', [{ businessType: 'CD', organization: '0309', loginType: 'id' }]);

      expect(request).toHaveBeenCalledWith('/v1/account/delete', {
        connectedId: 'cid',
        accountList: [{ countryCode: 'KR', businessType: 'CD', clientType: 'P', organization: '0309', loginType: '1' }],
      });
    });
  });

  it('사용자마다 넘긴 커넥티드 아이디로 요청한다', async () => {
    request.mockResolvedValue({ accountList: [] });

    await service.getRegisteredAccounts('user-a-cid');
    await service.getRegisteredAccounts('user-b-cid');

    expect(request).toHaveBeenNthCalledWith(1, '/v1/account/list', { connectedId: 'user-a-cid' });
    expect(request).toHaveBeenNthCalledWith(2, '/v1/account/list', { connectedId: 'user-b-cid' });
  });

  describe('은행', () => {
    it('보유계좌의 금액을 숫자로 바꾸고, 한 건짜리 객체도 배열로 만든다', async () => {
      request.mockResolvedValueOnce({
        resDepositTrust: {
          resAccount: '02004200000000',
          resAccountName: '입출금통장',
          resAccountDeposit: '11',
          resAccountCurrency: 'KRW',
          resAccountBalance: '1,234,567',
          resOverdraftAcctYN: '0',
          resAccountLifetime: '01012345678',
        },
        resForeignCurrency: [],
        resFund: [{ resAccount: '1', resAccountBalance: '1000', resAccountInvestedCost: '900', resEarningsRate: '11.1' }],
        resLoan: '',
        resInsurance: [{ resAccount: '보험' }],
      });

      const result = await service.getBankAccounts('cid', '0004');

      expect(request).toHaveBeenCalledWith('/v1/kr/bank/p/account/account-list', {
        connectedId: 'cid',
        organization: '0004',
      });
      expect(result.resDepositTrust).toHaveLength(1);
      expect(result.resDepositTrust[0]).toMatchObject({ resAccountBalance: 1234567, resAccountNickName: '' });
      expect(result.resDepositTrust[0]).not.toHaveProperty('resAccountLifetime');
      expect(result.resFund[0]).toMatchObject({ resAccountInvestedCost: 900, resEarningsRate: 11.1 });
      expect(result.resLoan).toEqual([]);
      expect(result).not.toHaveProperty('resInsurance');
    });

    it('거래내역은 잔고 추이에 필요한 필드만 남긴다', async () => {
      request.mockResolvedValueOnce({
        commStartDate: '20250101',
        commEndDate: '20251022',
        resAccountHolder: '홍길동',
        resTrHistoryList: [
          {
            resAccountTrDate: '20251001',
            resAccountTrTime: '004219',
            resAccountIn: '1',
            resAccountOut: '0',
            resAfterTranBalance: '11517',
            resAccountDesc1: '김철수',
            resAccountDesc3: '이자',
          },
        ],
      });

      const result = await service.getBankTransactions('cid', {
        organization: '0004',
        account: '02004130000000',
        startDate: '20251001',
        endDate: '20251022',
      });

      expect(request).toHaveBeenCalledWith('/v1/kr/bank/p/account/transaction-list', {
        connectedId: 'cid',
        organization: '0004',
        account: '02004130000000',
        startDate: '20251001',
        endDate: '20251022',
        orderBy: '1',
        inquiryType: '0',
      });
      expect(result).toEqual({
        commStartDate: '20250101',
        commEndDate: '20251022',
        resTrHistoryList: [
          {
            resAccountTrDate: '20251001',
            resAccountTrTime: '004219',
            resAccountIn: 1,
            resAccountOut: 0,
            resAfterTranBalance: 11517,
          },
        ],
      });
    });
  });

  describe('증권', () => {
    it('전계좌는 한 건이어도 배열로 돌려준다', async () => {
      request.mockResolvedValueOnce({ resAccount: '4555', resAccountName: '위탁', resValuationAmt: '5000000', resEarningsRate: '-3.25' });

      const result = await service.getStockAccounts('cid', '0240');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ resAccount: '4555', resValuationAmt: 5000000, resEarningsRate: -3.25, resLoanAmt: null });
    });

    it('주식잔고는 계좌 비밀번호를 암호화해 요청하고 종목별 수량을 숫자로 돌려준다', async () => {
      request.mockResolvedValueOnce({
        resAccount: '4555',
        resDepositReceived: '10000',
        resItemList: [{ resProductTypeCd: '01', resItemCode: '005930', resItemName: '삼성전자', resQuantity: '10', resAvgPresentAmt: '70,000' }],
      });

      const result = await service.getStockBalance('cid', { organization: '0240', account: '4555', accountPassword: '1234' });

      expect(request).toHaveBeenCalledWith('/v1/kr/stock/a/account/balance-inquiry', {
        connectedId: 'cid',
        organization: '0240',
        account: '4555',
        accountPassword: 'enc(1234)',
      });
      expect(result.resItemList[0]).toMatchObject({ resItemCode: '005930', resQuantity: 10, resAvgPresentAmt: 70000 });
    });
  });

  describe('카드', () => {
    it('승인내역은 전체 카드를 가맹점 상세 없이 조회하고 필요한 필드만 남긴다', async () => {
      request.mockResolvedValueOnce([
        {
          resUsedDate: '20251001',
          resUsedTime: '120117',
          resCardNo: '5361********0000',
          resMemberStoreName: '온라인예매',
          resUsedAmount: '22000',
          resPaymentType: '1',
          resCancelYN: '0',
          resApprovalNo: '69331111',
          resMemberStoreAddr: '서울시 어딘가',
          resMemberStoreNo: '158364905',
        },
      ]);

      const result = await service.getCardApprovals('cid', { organization: '0309', startDate: '20251001', endDate: '20251022' });

      expect(request).toHaveBeenCalledWith('/v1/kr/card/p/account/approval-list', {
        connectedId: 'cid',
        organization: '0309',
        startDate: '20251001',
        endDate: '20251022',
        orderBy: '1',
        inquiryType: '1',
        memberStoreInfoType: '0',
      });
      expect(result[0]).toMatchObject({ resMemberStoreName: '온라인예매', resUsedAmount: 22000, resCancelAmount: null });
      expect(result[0]).not.toHaveProperty('resMemberStoreAddr');
      expect(result[0]).not.toHaveProperty('resMemberStoreNo');
    });

    it('청구내역은 청구년월을 startDate 로 보낸다', async () => {
      request.mockResolvedValueOnce({
        resPaymentDueDate: '20251026',
        resTotalAmount: '696051',
        resPaymentAccount: '은행10020000*****',
        resChargeHistoryList: [{ resMemberStoreName: '서울강남', resUsedAmount: '17100', resInstallmentMonth: '0' }],
      });

      const result = await service.getCardBillings('cid', { organization: '0309', month: '202510' });

      expect(request).toHaveBeenCalledWith('/v1/kr/card/p/account/billing-list', {
        connectedId: 'cid',
        organization: '0309',
        startDate: '202510',
        memberStoreInfoYN: '0',
      });
      expect(result[0]).toMatchObject({ resTotalAmount: 696051, resChargeHistoryList: [{ resUsedAmount: 17100 }] });
      expect(result[0]).not.toHaveProperty('resPaymentAccount');
    });

    it('보유카드는 카드 이미지 없이 조회한다', async () => {
      request.mockResolvedValueOnce({ resCardNo: '9490********0000', resCardName: '원카드', resValidPeriod: '20280531' });

      const result = await service.getCards('cid', '0309');

      expect(request).toHaveBeenCalledWith('/v1/kr/card/p/account/card-list', {
        connectedId: 'cid',
        organization: '0309',
        inquiryType: '0',
      });
      expect(result).toEqual([
        { resCardNo: '9490********0000', resCardName: '원카드', resCardType: '', resValidPeriod: '20280531', resState: '', resSleepYN: '' },
      ]);
    });
  });

  describe('환율', () => {
    it('하나은행 고시 환율에서 통화별 매매기준율을 돌려준다', async () => {
      request.mockResolvedValueOnce({
        resDate: '20251022',
        resTime: '153000',
        resRoundNo: '166',
        resDetailList: [{ resAccountCurrency: '미국 USD', resExchangeRate: '1,387.76', resAmount3: '1,363.90' }],
      });

      const result = await service.getExchangeRates('20251022');

      expect(request).toHaveBeenCalledWith('/v1/kr/bank/a/exchangerate/check', {
        organization: '0081',
        date: '20251022',
      });
      expect(result.resDetailList).toEqual([{ currency: 'USD', currencyName: '미국 USD', baseRate: 1363.9 }]);
    });
  });
});
