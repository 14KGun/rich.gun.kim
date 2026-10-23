import { Link, NavLink } from 'react-router'
import { Icon } from '../../components/Icon/Icon.tsx'
import { NAV_GROUPS } from '../../navigation.ts'
import styles from './Sidebar.module.css'

type SidebarProps = {
  // 좁은 화면에서는 드로어로 동작한다.
  isMobile: boolean
  open: boolean
  onClose: () => void
}

export function Sidebar({ isMobile, open, onClose }: SidebarProps) {
  const className = [styles.sidebar, isMobile && styles.drawer, open && styles.open].filter(Boolean).join(' ')

  return (
    // 닫힌 드로어는 화면 밖에 있으므로 포커스와 보조기기에서 제외한다.
    <nav aria-label="주 메뉴" className={className} inert={isMobile && !open}>
      <div className={styles.top}>
        <Link to="/" className={styles.logo} onClick={onClose}>
          rich.gun.kim
        </Link>
        {isMobile && (
          <button type="button" className={styles.closeButton} aria-label="메뉴 닫기" onClick={onClose}>
            <Icon name="x-mark" size={20} />
          </button>
        )}
      </div>
      <div className={styles.menu}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className={styles.group}>
            <div className={styles.groupLabel}>{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => (isActive ? `${styles.item} ${styles.active}` : styles.item)}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} size={20} />
                    <span className={styles.itemLabel}>{item.label}</span>
                    {isActive && <span className={styles.activeDot} />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
    </nav>
  )
}
