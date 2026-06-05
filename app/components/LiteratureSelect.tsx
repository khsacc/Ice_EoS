'use client';
import type { LiteratureEntry } from '../lib/literature';
import * as styles from './LiteratureSelect.css';

interface Props {
  entries: LiteratureEntry[];
  value: string;
  onChange: (id: string) => void;
}

export default function LiteratureSelect({ entries, value, onChange }: Props) {
  const selected = entries.find((e) => e.id === value) ?? entries[0];

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>Literature Reference</label>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {entries.map((e) => (
          <option key={e.id} value={e.id}>
            {e.citation}
          </option>
        ))}
      </select>
      <p className={styles.fullRef}>{selected.fullRef}</p>
    </div>
  );
}
