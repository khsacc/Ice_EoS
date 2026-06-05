'use client';
import { useState, useEffect, useRef } from 'react';
import { LITERATURE, POLYMORPH_LABELS, MOLECULE_LABELS, POLYMORPH_Z, MOLAR_MASS } from '../lib/literature';
import { computeVolume } from '../lib/eos';
import type { IcePolymorph, Molecule } from '../lib/literature';
import {
  type TempUnit, type VolumeUnit,
  TEMP_UNIT_LABELS, VOLUME_UNIT_LABELS, VOLUME_UNITS, VOLUME_UNIT_DECIMALS,
  toKelvin, fromMolar,
} from '../lib/units';
import LiteratureSelect from './LiteratureSelect';
import * as s from './Tab.css';

interface Props {
  molecule: Molecule;
  polymorph: IcePolymorph;
}

export default function TabTPtoV({ molecule, polymorph }: Props) {
  const entries = LITERATURE[polymorph].filter((e) => e.molecule === molecule);

  const [refId, setRefId] = useState(entries[0]?.id ?? '');
  const [T, setT] = useState('');
  const [P, setP] = useState('');
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [result, setResult] = useState<{ V: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const selected = entries.find((e) => e.id === refId) ?? entries[0];
  const isIsothermal = selected?.isothermal === true;
  const isSeaFreeze = selected?.eosType === 'SeaFreeze';

  const Z = POLYMORPH_Z[polymorph];
  const M = MOLAR_MASS[molecule];
  const outputUnits: VolumeUnit[] = VOLUME_UNITS;

  useEffect(() => {
    if (isIsothermal) setT('');
  }, [isIsothermal, refId]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!selected || P.trim() === '') {
      setResult(null); setError(null); setLoading(false);
      return;
    }

    const Pval = parseFloat(P);
    if (isNaN(Pval)) { setResult(null); setError(null); setLoading(false); return; }

    const T_K = isIsothermal
      ? selected.params?.T_ref ?? 0
      : (() => {
          if (T.trim() === '') return null;
          const v = parseFloat(T);
          return isNaN(v) ? null : toKelvin(v, tempUnit);
        })();

    if (T_K === null) { setResult(null); setError(null); setLoading(false); return; }

    if (isSeaFreeze) {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setResult(null); setError(null);

      fetch('/api/seafreeze', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'TPtoV', T_K, P_GPa: Pval, phase: selected.seafreezePhase }),
      })
        .then((r) => r.json())
        .then((data) => {
          setLoading(false);
          if (data.status === 'ok') {
            const V_molar = (M * 1000) / data.rho_kgm3;
            setResult({ V: V_molar });
          } else {
            setError(data.message ?? 'SeaFreeze error');
          }
        })
        .catch((err: Error) => {
          if (err.name !== 'AbortError') {
            setLoading(false);
            setError(err.message);
          }
        });
      return () => { ctrl.abort(); };
    } else {
      // Synchronous BM3 / Vinet
      try {
        const res = computeVolume(T_K, Pval, selected.params!, selected.eosType);
        setResult({ V: res.V });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    }
  }, [T, P, tempUnit, refId, selected, isIsothermal, isSeaFreeze, M]);

  if (entries.length === 0) {
    return (
      <p className={s.noDataText}>
        No EoS references available for {MOLECULE_LABELS[molecule]} {POLYMORPH_LABELS[polymorph]}.
      </p>
    );
  }

  // V0 display for BM3/Vinet
  const v0Display = (() => {
    if (!selected.params) return null;
    const p = selected.params;
    if (p.V0_reported != null && p.V0_unit && p.V0_unit !== 'molar') {
      const unitLabel = ({ cell: 'Å³', gcm3: 'g/cm³', kgm3: 'kg/m³' } as Record<string, string>)[p.V0_unit] ?? p.V0_unit;
      return `${p.V0_reported} ${unitLabel} (= ${p.V0.toFixed(3)} cm³/mol)`;
    }
    return `${p.V0} cm³/mol`;
  })();

  const fixedTDisplay = isIsothermal && selected.params
    ? (tempUnit === 'K'
        ? `${selected.params.T_ref} K (fixed)`
        : `${(selected.params.T_ref - 273.15).toFixed(2)} °C (fixed)`)
    : null;

  return (
    <div className={s.tabContent}>
      <LiteratureSelect entries={entries} value={refId} onChange={setRefId} />

      <div className={s.paramsBox}>
        {isSeaFreeze ? (
          <>
            <strong>Gibbs energy (LBF) · SeaFreeze</strong>
            {selected.notes && <span> · {selected.notes}</span>}
          </>
        ) : selected.params ? (
          <>
            <strong>EoS parameters ({selected.eosType}):</strong>{' '}
            V₀ = {v0Display} · T_ref = {selected.params.T_ref} K ·
            K₀ = {selected.params.K0} GPa · K₀′ = {selected.params.K0p}
            {!isIsothermal && ` · α = ${selected.params.alpha.toExponential(1)} K⁻¹`}
          </>
        ) : null}
      </div>

      {!isSeaFreeze && selected.notes && <p className={s.noteText}>{selected.notes}</p>}

      <div className={s.inputGrid}>
        {/* Temperature */}
        <div className={s.fieldWrapper}>
          <div className={s.fieldHeader}>
            <label className={s.fieldLabel}>Temperature</label>
            {!isIsothermal && (
              <div className={s.unitToggleGroup}>
                {(['K', 'C'] as TempUnit[]).map((u) => (
                  <button
                    key={u}
                    className={s.unitToggleBtn[tempUnit === u ? 'active' : 'inactive']}
                    onClick={() => setTempUnit(u)}
                  >
                    {TEMP_UNIT_LABELS[u]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            className={s.input}
            type={isIsothermal ? 'text' : 'number'}
            disabled={isIsothermal}
            value={isIsothermal ? (fixedTDisplay ?? '') : T}
            onChange={isIsothermal ? undefined : (e) => setT(e.target.value)}
            placeholder={
              isIsothermal
                ? undefined
                : tempUnit === 'K'
                ? (selected.params ? String(selected.params.T_ref) : '250')
                : (selected.params ? String(Math.round(selected.params.T_ref - 273.15)) : '-23')
            }
          />
        </div>

        {/* Pressure */}
        <div className={s.fieldWrapper}>
          <div className={s.fieldHeader}>
            <label className={s.fieldLabel}>Pressure (GPa)</label>
          </div>
          <input
            className={s.input}
            type="number"
            value={P}
            onChange={(e) => setP(e.target.value)}
            placeholder={selected.params ? String(selected.params.P_ref) : '0.3'}
          />
        </div>
      </div>

      {loading && <p className={s.loadingText}>Calculating via SeaFreeze…</p>}
      {error && <div className={s.messageBox.error}>{error}</div>}

      {result && (
        <div className={s.messageBox.result}>
          <p className={s.resultTitle}>Volume / Density</p>
          {outputUnits.map((unit, i) => {
            const val = fromMolar(result.V, unit, Z, M);
            const isLast = i === outputUnits.length - 1;
            return (
              <div key={unit} className={isLast ? s.resultRowLast : s.resultRow}>
                <span>{VOLUME_UNIT_LABELS[unit]}</span>
                <span className={s.resultValue}>
                  {val.toFixed(VOLUME_UNIT_DECIMALS[unit])}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className={s.footerNote}>
        {isSeaFreeze
          ? 'SeaFreeze · Journaux et al. (2020) Gibbs LBF representation'
          : `${selected.eosType} EoS${!isIsothermal ? ' · V₀(T) = V₀ · (1 + α(T − T_ref))' : ''}`}
        {' '}· unit cell Z = {Z}
      </p>
    </div>
  );
}
