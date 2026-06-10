'use client';
import { useState, useEffect, useRef } from 'react';
import { LITERATURE, POLYMORPH_LABELS, MOLECULE_LABELS, POLYMORPH_Z, MOLAR_MASS } from '../lib/literature';
import { computePressure, computePressureMurnaghan } from '../lib/eos';
import type { IcePolymorph, Molecule } from '../lib/literature';
import {
  type TempUnit, type VolumeUnit,
  TEMP_UNIT_LABELS, VOLUME_UNIT_LABELS, VOLUME_UNITS, VOLUME_UNIT_DECIMALS,
  toKelvin, toMolar, fromMolar,
} from '../lib/units';
import LiteratureSelect from './LiteratureSelect';
import * as s from './Tab.css';

interface Props {
  molecule: Molecule;
  polymorph: IcePolymorph;
  refId: string;
  onRefChange: (id: string) => void;
}

export default function TabTVtoP({ molecule, polymorph, refId, onRefChange }: Props) {
  // FortesPowerExp entries are P=0 only and cannot appear in T,V→P
  const entries = LITERATURE[polymorph].filter(
    (e) => e.molecule === molecule && e.eosType !== 'FortesPowerExp',
  );

  const [T, setT] = useState('');
  const [V, setV] = useState('');
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [volUnit, setVolUnit] = useState<VolumeUnit>('molar');
  const [result, setResult] = useState<{ P: number; V_molar: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const selected = entries.find((e) => e.id === refId) ?? entries[0];
  const isIsothermal = selected?.isothermal === true;
  const isSeaFreeze = selected?.eosType === 'SeaFreeze';
  const isMurnaghan = selected?.eosType === 'Murnaghan';
  const isVinetAG = selected?.eosType === 'VinetAG';
  const isBM3Thermal = selected?.eosType === 'BM3Thermal';
  const Z = POLYMORPH_Z[polymorph];
  const M = MOLAR_MASS[molecule];

  useEffect(() => {
    if (isIsothermal) setT('');
  }, [isIsothermal, refId]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!selected || V.trim() === '') {
      setResult(null); setError(null); setLoading(false);
      return;
    }

    const Vval = parseFloat(V);
    if (isNaN(Vval) || Vval <= 0) { setResult(null); setError(null); setLoading(false); return; }

    const T_K = isIsothermal
      ? selected.params?.T_ref ?? 0
      : (() => {
          if (T.trim() === '') return null;
          const v = parseFloat(T);
          return isNaN(v) ? null : toKelvin(v, tempUnit);
        })();

    if (T_K === null) { setResult(null); setError(null); setLoading(false); return; }

    const V_molar = toMolar(Vval, volUnit, Z, M);

    if (isSeaFreeze) {
      const rho_kgm3 = (M * 1000) / V_molar;
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      setResult(null); setError(null);

      fetch('/api/seafreeze', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'TVtoP', T_K, rho_kgm3, phase: selected.seafreezePhase }),
      })
        .then((r) => r.json())
        .then((data) => {
          setLoading(false);
          if (data.status === 'ok') {
            setResult({ P: data.P_GPa, V_molar });
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
    } else if (isMurnaghan) {
      try {
        const P = computePressureMurnaghan(T_K, V_molar, selected.murnaghanParams!);
        setResult({ P, V_molar });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    } else {
      try {
        const res = computePressure(T_K, V_molar, selected.params!, selected.eosType);
        setResult({ P: res.P, V_molar });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    }
  }, [T, V, tempUnit, volUnit, refId, selected, isIsothermal, isSeaFreeze, isMurnaghan, isVinetAG, isBM3Thermal, Z, M]);

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

  // V placeholder in current unit
  const v0InUnit = isMurnaghan && selected.murnaghanParams
    ? fromMolar(selected.murnaghanParams.V_ref, volUnit, Z, M)
    : selected.params
    ? fromMolar(selected.params.V0, volUnit, Z, M)
    : null;
  const placeholderV = v0InUnit != null ? v0InUnit.toFixed(VOLUME_UNIT_DECIMALS[volUnit]) : '';

  return (
    <div className={s.tabContent}>
      <LiteratureSelect entries={entries} value={refId} onChange={onRefChange} />

      <div className={s.paramsBox}>
        {isSeaFreeze ? (
          <>
            <strong>Gibbs energy (LBF) · SeaFreeze</strong>
            {selected.notes && <span> · {selected.notes}</span>}
          </>
        ) : isMurnaghan && selected.murnaghanParams ? (
          <>
            <strong>EoS parameters (Murnaghan PVT):</strong>{' '}
            V₁.₂₅,₂₂₅ = {selected.murnaghanParams.V_ref.toFixed(3)} cm³/mol ·
            K₁.₂₅,₂₂₅ = {selected.murnaghanParams.K_ref} GPa ·
            ∂K/∂T = {selected.murnaghanParams.dKdT} GPa/K ·
            K′ = {selected.murnaghanParams.Kp}
          </>
        ) : isVinetAG && selected.params ? (
          <>
            <strong>EoS parameters (Vinet + Anderson-Grüneisen):</strong>{' '}
            V₀ = {v0Display} · T_ref = {selected.params.T_ref} K ·
            K₀ = {selected.params.K0} GPa · K₀′ = {selected.params.K0p} ·
            α₀ = {selected.params.alpha.toExponential(2)} K⁻¹ · δ_T = {selected.params.deltaT}
          </>
        ) : isBM3Thermal && selected.params ? (
          <>
            <strong>EoS parameters (BM3 thermal, Berman 1988):</strong>{' '}
            V₀ = {v0Display} · T_ref = {selected.params.T_ref} K ·
            K₀ = {selected.params.K0} GPa · K₀′ = {selected.params.K0p} ·
            α₀ = {selected.params.alpha.toExponential(2)} K⁻¹ · α₁ = {(selected.params.alpha1 ?? 0).toExponential(2)} K⁻² ·
            dK/dT = {selected.params.dKdT} GPa/K
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
                ? (isMurnaghan ? String(selected.murnaghanParams!.T_ref) : selected.params ? String(selected.params.T_ref) : '250')
                : (isMurnaghan ? String(Math.round(selected.murnaghanParams!.T_ref - 273.15)) : selected.params ? String(Math.round(selected.params.T_ref - 273.15)) : '-23')
            }
          />
        </div>

        {/* Volume / Density */}
        <div className={s.fieldWrapper}>
          <div className={s.fieldHeader}>
            <label className={s.fieldLabel}>Volume / Density</label>
            <select
              className={s.unitSelect}
              value={volUnit}
              onChange={(e) => { setVolUnit(e.target.value as VolumeUnit); setV(''); }}
            >
              {VOLUME_UNITS.map((u) => (
                <option key={u} value={u}>{VOLUME_UNIT_LABELS[u]}</option>
              ))}
            </select>
          </div>
          <input
            className={s.input}
            type="number"
            value={V}
            onChange={(e) => setV(e.target.value)}
            placeholder={placeholderV}
          />
        </div>
      </div>

      {loading && <p className={s.loadingText}>Calculating via SeaFreeze…</p>}
      {error && <div className={s.messageBox.error}>{error}</div>}

      {result && (
        <div className={s.messageBox.result}>
          <p className={s.resultTitle}>Pressure</p>
          <div className={s.resultRow}>
            <span>P (GPa)</span>
            <span className={s.resultValue}>{result.P.toFixed(4)}</span>
          </div>
          <div className={s.resultRowLast}>
            <span>V (cm³/mol)</span>
            <span className={s.resultValue}>{result.V_molar.toFixed(4)}</span>
          </div>
        </div>
      )}

      <p className={s.footerNote}>
        {isSeaFreeze
          ? 'SeaFreeze · Journaux et al. (2020) Gibbs LBF representation'
          : isMurnaghan
          ? 'Murnaghan PVT · P = P_ref + (K(T)/K′)·[(V_ref(T)/V)^K′ − 1]'
          : isVinetAG
          ? 'VinetAG · P_th = α₀·(V/V₀)^δ_T · K_T(V) · (T − T_ref)'
          : isBM3Thermal
          ? 'BM3 thermal · V_T0=V₀[1+α₀ΔT+½α₁ΔT²] · K_T0=K₀+(dK/dT)ΔT'
          : `${selected.eosType} EoS${!isIsothermal ? ' · V₀(T) = V₀ · (1 + α(T − T_ref))' : ''}`}
        {' '}· unit cell Z = {Z}
      </p>
    </div>
  );
}
