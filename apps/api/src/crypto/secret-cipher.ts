import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
/** GCM 권장 IV 길이 */
const IV_BYTES = 12;

/** SecretCipher 로 암호화한 값. 바이너리는 base64 문자열로 저장한다. */
export const encryptedValueSchema = z.object({
  /** 암호화에 쓴 키의 버전. 키를 교체할 때 어떤 키로 풀어야 하는지 구분한다. */
  keyVersion: z.number().int().positive(),
  iv: z.string(),
  tag: z.string(),
  data: z.string(),
});

export type EncryptedValue = z.infer<typeof encryptedValueSchema>;

interface CipherKey {
  version: number;
  key: Buffer;
}

/**
 * 커넥티드 아이디, API Key 같은 외부 연동 비밀값을 DB 에 저장하기 전에 AES-256-GCM 으로 암호화한다.
 * 키는 SECRET_ENCRYPTION_KEY(32바이트를 base64 로 인코딩한 값)에서 읽는다.
 * 키가 없어도 앱은 뜰 수 있도록 실제로 암호화·복호화할 때 검사한다.
 */
@Injectable()
export class SecretCipher {
  private cached?: CipherKey;

  encrypt(plaintext: string): EncryptedValue {
    const { version, key } = this.currentKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return {
      keyVersion: version,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: data.toString('base64'),
    };
  }

  /** 값이 변조되었거나 다른 키로 암호화되었으면 예외를 던진다. */
  decrypt(value: EncryptedValue): string {
    const { version, key } = this.currentKey();
    if (value.keyVersion !== version) {
      throw new Error(`키 버전 ${value.keyVersion} 로 암호화된 값은 풀 수 없습니다 (현재 ${version}).`);
    }
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(value.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(value.data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  }

  private currentKey(): CipherKey {
    if (this.cached) return this.cached;

    const key = Buffer.from(process.env.SECRET_ENCRYPTION_KEY ?? '', 'base64');
    if (key.length !== KEY_BYTES) {
      throw new Error(`SECRET_ENCRYPTION_KEY 는 ${KEY_BYTES}바이트 키를 base64 로 인코딩한 값이어야 합니다.`);
    }
    const version = Number(process.env.SECRET_ENCRYPTION_KEY_VERSION ?? '1');
    if (!Number.isInteger(version) || version < 1) {
      throw new Error('SECRET_ENCRYPTION_KEY_VERSION 은 1 이상의 정수여야 합니다.');
    }
    this.cached = { version, key };
    return this.cached;
  }
}
