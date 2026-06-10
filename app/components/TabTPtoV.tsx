'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { LITERATURE, POLYMORPH_LABELS, MOLECULE_LABELS, POLYMORPH_Z, MOLAR_MASS } from '../lib/literature';
import { computeVolume, computeVolumeFortes, computeVolumeMurnaghan } from '../lib/eos';
import type { IcePolymorph, Molecule } from '../lib/literature';
import {
  type TempUnit, type VolumeUnit,
  TEMP_UNIT_LABELS, VOLUME_UNIT_LABELS, VOLUME_UNITS, VOLUME_UNIT_DECIMALS,
  toKelvin, fromMolar,
} from '../lib/units';
import {
  resolveParams,
  PRESSURE_UNIT_LABELS, VOLUME_PARAM_UNIT_LABELS, TEMP_PARAM_UNIT_LABELS,
  ALPHA_UNIT_LABELS, ALPHA1_UNIT_LABELS, DKDT_UNIT_LABELS,
} from '../lib/paramUnits';
import LiteratureSelect from './LiteratureSelect';
import * as s from './Tab.css';

interface Props {
  molecule: Molecule;
  polymorph: IcePolymorph;
  refId: string;
  onRefChange: (id: string) => void;
}

export default function TabTPtoV({ molecule, polymorph, refId, onRefChange }: Props) {
  const entries = LITERATURE[polymorph].filter((e) => e.molecule === molecule);
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
  const isFortesPowerExp = selected?.eosType === 'FortesPowerExp';
  const isMurnaghan = selected?.eosType === 'Murnaghan';
  const isVinetAG = selected?.eosType === 'VinetAG';
  const isBM3Thermal = selected?.eosType === 'BM3Thermal';

  const Z = POLYMORPH_Z[polymorph];
  const M = MOLAR_MASS[molecule];
  const outputUnits: VolumeUnit[] = VOLUME_UNITS;

  // Resolve reported string params → numeric EoSParameters for computation + display
  const resolvedParams = useMemo(
    () => selected.params ? resolveParams(selected.params, Z, M) : undefined,
    [selected, Z, M],
  );

  useEffect(() => {
    if (isIsothermal) setT('');
  }, [isIsothermal, refId]);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = null;

    if (!selected) { setResult(null); setError(null); setLoading(false); return; }

    // FortesPowerExp: P is fixed at 0, only T is needed
    if (isFortesPowerExp) {
      if (T.trim() === '') { setResult(null); setError(null); setLoading(false); return; }
      const Tval = parseFloat(T);
      if (isNaN(Tval)) { setResult(null); setError(null); setLoading(false); return; }
      const T_K = toKelvin(Tval, tempUnit);
      try {
        const V = computeVolumeFortes(T_K, selected.fortesParams!);
        setResult({ V });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
      return;
    }

    // Standard path: P is required
    if (P.trim() === '') {
      setResult(null); setError(null); setLoading(false);
      return;
    }

    const Pval = parseFloat(P);
    if (isNaN(Pval)) { setResult(null); setError(null); setLoading(false); return; }

    const T_K = isIsothermal
      ? resolvedParams?.T_ref ?? 0
      : (() => {
          if (T.trim() === '') return null;
          const v = parseFloat(T);
          return isNaN(v) ? null : toKelvin(v, tempUnit);
        })();

    if (T_K === null) { setResult(null); setError(null); setLoading(false); return; }

    if (isMurnaghan) {
      try {
        const V = computeVolumeMurnaghan(T_K, Pval, selected.murnaghanParams!);
        setResult({ V });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
      return;
    }

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
      // Synchronous BM3 / Vinet / AP1 / VinetAG / BM3Thermal
      try {
        const res = computeVolume(T_K, Pval, resolvedParams!, selected.eosType);
        setResult({ V: res.V });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    }
  }, [T, P, tempUnit, refId, selected, isIsothermal, isSeaFreeze, isFortesPowerExp, isMurnaghan, isVinetAG, isBM3Thermal, M, resolvedParams]);

  if (entries.length === 0) {
    return (
      <p className={s.noDataText}>
        No EoS references available for {MOLECULE_LABELS[molecule]} {POLYMORPH_LABELS[polymorph]}.
      </p>
    );
  }

  // V₀ display: show value + unit as reported; append cm³/mol conversion when unit differs
  const v0Display = (() => {
    if (!selected.params || !resolvedParams) return null;
    const rp = selected.params;
    if (rp.V0.unit !== 'cm3/mol') {
      return `${rp.V0.value} ${VOLUME_PARAM_UNIT_LABELS[rp.V0.unit]} (= ${resolvedParams.V0.toFixed(3)} cm³/mol)`;
    }
    return `${rp.V0.value} cm³/mol`;
  })();

  const fixedTDisplay = isIsothermal && resolvedParams
    ? (tempUnit === 'K'
        ? `${resolvedParams.T_ref} K (fixed)`
        : `${(resolvedParams.T_ref - 273.15).toFixed(2)} °C (fixed)`)
    : null;

  return (
    <div className={s.tabContent}>
      <LiteratureSelect entries={entries} value={refId} onChange={onRefChange} />

      <div className={s.paramsBox}>
        {isSeaFreeze ? (
          <>
            <strong>Gibbs energy (LBF) · SeaFreeze</strong>
            {selected.notes && <span> · {selected.notes}</span>}
          </>
        ) : isFortesPowerExp && selected.fortesParams ? (
          <>
            <strong>EoS parameters (Fortes power/exp · P = 0 GPa):</strong>{' '}
            V₀ = {selected.fortesParams.V0_cell} Å³ (= {selected.fortesParams.V0.toFixed(3)} cm³/mol) ·
            p = {selected.fortesParams.p.toExponential(2)} K⁻¹ ·
            q = {selected.fortesParams.q} K ·
            r = {selected.fortesParams.r.toExponential(2)} K⁻¹ ·
            s = {selected.fortesParams.s} K
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
            V₀ = {v0Display} ·{' '}
            T_ref = {selected.params.T_ref.value} {TEMP_PARAM_UNIT_LABELS[selected.params.T_ref.unit]} ·
            K₀ = {selected.params.K0.value} {PRESSURE_UNIT_LABELS[selected.params.K0.unit]} ·
            K₀′ = {selected.params.K0p.value} ·
            α₀ = {selected.params.alpha!.value} {ALPHA_UNIT_LABELS[selected.params.alpha!.unit]} ·
            δ_T = {selected.params.deltaT!.value}
          </>
        ) : isBM3Thermal && selected.params ? (
          <>
            <strong>EoS parameters (BM3 thermal, Berman 1988):</strong>{' '}
            V₀ = {v0Display} ·{' '}
            T_ref = {selected.params.T_ref.value} {TEMP_PARAM_UNIT_LABELS[selected.params.T_ref.unit]} ·
            K₀ = {selected.params.K0.value} {PRESSURE_UNIT_LABELS[selected.params.K0.unit]} ·
            K₀′ = {selected.params.K0p.value} ·
            α₀ = {selected.params.alpha!.value} {ALPHA_UNIT_LABELS[selected.params.alpha!.unit]} ·
            α₁ = {selected.params.alpha1!.value} {ALPHA1_UNIT_LABELS[selected.params.alpha1!.unit]} ·
            dK/dT = {selected.params.dKdT!.value} {DKDT_UNIT_LABELS[selected.params.dKdT!.unit]}
          </>
        ) : selected.params ? (
          <>
            <strong>EoS parameters ({selected.eosType}):</strong>{' '}
            V₀ = {v0Display} ·{' '}
            T_ref = {selected.params.T_ref.value} {TEMP_PARAM_UNIT_LABELS[selected.params.T_ref.unit]} ·
            K₀ = {selected.params.K0.value} {PRESSURE_UNIT_LABELS[selected.params.K0.unit]} ·
            K₀′ = {selected.params.K0p.value}
            {!isIsothermal && selected.params.alpha &&
              ` · α = ${selected.params.alpha.value} ${ALPHA_UNIT_LABELS[selected.params.alpha.unit]}`}
          </>
        ) : null}
      </div>

      {(isFortesPowerExp || isMurnaghan || isVinetAG || (!isSeaFreeze && selected.notes)) && selected.notes && (
        <p className={s.noteText}>{selected.notes}</p>
      )}

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
                ? (isFortesPowerExp ? '200' : isMurnaghan ? String(selected.murnaghanParams!.T_ref) : (resolvedParams ? String(resolvedParams.T_ref) : '250'))
                : (isFortesPowerExp ? '-73' : isMurnaghan ? String(Math.round(selected.murnaghanParams!.T_ref - 273.15)) : (resolvedParams ? String(Math.round(resolvedParams.T_ref - 273.15)) : '-23'))
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
            type={isFortesPowerExp ? 'text' : 'number'}
            disabled={isFortesPowerExp}
            value={isFortesPowerExp ? '0 (fixed)' : P}
            onChange={isFortesPowerExp ? undefined : (e) => setP(e.target.value)}
            placeholder={isFortesPowerExp ? undefined : isMurnaghan ? String(selected.murnaghanParams!.P_ref) : (resolvedParams ? String(resolvedParams.P_ref) : '0.3')}
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
          : isFortesPowerExp
          ? 'α(T) = p·T^(q/T) + r·exp(s/T) · V(T) = V₀·exp(∫α dT) · P = 0 GPa fixed'
          : isMurnaghan
          ? 'Murnaghan PVT · V = V_ref(T)/[P*(K′/K(T))+1]^(1/K′)'
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
