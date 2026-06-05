'use client';
import { useState } from 'react';
import TabTPtoV from './TabTPtoV';
import TabTVtoP from './TabTVtoP';
import type { IcePolymorph, Molecule } from '../lib/literature';
import { LITERATURE, POLYMORPH_LABELS, MOLECULE_LABELS } from '../lib/literature';
import * as styles from './EosCalculator.css';

type Tab = 'TPtoV' | 'TVtoP';

interface Props {
  molecule: Molecule;
  polymorph: IcePolymorph;
}

export default function EosCalculator({ molecule, polymorph }: Props) {
  const entries = LITERATURE[polymorph].filter((e) => e.molecule === molecule);
  const [tab, setTab] = useState<Tab>('TPtoV');
  const [refId, setRefId] = useState(entries[0]?.id ?? '');

  const selected = entries.find((e) => e.id === refId) ?? entries[0];
  const isFortesPowerExp = selected?.eosType === 'FortesPowerExp';

  function handleRefChange(id: string) {
    setRefId(id);
    // If the new selection is P=0 only, force back to T,P→V tab
    const entry = entries.find((e) => e.id === id);
    if (entry?.eosType === 'FortesPowerExp') setTab('TPtoV');
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        {MOLECULE_LABELS[molecule]} {POLYMORPH_LABELS[polymorph]} — Equation of State
      </h1>

      <div className={styles.tabBar}>
        <button
          className={styles.tabBtn[tab === 'TPtoV' ? 'active' : 'inactive']}
          onClick={() => setTab('TPtoV')}
        >
          T, P → V
        </button>
        <button
          className={styles.tabBtn[isFortesPowerExp ? 'disabled' : tab === 'TVtoP' ? 'active' : 'inactive']}
          disabled={isFortesPowerExp}
          onClick={() => { if (!isFortesPowerExp) setTab('TVtoP'); }}
          title={isFortesPowerExp ? 'Not available: this model is defined at P = 0 GPa only' : undefined}
        >
          T, V → P
        </button>
      </div>

      {tab === 'TPtoV' ? (
        <TabTPtoV
          key={`TPtoV-${molecule}-${polymorph}`}
          molecule={molecule}
          polymorph={polymorph}
          refId={refId}
          onRefChange={handleRefChange}
        />
      ) : (
        <TabTVtoP
          key={`TVtoP-${molecule}-${polymorph}`}
          molecule={molecule}
          polymorph={polymorph}
          refId={refId}
          onRefChange={handleRefChange}
        />
      )}
    </div>
  );
}
