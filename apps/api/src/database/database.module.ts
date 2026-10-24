import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { type Db, MongoClient } from 'mongodb';

export const MONGO_CLIENT = Symbol('MONGO_CLIENT');
export const MONGO_DB = Symbol('MONGO_DB');

/**
 * 환경 변수의 접속 URI 로 MongoDB 클라이언트를 만든다.
 * DB 없이는 기능이 동작하지 않으므로 URI 가 없으면 앱 시작 단계에서 실패시킨다.
 * 드라이버가 첫 명령을 보낼 때 접속하므로 여기서 connect 를 호출하지 않는다.
 */
function mongoClientFromEnv(env: NodeJS.ProcessEnv = process.env): MongoClient {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI 환경 변수가 필요합니다.');
  }
  return new MongoClient(uri);
}

/** MongoDB 연결을 앱 전체에 제공하는 모듈. 다른 모듈은 MONGO_DB 를 주입받아 컬렉션을 연다. */
@Global()
@Module({
  providers: [
    { provide: MONGO_CLIENT, useFactory: () => mongoClientFromEnv() },
    {
      provide: MONGO_DB,
      inject: [MONGO_CLIENT],
      // 이름을 생략하면 URI 경로의 DB 를 쓴다.
      useFactory: (client: MongoClient): Db => client.db(process.env.MONGODB_DB_NAME),
    },
  ],
  exports: [MONGO_DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
