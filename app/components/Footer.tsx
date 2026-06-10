import Link from 'next/link';
import * as styles from './Footer.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className={styles.credit}>
          Water Ice EoS Dictionary · Hiroki Kobayashi (GcRC, UTokyo)
        </span>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Calculator</Link>
          <Link href="/references" className={styles.navLink}>Reference List</Link>
        </nav>
      </div>
    </footer>
  );
}
