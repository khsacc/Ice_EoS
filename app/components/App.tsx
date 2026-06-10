'use client';
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import EosCalculator from './EosCalculator';
import type { IcePolymorph, Molecule } from '../lib/literature';
import * as styles from '../page.css';

export default function App() {
  const [molecule, setMolecule] = useState<Molecule>('H2O');
  const [polymorph, setPolymorph] = useState<IcePolymorph>('Ih');

  return (
    <div className={styles.appWrapper}>
      <Header />
      <div className={styles.layout}>
        <Sidebar
          molecule={molecule}
          polymorph={polymorph}
          onSelect={(mol, p) => { setMolecule(mol); setPolymorph(p); }}
        />
        <main className={styles.main}>
          <EosCalculator molecule={molecule} polymorph={polymorph} />
        </main>
      </div>
      <Footer />
    </div>
  );
}
