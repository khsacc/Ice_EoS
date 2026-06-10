import type { EoSParameters, EoSType, FortesPowerExpParams, MurnaghanParams } from './literature';

function effectiveV0(T: number, params: EoSParameters): number {
  return params.V0 * (1 + params.alpha * (T - params.T_ref));
}

// Third-order Birch-Murnaghan EoS
// P = (3K₀/2)(x^7/3 − x^5/3)(1 + 3/4(K₀′−4)(x^2/3 − 1))  where x = V₀/V
function bm3Pressure(V: number, V0: number, K0: number, K0p: number): number {
  const x = V0 / V;
  return (3 * K0 / 2) *
    (Math.pow(x, 7 / 3) - Math.pow(x, 5 / 3)) *
    (1 + (3 / 4) * (K0p - 4) * (Math.pow(x, 2 / 3) - 1));
}

// Vinet (Rydberg-Vinet) EoS
// P = (3B₀/X²)(1 − X) exp[(3/2)(B₀′ − 1)(1 − X)]  where X = (V/V₀)^(1/3)
function vinetPressure(V: number, V0: number, K0: number, K0p: number): number {
  const X = Math.pow(V / V0, 1 / 3);
  return (3 * K0 / (X * X)) * (1 - X) * Math.exp((3 / 2) * (K0p - 1) * (1 - X));
}

// Holzapfel AP1 EoS (Klotz eq. 3)
// P = (3B₀/X⁵)(1 − X) exp[(3/2)(B₀′ − 3)(1 − X)]  where X = (V/V₀)^(1/3)
function ap1Pressure(V: number, V0: number, K0: number, K0p: number): number {
  const X = Math.pow(V / V0, 1 / 3);
  return (3 * K0 / Math.pow(X, 5)) * (1 - X) * Math.exp((3 / 2) * (K0p - 3) * (1 - X));
}

function calcPressure(V: number, V0eff: number, K0: number, K0p: number, eosType: EoSType): number {
  if (eosType === 'Vinet') return vinetPressure(V, V0eff, K0, K0p);
  if (eosType === 'AP1')   return ap1Pressure(V, V0eff, K0, K0p);
  return bm3Pressure(V, V0eff, K0, K0p);
}

// Isothermal bulk modulus from the Vinet EoS: K_T = -V·dP/dV
// Derived analytically: K_T = (K₀/X²)·exp[c(1-X)]·(2 - X + c·X·(1-X))
// where c = (3/2)(K₀'-1), X = (V/V₀)^(1/3)
function vinetBulkModulus(V: number, V0: number, K0: number, K0p: number): number {
  const X = Math.pow(V / V0, 1 / 3);
  const c = (3 / 2) * (K0p - 1);
  return (K0 / (X * X)) * Math.exp(c * (1 - X)) * (2 - X + c * X * (1 - X));
}

// Vinet + Anderson-Grüneisen thermal pressure EoS (Sugimura 2010)
// P(V,T) = P_Vinet(V,T₀) + α₀·(V/V₀)^δ_T · K_T_Vinet(V) · (T − T₀)
// α(P) = α₀·(V/V₀)^δ_T; thermal pressure = ∫α·K_T dT ≈ α(V)·K_T(V)·ΔT
function vinetAGPressure(V: number, T: number, params: EoSParameters): number {
  const P_iso = vinetPressure(V, params.V0, params.K0, params.K0p);
  const KT   = vinetBulkModulus(V, params.V0, params.K0, params.K0p);
  const P_th = params.alpha * Math.pow(V / params.V0, params.deltaT ?? 0) * KT * (T - params.T_ref);
  return P_iso + P_th;
}

export interface CalcResult {
  V: number; // cm³/mol
  P: number; // GPa
}

// T, V → P
export function computePressure(T: number, V: number, params: EoSParameters, eosType: EoSType = 'BM3'): CalcResult {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  if (V <= 0) throw new Error('Volume must be positive (cm³/mol).');
  if (eosType === 'VinetAG') return { V, P: vinetAGPressure(V, T, params) };
  if (eosType === 'BM3Thermal') {
    const dT = T - params.T_ref;
    const V0T = params.V0 * (1 + params.alpha * dT + 0.5 * (params.alpha1 ?? 0) * dT * dT);
    const K0T = params.K0 + (params.dKdT ?? 0) * dT;
    return { V, P: bm3Pressure(V, V0T, K0T, params.K0p) };
  }
  const P = calcPressure(V, effectiveV0(T, params), params.K0, params.K0p, eosType);
  return { V, P };
}

// T, P → V  (bisection — P is monotonically decreasing in V for both BM3 and Vinet)
export function computeVolume(T: number, P_target: number, params: EoSParameters, eosType: EoSType = 'BM3'): CalcResult {
  if (T <= 0) throw new Error('Temperature must be positive (K).');

  // BM3Thermal: temperature-dependent V₀ and K₀ (Berman 1988 formalism)
  if (eosType === 'BM3Thermal') {
    const dT = T - params.T_ref;
    const V0T = params.V0 * (1 + params.alpha * dT + 0.5 * (params.alpha1 ?? 0) * dT * dT);
    const K0T = params.K0 + (params.dKdT ?? 0) * dT;
    let Vlo = V0T * 0.10;
    let Vhi = V0T * 5.00;
    const Plo = bm3Pressure(Vlo, V0T, K0T, params.K0p);
    const Phi = bm3Pressure(Vhi, V0T, K0T, params.K0p);
    if (P_target > Plo)
      throw new Error(`P = ${P_target} GPa exceeds BM3Thermal range at this T (max ≈ ${Plo.toFixed(1)} GPa).`);
    if (P_target < Phi)
      throw new Error(`P = ${P_target} GPa is below BM3Thermal range (tensile limit ≈ ${Phi.toFixed(2)} GPa).`);
    for (let i = 0; i < 300; i++) {
      const Vmid = (Vlo + Vhi) / 2;
      if (bm3Pressure(Vmid, V0T, K0T, params.K0p) > P_target) Vlo = Vmid; else Vhi = Vmid;
      if ((Vhi - Vlo) / V0T < 1e-12) break;
    }
    return { V: (Vlo + Vhi) / 2, P: P_target };
  }

  // VinetAG: bisect on [0.1·V₀, V₀]; monotonically decreasing in this compressed range
  if (eosType === 'VinetAG') {
    const V0 = params.V0;
    const Vlo0 = V0 * 0.10;
    const Vhi0 = V0;
    const Plo = vinetAGPressure(Vlo0, T, params);
    const Phi = vinetAGPressure(Vhi0, T, params);
    if (P_target > Plo)
      throw new Error(`P = ${P_target} GPa exceeds VinetAG range at this T (max ≈ ${Plo.toFixed(1)} GPa).`);
    if (P_target < Phi)
      throw new Error(`P = ${P_target} GPa is below VinetAG range at this T (min ≈ ${Phi.toFixed(2)} GPa).`);
    let Vlo = Vlo0, Vhi = Vhi0;
    for (let i = 0; i < 300; i++) {
      const Vmid = (Vlo + Vhi) / 2;
      if (vinetAGPressure(Vmid, T, params) > P_target) Vlo = Vmid; else Vhi = Vmid;
      if ((Vhi - Vlo) / V0 < 1e-12) break;
    }
    return { V: (Vlo + Vhi) / 2, P: P_target };
  }

  const V0eff = effectiveV0(T, params);

  let Vlo = V0eff * 0.10;
  let Vhi = V0eff * 5.00;

  const Plo = calcPressure(Vlo, V0eff, params.K0, params.K0p, eosType);
  const Phi = calcPressure(Vhi, V0eff, params.K0, params.K0p, eosType);

  if (P_target > Plo)
    throw new Error(`P = ${P_target} GPa exceeds ${eosType} range at this T (max ≈ ${Plo.toFixed(1)} GPa).`);
  if (P_target < Phi)
    throw new Error(`P = ${P_target} GPa is below ${eosType} range (tensile limit ≈ ${Phi.toFixed(2)} GPa).`);

  for (let i = 0; i < 300; i++) {
    const Vmid = (Vlo + Vhi) / 2;
    if (calcPressure(Vmid, V0eff, params.K0, params.K0p, eosType) > P_target) {
      Vlo = Vmid;
    } else {
      Vhi = Vmid;
    }
    if ((Vhi - Vlo) / V0eff < 1e-12) break;
  }

  return { V: (Vlo + Vhi) / 2, P: P_target };
}

// Fortes (2018) power/exponential thermal expansion model — P = 0 GPa only
// α(T) = p·T^(q/T) + r·exp(s/T)
// V(T) = V₀ · exp(∫_{T_low}^T α dT')
//
// The integrand diverges below ~1 K (T^(q/T) with q < 0 blows up for T < 1),
// so integration starts from T_LOW = 2 K where α ≈ 0 and V(T_LOW) ≈ V₀.
const T_LOW = 2.0; // K

function fortesAlpha(T: number, p: number, q: number, r: number, s: number): number {
  return p * Math.pow(T, q / T) + r * Math.exp(s / T);
}

// Simpson's rule integration of α from T_LOW to T
function integrateFortesAlpha(T: number, p: number, q: number, r: number, s: number): number {
  if (T <= T_LOW) return 0;
  const n = 1000; // must be even
  const h = (T - T_LOW) / n;
  let sum = fortesAlpha(T_LOW, p, q, r, s) + fortesAlpha(T, p, q, r, s);
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * fortesAlpha(T_LOW + i * h, p, q, r, s);
  }
  return (h / 3) * sum;
}

export function computeVolumeFortes(T: number, fp: FortesPowerExpParams): number {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  if (T > 275) throw new Error('Model valid up to 270 K.');
  return fp.V0 * Math.exp(integrateFortesAlpha(T, fp.p, fp.q, fp.r, fp.s));
}

// Murnaghan PVT EoS — Fortes et al. (2012) form
// V(P,T) = V_ref(T) / [P*·(K'/K(T)) + 1]^(1/K')  where P* = P − P_ref
// V_ref(T) = V_ref + X1·T* + X2·T*²               T* = T − T_ref
// K(T)     = K_ref + dKdT·T*
export function computeVolumeMurnaghan(T: number, P: number, mp: MurnaghanParams): number {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  const Tstar = T - mp.T_ref;
  const Vt = mp.V_ref + mp.X1 * Tstar + mp.X2 * Tstar * Tstar;
  const Kt = mp.K_ref + mp.dKdT * Tstar;
  if (Kt <= 0) throw new Error('K(T) ≤ 0 at this temperature — outside model range.');
  const Pstar = P - mp.P_ref;
  const base = Pstar * (mp.Kp / Kt) + 1;
  if (base <= 0) throw new Error(`P = ${P} GPa is outside Murnaghan model range.`);
  return Vt / Math.pow(base, 1 / mp.Kp);
}

export function computePressureMurnaghan(T: number, V: number, mp: MurnaghanParams): number {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  if (V <= 0) throw new Error('Volume must be positive (cm³/mol).');
  const Tstar = T - mp.T_ref;
  const Vt = mp.V_ref + mp.X1 * Tstar + mp.X2 * Tstar * Tstar;
  const Kt = mp.K_ref + mp.dKdT * Tstar;
  if (Kt <= 0) throw new Error('K(T) ≤ 0 at this temperature — outside model range.');
  return mp.P_ref + (Kt / mp.Kp) * (Math.pow(Vt / V, mp.Kp) - 1);
}
