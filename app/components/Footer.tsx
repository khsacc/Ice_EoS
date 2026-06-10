import Link from 'next/link';
import * as styles from './Footer.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.credit}>
            Water Ice EoS Dictionary · Hiroki Kobayashi (GcRC, UTokyo)
          </span>
          <span className={styles.contact}>
            To add literature values or report issues, feel free to reach out via{' '}
            <a href="mailto:hiroki@eqchem.s.u-tokyo.ac.jp" className={styles.contactLink}>
              email
            </a>
            {' '}or{' '}
            <a
              href="https://github.com/khsacc/Ice_EoS/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              GitHub Issues
            </a>
            .
          </span>
          <span className={styles.license}>
            Licensed under the{' '}
            <a
              href="https://github.com/khsacc/Ice_EoS/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
            >
              GNU General Public License v3.0
            </a>
            .
          </span>
        </div>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Calculator</Link>
          <Link href="/references" className={styles.navLink}>Reference List</Link>
        </nav>
      </div>
    </footer>
  );
}
