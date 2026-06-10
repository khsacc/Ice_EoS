// Internal computation type — all canonical units: GPa, cm³/mol, K, K⁻¹
export interface EoSParameters {
  V0: number;       // cm³/mol
  T_ref: number;    // K
  P_ref: number;    // GPa
  K0: number;       // GPa
  K0p: number;      // dimensionless
  alpha: number;    // K⁻¹ (0 for isothermal)
  alpha1?: number;  // K⁻²  (BM3Thermal quadratic term)
  dKdT?: number;    // GPa/K (BM3Thermal bulk modulus slope)
  deltaT?: number;  // dimensionless Anderson-Grüneisen δ_T (VinetAG)
}

// ─── Unit type definitions ────────────────────────────────────────────────────

export type ParamPressureUnit = 'GPa' | 'MPa' | 'kbar';
export const PRESSURE_TO_GPA: Record<ParamPressureUnit, number> = {
  GPa: 1, MPa: 1e-3, kbar: 0.1,
};
export const PRESSURE_UNIT_LABELS: Record<ParamPressureUnit, string> = {
  GPa: 'GPa', MPa: 'MPa', kbar: 'kbar',
};

export type ParamVolumeUnit = 'cm3/mol' | 'A3/cell' | 'g/cm3' | 'kg/m3';
export const VOLUME_PARAM_UNIT_LABELS: Record<ParamVolumeUnit, string> = {
  'cm3/mol': 'cm³/mol',
  'A3/cell': 'Å³',
  'g/cm3':   'g/cm³',
  'kg/m3':   'kg/m³',
};

export type ParamTempUnit = 'K' | 'C';
export const TEMP_PARAM_UNIT_LABELS: Record<ParamTempUnit, string> = {
  K: 'K', C: '°C',
};

export type ParamAlphaUnit = 'K-1' | '10-5/K' | '10-6/K';
export const ALPHA_TO_K1: Record<ParamAlphaUnit, number> = {
  'K-1': 1, '10-5/K': 1e-5, '10-6/K': 1e-6,
};
export const ALPHA_UNIT_LABELS: Record<ParamAlphaUnit, string> = {
  'K-1':    'K⁻¹',
  '10-5/K': '×10⁻⁵ K⁻¹',
  '10-6/K': '×10⁻⁶ K⁻¹',
};

export type ParamAlpha1Unit = 'K-2' | '10-6/K2' | '10-8/K2';
export const ALPHA1_TO_K2: Record<ParamAlpha1Unit, number> = {
  'K-2': 1, '10-6/K2': 1e-6, '10-8/K2': 1e-8,
};
export const ALPHA1_UNIT_LABELS: Record<ParamAlpha1Unit, string> = {
  'K-2':     'K⁻²',
  '10-6/K2': '×10⁻⁶ K⁻²',
  '10-8/K2': '×10⁻⁸ K⁻²',
};

export type ParamDKDTUnit = 'GPa/K' | 'MPa/K';
export const DKDT_TO_GPAK: Record<ParamDKDTUnit, number> = {
  'GPa/K': 1, 'MPa/K': 1e-3,
};
export const DKDT_UNIT_LABELS: Record<ParamDKDTUnit, string> = {
  'GPa/K': 'GPa/K', 'MPa/K': 'MPa/K',
};

export type Dimensionless = '1';

// ─── Generic reported parameter ───────────────────────────────────────────────

// value: as printed in the paper; parenthesis uncertainty notation accepted,
//        e.g. "42.25(2)" means 42.25 ± 0.02 (last digit uncertainty).
export interface ReportedParam<U extends string> {
  value: string;
  unit: U;
}

// ─── Reported EoS parameters (one per row in the source table) ────────────────

export interface ReportedEoSParameters {
  V0:      ReportedParam<ParamVolumeUnit>;
  K0:      ReportedParam<ParamPressureUnit>;
  K0p:     ReportedParam<Dimensionless>;
  T_ref:   ReportedParam<ParamTempUnit>;
  P_ref:   ReportedParam<ParamPressureUnit>;
  // Omit alpha for isothermal entries — resolves to 0
  alpha?:  ReportedParam<ParamAlphaUnit>;
  alpha1?: ReportedParam<ParamAlpha1Unit>;
  dKdT?:   ReportedParam<ParamDKDTUnit>;
  deltaT?: ReportedParam<Dimensionless>;
}

// ─── Parsing ──────────────────────────────────────────────────────────────────

// Extract central value, ignoring parenthetical last-digit uncertainty.
// "42.25(2)" → 42.25    "14.6(14)" → 14.6    "-0.009" → -0.009
export function parseParamValue(s: string): number {
  const stripped = s.replace(/\(\d+\)$/, '').trim();
  const n = parseFloat(stripped);
  if (isNaN(n)) throw new Error(`Invalid parameter value: "${s}"`);
  return n;
}

// ─── Resolution to computation-ready EoSParameters ───────────────────────────

const CM3_MOL_TO_A3 = 1e24 / 6.02214076e23; // ≈ 1.66054 Å³·mol / (cm³·formula unit)

function resolveV0(rp: ReportedParam<ParamVolumeUnit>, Z: number, M: number): number {
  const val = parseParamValue(rp.value);
  switch (rp.unit) {
    case 'cm3/mol': return val;
    case 'A3/cell': return val / (Z * CM3_MOL_TO_A3);
    case 'g/cm3':   return M / val;
    case 'kg/m3':   return (M * 1000) / val;
  }
}

// Convert ReportedEoSParameters → EoSParameters for use in eos.ts functions.
// Z = formula units per unit cell, M = molar mass in g/mol.
export function resolveParams(rp: ReportedEoSParameters, Z: number, M: number): EoSParameters {
  const T_val = parseParamValue(rp.T_ref.value);
  return {
    V0:     resolveV0(rp.V0, Z, M),
    K0:     parseParamValue(rp.K0.value)  * PRESSURE_TO_GPA[rp.K0.unit],
    K0p:    parseParamValue(rp.K0p.value),
    T_ref:  rp.T_ref.unit === 'C' ? T_val + 273.15 : T_val,
    P_ref:  parseParamValue(rp.P_ref.value) * PRESSURE_TO_GPA[rp.P_ref.unit],
    alpha:  rp.alpha  ? parseParamValue(rp.alpha.value)  * ALPHA_TO_K1[rp.alpha.unit]   : 0,
    alpha1: rp.alpha1 ? parseParamValue(rp.alpha1.value) * ALPHA1_TO_K2[rp.alpha1.unit] : undefined,
    dKdT:   rp.dKdT   ? parseParamValue(rp.dKdT.value)   * DKDT_TO_GPAK[rp.dKdT.unit]  : undefined,
    deltaT: rp.deltaT  ? parseParamValue(rp.deltaT.value)                                 : undefined,
  };
}
