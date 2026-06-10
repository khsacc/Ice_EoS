'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { LITERATURE, POLYMORPH_LABELS, MOLECULE_LABELS, POLYMORPH_Z, MOLAR_MASS } from '../lib/literature';
import { computeVolume, computeVolumeFortes, computeVolumeFrankPVT, computeVolumeMurnaghan, computeVolumeFeistelWagner, computeVolumeRottger } from '../lib/eos';
import type { IcePolymorph, Molecule } from '../lib/literature';
import {
  type TempUnit,
  TEMP_UNIT_LABELS, VOLUME_UNIT_DECIMALS,
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
  const isRottgerPolynomial = selected?.eosType === 'RottgerPolynomial';
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

    // RottgerPolynomial: P is fixed at 0, only T is needed
    if (isRottgerPolynomial) {
      if (T.trim() === '') { setResult(null); setError(null); setLoading(false); return; }
      const Tval = parseFloat(T);
      if (isNaN(Tval)) { setResult(null); setError(null); setLoading(false); return; }
      const T_K = toKelvin(Tval, tempUnit);
      try {
        const V = computeVolumeRottger(T_K, selected.rottgerParams!);
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

    if (isFrankPVT) {
      try {
        const V = computeVolumeFrankPVT(T_K, Pval, selected.frankPVTParams!);
        setResult({ V });
        setError(null);
      } catch (e) {
        setResult(null);
        setError((e as Error).message);
      }
      setLoading(false);
      return;
    }

    if (isFeistelWagner) {
      try {
        const V = computeVolumeFeistelWagner(T_K, Pval, M);
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
  }, [T, P, tempUnit, refId, selected, isIsothermal, isSeaFreeze, isFortesPowerExp, isRottgerPolynomial, isMurnaghan, isFrankPVT, isFeistelWagner, isVinetAG, isBM3Thermal, M, resolvedParams]);

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
        ) : isFortesPowerExp && selected.fortesParams ? (
          <>
            <strong>EoS parameters (Fortes power/exp · P = 0 GPa):</strong>{' '}
            V₀ = {selected.fortesParams.V0_cell} Å³ (= {selected.fortesParams.V0.toFixed(3)} cm³/mol) ·
            p = {selected.fortesParams.p.toExponential(2)} K⁻¹ ·
            q = {selected.fortesParams.q} K ·
            r = {selected.fortesParams.r.toExponential(2)} K⁻¹ ·
            s = {selected.fortesParams.s} K
          </>
        ) : isRottgerPolynomial && selected.rottgerParams ? (
          <>
            <strong>EoS parameters (Röttger polynomial · P = 0 GPa):</strong>{' '}
            A₀ = {selected.rottgerParams.A[0]} Å³ ·
            A₃ = {selected.rottgerParams.A[3].toExponential(4)} Å³/K³ ·
            A₄ = {selected.rottgerParams.A[4].toExponential(4)} Å³/K⁴ ·
            A₅ = {selected.rottgerParams.A[5].toExponential(4)} Å³/K⁵ ·
            A₆ = {selected.rottgerParams.A[6].toExponential(4)} Å³/K⁶ ·
            A₇ = {selected.rottgerParams.A[7].toExponential(4)} Å³/K⁷
            {selected.rottgerParams.A[8] !== 0 && ` · A₈ = ${selected.rottgerParams.A[8].toExponential(4)} Å³/K⁸`}
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

      {(isFortesPowerExp || isRottgerPolynomial || isMurnaghan || isVinetAG || isFrankPVT || (!isSeaFreeze && !isFeistelWagner && selected.notes)) && selected.notes && (
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
                ? ((isFortesPowerExp || isRottgerPolynomial) ? '200' : isMurnaghan ? String(selected.murnaghanParams!.T_ref) : isFrankPVT ? String(selected.frankPVTParams!.T_ref) : (resolvedParams ? String(resolvedParams.T_ref) : '250'))
                : ((isFortesPowerExp || isRottgerPolynomial) ? '-73' : isMurnaghan ? String(Math.round(selected.murnaghanParams!.T_ref - 273.15)) : isFrankPVT ? String(Math.round(selected.frankPVTParams!.T_ref - 273.15)) : (resolvedParams ? String(Math.round(resolvedParams.T_ref - 273.15)) : '-23'))
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
            type={(isFortesPowerExp || isRottgerPolynomial) ? 'text' : 'number'}
            disabled={isFortesPowerExp || isRottgerPolynomial}
            value={(isFortesPowerExp || isRottgerPolynomial) ? '0 (fixed)' : P}
            onChange={(isFortesPowerExp || isRottgerPolynomial) ? undefined : (e) => setP(e.target.value)}
            placeholder={(isFortesPowerExp || isRottgerPolynomial) ? undefined : isMurnaghan ? String(selected.murnaghanParams!.P_ref) : isFrankPVT ? '10' : (resolvedParams ? String(resolvedParams.P_ref) : '0.3')}
          />
        </div>
      </div>

      {loading && <p className={s.loadingText}>Calculating via SeaFreeze…</p>}
      {error && <div className={s.messageBox.error}>{error}</div>}

      {!loading && !error && !result && (
        <p className={s.promptText}>
          {isFortesPowerExp || isRottgerPolynomial
            ? 'Enter a temperature to calculate.'
            : isIsothermal
            ? 'Enter a pressure to calculate.'
            : 'Enter temperature and pressure to calculate.'}
        </p>
      )}

      {result && (
        <div className={s.messageBox.result}>
          <p className={s.resultSubTitle}>Unit-cell volume</p>
          <div className={s.resultRow}>
            <span>
              <span className={s.resultValue}>{fromMolar(result.V, 'cell', Z, M).toFixed(VOLUME_UNIT_DECIMALS['cell'])}</span>
              {' '}[Å³]
            </span>
          </div>

          <p className={s.resultSubTitle}>Molar volume</p>
          <div className={s.resultRow}>
            <span>
              <span className={s.resultValue}>{fromMolar(result.V, 'molar', Z, M).toFixed(VOLUME_UNIT_DECIMALS['molar'])}</span>
              {' '}[cm³/mol]
            </span>
          </div>

          <p className={s.resultSubTitle}>Density</p>
          <div className={s.resultRow}>
            <span>
              <span className={s.resultValue}>{fromMolar(result.V, 'gcm3', Z, M).toFixed(VOLUME_UNIT_DECIMALS['gcm3'])}</span>
              {' '}[g/cm³]
            </span>
          </div>
          <div className={s.resultRowLast}>
            <span>
              <span className={s.resultValue}>{fromMolar(result.V, 'kgm3', Z, M).toFixed(VOLUME_UNIT_DECIMALS['kgm3'])}</span>
              {' '}[kg/m³]
            </span>
          </div>
        </div>
      )}

      <p className={s.footerNote}>
        {isFeistelWagner
          ? 'Feistel & Wagner (2006) · ρ = [∂g/∂p]_T⁻¹ · IAPWS-2006 Gibbs energy'
          : isSeaFreeze
          ? 'SeaFreeze · Journaux et al. (2020) Gibbs LBF representation'
          : isRottgerPolynomial
          ? 'V_cell(T) = Σ Aᵢ·Tⁱ [Å³] → V_molar = V_cell/(Z·1.66054) · P = 0 GPa fixed'
          : isFortesPowerExp
          ? 'α(T) = p·T^(q/T) + r·exp(s/T) · V(T) = V₀·exp(∫α dT) · P = 0 GPa fixed'
          : isMurnaghan
          ? 'Murnaghan PVT · V = V_ref(T)/[P*(K′/K(T))+1]^(1/K′)'
          : isVinetAG
          ? 'VinetAG · P_th = α₀·(V/V₀)^δ_T · K_T(V) · (T − T_ref)'
          : isBM3Thermal
          ? 'BM3 thermal · V_T0=V₀[1+α₀ΔT+½α₁ΔT²] · K_T0=K₀+(dK/dT)ΔT'
          : isFrankPVT
          ? 'BM3 Frank PVT · V=V_BM3(P,300K)·exp(∫₃₀₀ᵀ α dT) · α=(a₀+a₁T)/(1+K′/K·P)^η'
          : `${selected.eosType} EoS${!isIsothermal ? ' · V₀(T) = V₀ · (1 + α(T − T_ref))' : ''}`}
        {' '}· unit cell Z = {Z}
      </p>
    </div>
  );
}
