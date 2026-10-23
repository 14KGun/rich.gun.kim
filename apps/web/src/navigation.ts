import type { IconName } from './components/Icon/Icon.tsx'

// 사이드바 메뉴 정의. 라우트도 이 목록을 기준으로 만든다.
export type NavItem = {
  path: string
  label: string
  icon: IconName
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: '대시보드',
    items: [
      { path: '/dashboard/watchlist', label: '관심 종목', icon: 'star' },
      { path: '/dashboard/overview', label: '내 자산 현황', icon: 'chart-pie' },
    ],
  },
  {
    label: '자산',
    items: [
      { path: '/assets/holdings', label: '내 자산', icon: 'currency-circle-dollar' },
      { path: '/assets/spending', label: '내 지출', icon: 'chart-bar' },
    ],
  },
  {
    label: '수집기',
    items: [
      { path: '/collectors/mine', label: '내 데이터 수집', icon: 'database' },
      { path: '/collectors/stock', label: '증권 데이터 수집', icon: 'arrow-down-tray' },
    ],
  },
  {
    label: '외부 연동',
    items: [{ path: '/integrations', label: '외부 연동 관리', icon: 'link' }],
  },
]

export const DEFAULT_PATH = NAV_GROUPS[0].items[0].path

// 현재 경로에 해당하는 메뉴와 그 그룹을 찾는다.
export function findNavEntry(pathname: string): { group: NavGroup; item: NavItem } | null {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((it) => it.path === pathname)
    if (item) {
      return { group, item }
    }
  }
  return null
}
