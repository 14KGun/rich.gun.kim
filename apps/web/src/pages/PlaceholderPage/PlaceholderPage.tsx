import { useLocation } from 'react-router'
import { findNavEntry } from '../../navigation.ts'
import styles from './PlaceholderPage.module.css'

// 아직 구현되지 않은 메뉴의 자리 표시 페이지. 그룹명과 메뉴명만 보여 준다.
export function PlaceholderPage() {
  const entry = findNavEntry(useLocation().pathname)

  return (
    <div className={styles.header}>
      <span className={styles.group}>{entry?.group.label}</span>
      <h1 className={styles.title}>{entry?.item.label}</h1>
    </div>
  )
}
