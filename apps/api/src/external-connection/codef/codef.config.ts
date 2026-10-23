/** CODEF 서비스 환경. 환경마다 API 호스트와 발급되는 키가 다르다. */
export type CodefEnvironment = 'sandbox' | 'development' | 'production';

export interface CodefConfig {
  environment: CodefEnvironment;
  clientId: string;
  clientSecret: string;
  /** 비밀번호 RSA 암호화에 쓰는 공개키 (키 관리 화면의 base64 문자열) */
  publicKey: string;
}

export const CODEF_CONFIG = Symbol('CODEF_CONFIG');

const ENVIRONMENTS: readonly CodefEnvironment[] = ['sandbox', 'development', 'production'];

/**
 * 환경 변수에서 CODEF 설정을 읽는다.
 * 키가 없어도 앱은 뜰 수 있도록 여기서는 검증하지 않고, CODEF 를 실제로 호출할 때 검사한다.
 */
export function codefConfigFromEnv(env: NodeJS.ProcessEnv = process.env): CodefConfig {
  const environment = env.CODEF_ENVIRONMENT ?? 'development';
  if (!ENVIRONMENTS.includes(environment as CodefEnvironment)) {
    throw new Error(`CODEF_ENVIRONMENT 는 ${ENVIRONMENTS.join(', ')} 중 하나여야 합니다: ${environment}`);
  }
  return {
    environment: environment as CodefEnvironment,
    clientId: env.CODEF_CLIENT_ID ?? '',
    clientSecret: env.CODEF_CLIENT_SECRET ?? '',
    publicKey: env.CODEF_PUBLIC_KEY ?? '',
  };
}
