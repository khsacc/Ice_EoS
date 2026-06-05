import Link from 'next/link';
import { LITERATURE, POLYMORPHS, POLYMORPH_LABELS, MOLECULE_LABELS } from '../lib/literature';
import type { Metadata } from 'next';
import * as styles from './page.css';

export const metadata: Metadata = {
  title: 'Reference List — Ice EoS Calculator',
};

export default function ReferencesPage() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          ← Back to calculator
        </Link>
        <h1 className={styles.heading}>Reference List</h1>
        <p className={styles.lead}>
          All equation-of-state parameter sets currently in the database, grouped by ice polymorph.
        </p>

        {POLYMORPHS.map((polymorph) => {
          const entries = LITERATURE[polymorph];
          if (!entries || entries.length === 0) return null;
          return (
            <section key={polymorph} className={styles.section}>
              <h2 className={styles.sectionTitle}>{POLYMORPH_LABELS[polymorph]}</h2>
              {entries.map((entry) => (
                <div key={entry.id} className={styles.entryCard}>
                  <p className={styles.entryRef}>{entry.fullRef}</p>
                  <div className={styles.entryMeta}>
                    <span className={styles.badge}>{MOLECULE_LABELS[entry.molecule]}</span>
                    <span className={styles.badge}>{entry.eosType}</span>
                    {entry.doi && (
                      <a
                        href={`https://doi.org/${entry.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.doiLink}
                      >
                        DOI: {entry.doi}
                      </a>
                    )}
                  </div>
                  {entry.notes && <p className={styles.notes}>{entry.notes}</p>}
                </div>
              ))}
            </section>
          );
        })}
      </main>
    </div>
  );
}
