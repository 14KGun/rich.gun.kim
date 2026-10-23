import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useMediaQuery } from '../../hooks/useMediaQuery.ts'
import { findNavEntry } from '../../navigation.ts'
import styles from './AppLayout.module.css'
import { MobileHeader } from './MobileHeader.tsx'
import { Sidebar } from './Sidebar.tsx'

// 이 너비 미만이면 사이드바를 접고 헤더의 메뉴 버튼으로 연다.
const MOBILE_QUERY = '(max-width: 1023.98px)'

export function AppLayout() {
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const [navOpen, setNavOpen] = useState(false)
  const { pathname } = useLocation()
  // 넓은 화면으로 바뀌면 드로어 상태는 의미가 없다.
  const open = isMobile && navOpen

  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNavOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const closeNav = () => setNavOpen(false)

  return (
    <div className={styles.root}>
      {isMobile && (
        <>
          <MobileHeader title={findNavEntry(pathname)?.item.label ?? ''} onOpenNav={() => setNavOpen(true)} />
          <div className={open ? `${styles.scrim} ${styles.scrimVisible}` : styles.scrim} onClick={closeNav} />
        </>
      )}
      <Sidebar isMobile={isMobile} open={open} onClose={closeNav} />
      <main className={isMobile ? `${styles.main} ${styles.mainMobile}` : styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
