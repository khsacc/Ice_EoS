import Link from 'next/link';
import * as styles from './Header.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.titleBlock}>
          <h1 className={styles.titleRow}>
            <span className={styles.title}>Water Ice EoS Dictionary</span>
            <Link href="/references" className={styles.titleRefLink}>
              → Reference List
            </Link>
          </h1>
          <p className={styles.subtitle}>
            Summary of the published equations of state of water ice, edited by Hiroki Kobayashi (GcRC, UTokyo) ·{' '}
            <a
              href="mailto:hiroki@eqchem.s.u-tokyo.ac.jp"
              className={styles.emailLink}
            >
              hiroki@eqchem.s.u-tokyo.ac.jp
            </a>
          </p>
          <p className={styles.contact}>
            To add literature values or report issues, feel free to reach out via email or{' '}
            <a
              href="https://github.com/khsacc/Ice_EoS/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.emailLink}
            >
              GitHub Issues
            </a>
            .
          </p>
        </div>
        <a
          href="https://github.com/khsacc/Ice_EoS"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.githubBtn}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          GitHub
        </a>
      </div>
    </header>
  );
}
