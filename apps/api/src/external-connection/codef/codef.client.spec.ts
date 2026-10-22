import { generateKeyPairSync } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CodefClient, CodefError } from './codef.client';
import type { CodefConfig } from './codef.config';

const config: CodefConfig = {
  environment: 'development',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  publicKey: '',
  connectedId: 'connected-id',
};

const tokenResponse = () =>
  new Response(JSON.stringify({ access_token: 'token-1', expires_in: 604799 }), { status: 200 });

/** CODEF 처럼 URL 인코딩된 JSON 응답을 만든다. */
const codefResponse = (body: unknown) =>
  new Response(encodeURIComponent(JSON.stringify(body)), { status: 200 });

const success = (data: unknown) => ({
  result: { code: 'CF-00000', message: '성공', extraMessage: '', transactionId: 'tx' },
  data,
});

describe('CodefClient', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('토큰을 발급받아 Bearer 로 요청하고, URL 인코딩된 응답의 data 를 돌려준다', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(codefResponse(success({ memo: '이자 원가 1+1' })));
    const client = new CodefClient(config);

    const data = await client.request('/v1/test', { organization: '0004', name: '홍 길동' });

    expect(data).toEqual({ memo: '이자 원가 1+1' });
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe('https://oauth.codef.io/oauth/token');
    expect(new Headers(tokenInit?.headers).get('Authorization')).toBe(
      `Basic ${Buffer.from('client-id:client-secret').toString('base64')}`,
    );
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('https://development.codef.io/v1/test');
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer token-1');
    expect(JSON.parse(decodeURIComponent(String(init?.body)))).toEqual({
      organization: '0004',
      name: '홍 길동',
    });
  });

  it('응답의 + 는 공백으로 디코딩한다', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(encodeURIComponent(JSON.stringify(success({ memo: 'a b' }))).replace('%20', '+')),
      );

    await expect(new CodefClient(config).request('/v1/test', {})).resolves.toEqual({ memo: 'a b' });
  });

  it('토큰은 만료 전까지 재사용하고, 동시에 요청해도 한 번만 발급한다', async () => {
    fetchMock.mockImplementation(async (input) =>
      String(input).includes('oauth') ? tokenResponse() : codefResponse(success({})),
    );
    const client = new CodefClient(config);

    await Promise.all([client.request('/v1/a', {}), client.request('/v1/b', {})]);
    await client.request('/v1/c', {});

    const tokenCalls = fetchMock.mock.calls.filter(([input]) => String(input).includes('oauth'));
    expect(tokenCalls).toHaveLength(1);
  });

  it('결과 코드가 CF-00000 이 아니면 CodefError 를 던진다', async () => {
    fetchMock.mockResolvedValueOnce(tokenResponse()).mockResolvedValueOnce(
      codefResponse({
        result: { code: 'CF-12100', message: '인증서 비밀번호 오류', extraMessage: '' },
        data: {},
      }),
    );

    const error = await new CodefClient(config).request('/v1/test', {}).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(CodefError);
    expect(error).toMatchObject({ code: 'CF-12100' });
  });

  it('401 을 받으면 다음 요청에서 토큰을 다시 발급한다', async () => {
    fetchMock
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(codefResponse(success({})));
    const client = new CodefClient(config);

    await expect(client.request('/v1/test', {})).rejects.toMatchObject({ code: 'HTTP-401' });
    await expect(client.request('/v1/test', {})).resolves.toEqual({});
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('클라이언트 키나 커넥티드 아이디가 없으면 호출 전에 알려 준다', async () => {
    const client = new CodefClient({ ...config, clientId: '', connectedId: '' });

    await expect(client.request('/v1/test', {})).rejects.toThrow('CODEF_CLIENT_ID');
    expect(() => client.connectedId).toThrow('CODEF_CONNECTED_ID');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('공개키로 RSA 암호화한다', () => {
    const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const client = new CodefClient({
      ...config,
      publicKey: publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
    });

    const encrypted = client.encrypt('password');

    // 2048비트 키의 암호문은 256바이트이고, PKCS#1 v1.5 패딩은 매번 다른 값을 만든다.
    expect(Buffer.from(encrypted, 'base64')).toHaveLength(256);
    expect(client.encrypt('password')).not.toBe(encrypted);
  });
});
