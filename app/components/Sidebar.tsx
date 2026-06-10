'use client';
import { POLYMORPHS, POLYMORPH_LABELS, MOLECULE_LABELS, LITERATURE } from '../lib/literature';
import type { IcePolymorph, Molecule } from '../lib/literature';
import * as styles from './Sidebar.css';

interface Props {
  molecule: Molecule;
  polymorph: IcePolymorph;
  onSelect: (molecule: Molecule, polymorph: IcePolymorph) => void;
}

const MOLECULES: Molecule[] = ['H2O', 'D2O'];

export default function Sidebar({ molecule, polymorph, onSelect }: Props) {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {MOLECULES.map((mol, i) => (
          <div key={mol}>
            {i > 0 && <div className={styles.sectionDivider} />}
            <p className={styles.sectionHeader}>{MOLECULE_LABELS[mol]}</p>
            {POLYMORPHS.filter((p) =>
              LITERATURE[p]?.some((e) => e.molecule === mol)
            ).map((p) => (
              <button
                key={p}
                onClick={() => onSelect(mol, p)}
                className={
                  styles.navItem[
                    molecule === mol && polymorph === p ? 'active' : 'default'
                  ]
                }
              >
                {POLYMORPH_LABELS[p]}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
