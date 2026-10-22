interface ImportMetaEnv {
  /** API 서버 주소 (예: https://api.rich.gun.kim). 없으면 http://localhost:3000 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
