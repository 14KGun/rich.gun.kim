import { createHash, createHmac, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const API_HOST = 'https://api.upbit.com';

/** 사용자가 업비트에서 발급받은 API Key. 사용자마다 다르므로 호출할 때마다 넘긴다. */
export interface UpbitCredentials {
  accessKey: string;
  secretKey: string;
}

const errorResponseSchema = z.object({
  error: z.object({
    // 시세 API 는 이름 대신 상태 코드 숫자(예: 404)를 주기도 한다.
    name: z.union([z.string(), z.number()]).transform(String),
    // 인증 오류(예: invalid_access_key)는 message 없이 오기도 한다.
    message: z.string().optional(),
  }),
});

/** 업비트가 2xx 가 아닌 응답을 돌려줬을 때 던지는 오류 */
export class UpbitError extends Error {
  constructor(
    readonly status: number,
    /** 업비트 오류 이름 (예: no_authorization_ip, out_of_scope, invalid_query_payload) */
    readonly code: string,
    message: string,
  ) {
    super(`[${status} ${code}] ${message}`);
    this.name = 'UpbitError';
  }
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');

/** 업비트 인증 토큰(JWT, HS512)을 만든다. 요청마다 새 nonce 를 쓴다. */
function createToken({ accessKey, secretKey }: UpbitCredentials, queryString: string): string {
  const header = base64url(JSON.stringify({ alg: 'HS512', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      access_key: accessKey,
      nonce: randomUUID(),
      // 쿼리가 있을 때만 넣는다. 실제로 보내는 쿼리 문자열과 같은 순서·인코딩이어야 한다.
      ...(queryString && {
        query_hash: sha512Hex(queryString),
        query_hash_alg: 'SHA512',
      }),
    }),
  );
  // Secret Key 는 Base64 인코딩되어 있지 않으므로 그대로 서명 키로 쓴다.
  const signature = createHmac('sha512', secretKey).update(`${header}.${payload}`).digest();
  return `${header}.${payload}.${base64url(signature)}`;
}

function sha512Hex(value: string): string {
  return createHash('sha512').update(value, 'utf8').digest('hex');
}

/** 요청/응답 처리와 인증 토큰 생성 등 업비트 호출의 공통 부분 */
@Injectable()
export class UpbitClient {
  /**
   * GET 요청을 보내고 응답 JSON 을 돌려준다.
   * credentials 가 있으면 인증 토큰을 붙인다 (Exchange API). 시세(Quotation) API 는 생략한다.
   */
  async get(
    path: string,
    query: Record<string, string> = {},
    credentials?: UpbitCredentials,
  ): Promise<unknown> {
    const queryString = new URLSearchParams(query).toString();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (credentials) {
      headers.Authorization = `Bearer ${createToken(credentials, queryString)}`;
    }

    const response = await fetch(`${API_HOST}${path}${queryString ? `?${queryString}` : ''}`, {
      headers,
    });
    const body: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const error = errorResponseSchema.safeParse(body);
      throw new UpbitError(
        response.status,
        error.success ? error.data.error.name : 'unknown',
        (error.success && error.data.error.message) || `업비트 요청 실패: ${path}`,
      );
    }
    return body;
  }
}
