'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { LITERATURE, POLYMORPH_LABELS, MOLECULE_LABELS, POLYMORPH_Z, MOLAR_MASS } from '../lib/literature';
import { computePressure, computePressureFrankPVT, computePressureMurnaghan, computePressureFeistelWagner } from '../lib/eos';
import type { IcePolymorph, Molecule } from '../lib/literature';
import {
  type TempUnit, type VolumeUnit,
  TEMP_UNIT_LABELS, VOLUME_UNIT_LABELS, VOLUME_UNITS, VOLUME_UNIT_DECIMALS,
  toKelvin, toMolar, fromMolar,
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

export default function TabTVtoP({ molecule, polymorph, refId, onRefChange }: Props) {
  // FortesPowerExp and RottgerPolynomial entries are P=0 only and cannot appear in T,V→P
  const entries = LITERATURE[polymorph].filter(
    (e) => e.molecule === molecule && e.eosType !== 'FortesPowerExp' && e.eosType !== 'RottgerPolynomial',
  );

  const [T, setT] = useState('');
  const [V, setV] = useState('');
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [volUnit, setVolUnit] = useState<VolumeUnit>('cell');
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
  const isFeistelWagner = selected?.eosType === 'FeistelWagner';
  const isFrankPVT = selected?.eosType === 'BM3FrankPVT';
  const Z = POLYMORPH_Z[polymorph];
  const M = MOLAR_MASS[molecule];

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

    if (!selected || V.trim() === '') {
      setResult(null); setError(null); setLoading(false);
      return;
    }

    const Vval = parseFloat(V);
    if (isNaN(Vval) || Vval <= 0) { setResult(null); setError(null); setLoading(false); return; }

    const T_K = isIsothermal
      ? resolvedParams?.T_ref ?? 0
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
    } else if (isFeistelWagner) {
      try {
        const P = computePressureFeistelWagner(T_K, V_molar, M);
        setResult({ P, V_molar });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    } else if (isFrankPVT) {
      try {
        const P = computePressureFrankPVT(T_K, V_molar, selected.frankPVTParams!);
        setResult({ P, V_molar });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    } else {
      try {
        const res = computePressure(T_K, V_molar, resolvedParams!, selected.eosType);
        setResult({ P: res.P, V_molar });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
    }
  }, [T, V, tempUnit, volUnit, refId, selected, isIsothermal, isSeaFreeze, isMurnaghan, isFrankPVT, isFeistelWagner, isVinetAG, isBM3Thermal, Z, M, resolvedParams]);

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

  // V placeholder in current unit
  const v0InUnit = isMurnaghan && selected.murnaghanParams
    ? fromMolar(selected.murnaghanParams.V_ref, volUnit, Z, M)
    : isFrankPVT && selected.frankPVTParams
    ? fromMolar(selected.frankPVTParams.V0, volUnit, Z, M)
    : resolvedParams
    ? fromMolar(resolvedParams.V0, volUnit, Z, M)
    : null;
  const placeholderV = v0InUnit != null ? v0InUnit.toFixed(VOLUME_UNIT_DECIMALS[volUnit]) : '';

  return (
    <div className={s.tabContent}>
      <LiteratureSelect entries={entries} value={refId} onChange={onRefChange} />

      <div className={s.paramsBox}>
        {isFeistelWagner ? (
          <>
            <strong>Gibbs energy (IAPWS-2006) · Feistel &amp; Wagner (2006)</strong>
            {selected.notes && <span> · {selected.notes}</span>}
          </>
        ) : isSeaFreeze ? (
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
        ) : isFrankPVT && selected.frankPVTParams ? (
          <>
            <strong>EoS parameters (BM3 Frank PVT):</strong>{' '}
            V₀ = {selected.frankPVTParams.V0} cm³/mol ·
            T_ref = {selected.frankPVTParams.T_ref} K ·
            K₀ = {selected.frankPVTParams.K0} GPa ·
            K₀′ = {selected.frankPVTParams.K0p} ·
            a₀ = {selected.frankPVTParams.a0.toExponential(2)} K⁻¹ ·
            a₁ = {selected.frankPVTParams.a1.toExponential(2)} K⁻² ·
            η = {selected.frankPVTParams.eta}
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

      {!isSeaFreeze && !isFeistelWagner && selected.notes && (
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
                ? (isMurnaghan ? String(selected.murnaghanParams!.T_ref) : isFrankPVT ? String(selected.frankPVTParams!.T_ref) : (resolvedParams ? String(resolvedParams.T_ref) : '250'))
                : (isMurnaghan ? String(Math.round(selected.murnaghanParams!.T_ref - 273.15)) : isFrankPVT ? String(Math.round(selected.frankPVTParams!.T_ref - 273.15)) : (resolvedParams ? String(Math.round(resolvedParams.T_ref - 273.15)) : '-23'))
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

      {!loading && !error && !result && (
        <p className={s.promptText}>
          {isIsothermal
            ? 'Enter a volume or density to calculate.'
            : 'Enter temperature and volume or density to calculate.'}
        </p>
      )}

      {result && (
        <div className={s.messageBox.result}>
          <p className={s.resultTitle}>Pressure</p>
          <div className={s.resultRow}>
            <span><span className={s.resultValue}>{result.P.toFixed(4)}</span> [GPa]</span>
          </div>
          <div className={s.resultRowLast}>
            <span><span className={s.resultValue}>{result.V_molar.toFixed(4)}</span> [cm³/mol]</span>
          </div>
        </div>
      )}

      <p className={s.footerNote}>
        {isFeistelWagner
          ? 'Feistel & Wagner (2006) · ρ = [∂g/∂p]_T⁻¹ · IAPWS-2006 Gibbs energy'
          : isSeaFreeze
          ? 'SeaFreeze · Journaux et al. (2020) Gibbs LBF representation'
          : isMurnaghan
          ? 'Murnaghan PVT · P = P_ref + (K(T)/K′)·[(V_ref(T)/V)^K′ − 1]'
          : isVinetAG
          ? 'VinetAG · P_th = α₀·(V/V₀)^δ_T · K_T(V) · (T − T_ref)'
          : isBM3Thermal
          ? 'BM3 thermal · V_T0=V₀[1+α₀ΔT+½α₁ΔT²] · K_T0=K₀+(dK/dT)ΔT'
          : isFrankPVT
          ? 'BM3 Frank PVT · P from bisection: V_BM3(P,300K)·exp(∫₃₀₀ᵀ α dT) = V_target'
          : `${selected.eosType} EoS${!isIsothermal ? ' · V₀(T) = V₀ · (1 + α(T − T_ref))' : ''}`}
        {' '}· unit cell Z = {Z}
      </p>
    </div>
  );
}
