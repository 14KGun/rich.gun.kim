import { constants, createPublicKey, publicEncrypt } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { CODEF_CONFIG, type CodefConfig, type CodefEnvironment } from './codef.config';

const API_HOSTS: Record<CodefEnvironment, string> = {
  sandbox: 'https://sandbox.codef.io',
  development: 'https://development.codef.io',
  production: 'https://api.codef.io',
};
const TOKEN_URL = 'https://oauth.codef.io/oauth/token';
const SUCCESS_CODE = 'CF-00000';
/** 만료 직전 토큰으로 요청하지 않도록 이만큼 일찍 재발급한다. */
const TOKEN_REFRESH_MARGIN_MS = 60_000;

interface AccessToken {
  value: string;
  expiresAt: number;
}

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

const responseSchema = z.object({
  result: z.object({
    code: z.string(),
    message: z.string(),
    extraMessage: z.string().nullish(),
  }),
  data: z.unknown(),
});

/** CODEF 가 성공(CF-00000) 이외의 결과를 돌려줬을 때 던지는 오류 */
export class CodefError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly extraMessage = '',
  ) {
    super(`[${code}] ${message}${extraMessage ? ` (${extraMessage})` : ''}`);
    this.name = 'CodefError';
  }
}

/** CODEF 응답 본문은 URL 인코딩된 JSON 이다 (공백은 '+'). */
function decodeBody(body: string): unknown {
  return JSON.parse(decodeURIComponent(body.replaceAll('+', ' ')));
}

/** 토큰 발급, 요청/응답 인코딩, 결과 코드 검사 등 CODEF 호출의 공통 부분 */
@Injectable()
export class CodefClient {
  private token?: AccessToken;
  private pendingToken?: Promise<AccessToken>;

  constructor(@Inject(CODEF_CONFIG) private readonly config: CodefConfig) {}

  get connectedId(): string {
    if (!this.config.connectedId) {
      throw new Error('CODEF_CONNECTED_ID 가 설정되지 않았습니다. 계정을 먼저 등록하세요.');
    }
    return this.config.connectedId;
  }

  /** 상품 API 를 호출하고 결과 코드를 확인한 뒤 data 를 돌려준다. */
  async request(path: string, body: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${API_HOSTS[this.config.environment]}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
      body: encodeURIComponent(JSON.stringify(body)),
    });
    if (response.status === 401) {
      // 토큰이 서버에서 먼저 만료된 경우. 다음 요청에서 재발급한다.
      this.token = undefined;
    }
    if (!response.ok) {
      throw new CodefError(`HTTP-${response.status}`, `CODEF 요청 실패: ${path}`);
    }

    const { result, data } = responseSchema.parse(decodeBody(await response.text()));
    if (result.code !== SUCCESS_CODE) {
      throw new CodefError(result.code, result.message, result.extraMessage ?? '');
    }
    return data;
  }

  /** 계정 비밀번호 등 CODEF 가 요구하는 값을 공개키로 RSA(PKCS#1 v1.5) 암호화한다. */
  encrypt(plainText: string): string {
    if (!this.config.publicKey) {
      throw new Error('CODEF_PUBLIC_KEY 가 설정되지 않았습니다.');
    }
    return publicEncrypt(
      {
        key: createPublicKey({
          key: Buffer.from(this.config.publicKey, 'base64'),
          format: 'der',
          type: 'spki',
        }),
        padding: constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(plainText, 'utf8'),
    ).toString('base64');
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && this.token.expiresAt - TOKEN_REFRESH_MARGIN_MS > Date.now()) {
      return this.token.value;
    }
    // 동시에 여러 요청이 들어와도 토큰은 한 번만 발급한다.
    this.pendingToken ??= this.issueToken().finally(() => {
      this.pendingToken = undefined;
    });
    this.token = await this.pendingToken;
    return this.token.value;
  }

  private async issueToken(): Promise<AccessToken> {
    const { clientId, clientSecret } = this.config;
    if (!clientId || !clientSecret) {
      throw new Error('CODEF_CLIENT_ID, CODEF_CLIENT_SECRET 이 설정되지 않았습니다.');
    }
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=read',
    });
    if (!response.ok) {
      throw new CodefError(`HTTP-${response.status}`, 'CODEF 토큰 발급 실패');
    }
    const token = tokenResponseSchema.parse(await response.json());
    return { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
  }
}
