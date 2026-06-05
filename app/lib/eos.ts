import type { EoSParameters, EoSType, FortesPowerExpParams } from './literature';

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

export interface CalcResult {
  V: number; // cm³/mol
  P: number; // GPa
}

// T, V → P
export function computePressure(T: number, V: number, params: EoSParameters, eosType: EoSType = 'BM3'): CalcResult {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  if (V <= 0) throw new Error('Volume must be positive (cm³/mol).');
  const P = calcPressure(V, effectiveV0(T, params), params.K0, params.K0p, eosType);
  return { V, P };
}

// T, P → V  (bisection — P is monotonically decreasing in V for both BM3 and Vinet)
export function computeVolume(T: number, P_target: number, params: EoSParameters, eosType: EoSType = 'BM3'): CalcResult {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
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
