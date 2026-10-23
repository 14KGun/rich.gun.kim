import { Icon } from '../../components/Icon/Icon.tsx'
import styles from './MobileHeader.module.css'

type MobileHeaderProps = {
  title: string
  onOpenNav: () => void
}

// 좁은 화면에서 사이드바 대신 보이는 상단 헤더
export function MobileHeader({ title, onOpenNav }: MobileHeaderProps) {
  return (
    <header className={styles.header}>
      <button type="button" className={styles.menuButton} aria-label="메뉴 열기" onClick={onOpenNav}>
        <Icon name="bars-2" size={24} />
      </button>
      <span className={styles.logo}>rich.gun.kim</span>
      <span className={styles.spacer} />
      <span className={styles.title}>{title}</span>
    </header>
  )
}
