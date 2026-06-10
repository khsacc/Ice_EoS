import { LITERATURE, POLYMORPHS, POLYMORPH_LABELS, MOLECULE_LABELS } from '../lib/literature';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { Metadata } from 'next';
import * as styles from './page.css';

export const metadata: Metadata = {
  title: 'Reference List',
  description:
    'Full bibliography of all equation-of-state parameter sets in the Water Ice EoS Dictionary, grouped by ice polymorph (Ih, II, III, V, VI, VII, VIII, X).',
  alternates: { canonical: '/references' },
  openGraph: {
    title: 'Reference List | Water Ice EoS Dictionary',
    description:
      'Full bibliography of all equation-of-state parameter sets in the Water Ice EoS Dictionary, grouped by ice polymorph.',
    url: '/references',
  },
  twitter: {
    title: 'Reference List | Water Ice EoS Dictionary',
    description:
      'Full bibliography of all equation-of-state parameter sets in the Water Ice EoS Dictionary, grouped by ice polymorph.',
  },
};

export default function ReferencesPage() {
  return (
    <div className={styles.pageWrapper}>
      <Header navLink={{ href: '/', label: '→ Calculator' }} />
      <main className={styles.main}>
        <h1 className={styles.heading}>Reference List</h1>
        <p className={styles.lead}>
          All equation-of-state parameter sets currently in the database, grouped by ice polymorph.
        </p>

        {POLYMORPHS.map((polymorph) => {
          const entries = LITERATURE[polymorph];
          if (!entries || entries.length === 0) return null;

          // Group entries by publication (doi if available, otherwise fullRef)
          const pubMap = new Map<string, typeof entries>();
          for (const entry of entries) {
            const key = entry.doi ?? entry.fullRef;
            if (!pubMap.has(key)) pubMap.set(key, []);
            pubMap.get(key)!.push(entry);
          }

          return (
            <section key={polymorph} className={styles.section}>
              <h2 className={styles.sectionTitle}>{POLYMORPH_LABELS[polymorph]}</h2>
              {Array.from(pubMap.values()).map((group) => {
                const rep = group[0];
                const cardContent = (
                  <>
                    <p className={styles.entryRef}>{rep.fullRef}</p>
                    {rep.doi && (
                      <span className={styles.doiText}>DOI: {rep.doi}</span>
                    )}
                    {group.map((entry) => (
                      <div key={entry.id} className={styles.entryMeta}>
                        <span className={styles.badge}>{MOLECULE_LABELS[entry.molecule]}</span>
                        <span className={styles.badge}>{entry.eosType}</span>
                        {entry.notes && <span className={styles.notes}>{entry.notes}</span>}
                      </div>
                    ))}
                  </>
                );
                return rep.doi ? (
                  <a
                    key={rep.doi}
                    href={`https://doi.org/${rep.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.entryCardLink}
                  >
                    {cardContent}
                  </a>
                ) : (
                  <div key={rep.fullRef} className={styles.entryCard}>
                    {cardContent}
                  </div>
                );
              })}
            </section>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
