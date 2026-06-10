import type { EoSParameters, EoSType, FortesPowerExpParams, FrankPVTParams, MurnaghanParams, RottgerPolynomialParams } from './literature';

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

// Röttger et al. (2012) polynomial unit-cell volume fit — P = 0 GPa only
// V_cell(T) [Å³] = Σ_{i=0}^{8} A[i]·T^i;  valid 10–265 K
// Convert to molar: V_molar = V_cell / (Z × 1.66054)  (1.66054 = 1e24/Nₐ)
export function computeVolumeRottger(T: number, rp: RottgerPolynomialParams): number {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  if (T > 270) throw new Error('Röttger polynomial valid 10–265 K.');
  let V_cell = 0;
  for (let i = 0; i <= 8; i++) V_cell += rp.A[i] * Math.pow(T, i);
  return V_cell / (rp.Z * 1.66054);
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

// ─── Feistel & Wagner (2006) IAPWS ice Ih Gibbs energy EoS ──────────────────
// ρ(T,p) = [∂g/∂p]_T⁻¹;  g_p computed via complex arithmetic per IAPWS-2006

type C = [number, number]; // [real, imag]
const cadd   = (a: C, b: C): C => [a[0]+b[0], a[1]+b[1]];
const csub   = (a: C, b: C): C => [a[0]-b[0], a[1]-b[1]];
const cmul   = (a: C, b: C): C => [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]];
const cscale = (a: C, s: number): C => [a[0]*s, a[1]*s];
const cln    = (a: C): C => [0.5*Math.log(a[0]*a[0]+a[1]*a[1]), Math.atan2(a[1], a[0])];
const cdiv   = (a: C, b: C): C => {
  const d = b[0]*b[0]+b[1]*b[1];
  return [(a[0]*b[0]+a[1]*b[1])/d, (a[1]*b[0]-a[0]*b[1])/d];
};

const FW_Tt  = 273.16;   // K, triple-point temperature
const FW_pt  = 611.657;  // Pa, triple-point pressure
// g0k coefficients (k=0..4), J/kg
const FW_g0k = [
  -632020.233449497,
   0.655022213658955,
  -1.89369929326131e-8,
   3.39746123271053e-15,
  -5.56464869058991e-22,
];
// t2 and r2k (k=0..2) are complex, units J/(kg·K) for r2k
const FW_t2: C   = [0.337315741065416,  0.335449415919309];
const FW_r2k: C[] = [
  [-72.597457432922,       -78.100842711287     ],
  [ -5.57107698030123e-5,    4.64578634580806e-5],
  [  2.34801409215913e-11,  -2.85651142904720e-11],
];

// f(τ, t) = (t−τ)ln(t−τ) + (t+τ)ln(t+τ) − 2t·ln(t) − τ²/t  [complex]
function fwF(tau: number, t: C): C {
  const tm = csub(t, [tau, 0]);
  const tp = cadd(t, [tau, 0]);
  return csub(
    cadd(cmul(tm, cln(tm)), cmul(tp, cln(tp))),
    cadd(cscale(cmul(t, cln(t)), 2), cdiv([tau * tau, 0], t)),
  );
}

// Specific volume v(T, p) = g_p in m³/kg
function fwSpecificVolume(T: number, p: number): number {
  const tau = T / FW_Tt;
  const x   = p / FW_pt - 101325 / FW_pt; // (π − π₀)
  let g0p = 0;
  for (let k = 1; k <= 4; k++) g0p += FW_g0k[k] * k * Math.pow(x, k - 1) / FW_pt;
  let r2p: C = [0, 0];
  for (let k = 1; k <= 2; k++) r2p = cadd(r2p, cscale(FW_r2k[k], k * Math.pow(x, k - 1) / FW_pt));
  return g0p + FW_Tt * cmul(r2p, fwF(tau, FW_t2))[0];
}

// T (K), P (GPa) → V (cm³/mol);  M = molar mass in g/mol
export function computeVolumeFeistelWagner(T: number, P_GPa: number, M: number): number {
  if (T <= 0)    throw new Error('Temperature must be positive (K).');
  if (T > FW_Tt) throw new Error(`Feistel & Wagner (2006) valid for T ≤ ${FW_Tt} K (ice Ih).`);
  const v = fwSpecificVolume(T, P_GPa * 1e9);
  if (v <= 0) throw new Error('Non-physical specific volume — check T and P ranges.');
  return v * M * 1000; // m³/kg → cm³/mol
}

// ─── Frank et al. (2004) BM3+thermal PVT EoS for ice VII ─────────────────────
// V(P,T) = V_BM3(P,T_ref) × exp{[a₀(T−T_ref) + (a₁/2)(T²−T_ref²)] / (1 + (K0p/K0)·P)^eta}
// where V_BM3(P,T_ref) is the isothermal BM3 volume at T_ref (= 300 K by default).
// α(P,T) = (a₀ + a₁·T) / (1 + (K0p/K0)·P)^eta

export function computeVolumeFrankPVT(T: number, P: number, fp: FrankPVTParams): number {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  const { V0, K0, K0p } = fp;
  let Vlo = V0 * 0.10;
  let Vhi = V0 * 5.0;
  const Plo_val = bm3Pressure(Vlo, V0, K0, K0p);
  const Phi_val = bm3Pressure(Vhi, V0, K0, K0p);
  if (P > Plo_val)
    throw new Error(`P = ${P} GPa exceeds BM3 range (max ≈ ${Plo_val.toFixed(1)} GPa).`);
  if (P < Phi_val)
    throw new Error(`P = ${P} GPa is below BM3 range (tensile limit ≈ ${Phi_val.toFixed(2)} GPa).`);
  for (let i = 0; i < 300; i++) {
    const Vmid = (Vlo + Vhi) / 2;
    if (bm3Pressure(Vmid, V0, K0, K0p) > P) Vlo = Vmid; else Vhi = Vmid;
    if ((Vhi - Vlo) / V0 < 1e-12) break;
  }
  const V_ref_T = (Vlo + Vhi) / 2;
  const dT = T - fp.T_ref;
  const dT2 = T * T - fp.T_ref * fp.T_ref;
  const thermIntegral = (fp.a0 * dT + 0.5 * fp.a1 * dT2) / Math.pow(1 + (K0p / K0) * P, fp.eta);
  return V_ref_T * Math.exp(thermIntegral);
}

// T (K), V (cm³/mol) → P (GPa) via outer bisection over [fp.P_min, fp.P_max].
// V is monotonically decreasing in P for physically reasonable conditions.
export function computePressureFrankPVT(T: number, V_target: number, fp: FrankPVTParams): number {
  if (T <= 0) throw new Error('Temperature must be positive (K).');
  if (V_target <= 0) throw new Error('Volume must be positive (cm³/mol).');
  const { P_min, P_max } = fp;
  const V_at_Plo = computeVolumeFrankPVT(T, P_min, fp);
  const V_at_Phi = computeVolumeFrankPVT(T, P_max, fp);
  if (V_target > V_at_Plo)
    throw new Error(`V = ${V_target.toFixed(3)} cm³/mol exceeds model range at this T (V at ${P_min} GPa ≈ ${V_at_Plo.toFixed(3)} cm³/mol).`);
  if (V_target < V_at_Phi)
    throw new Error(`V = ${V_target.toFixed(3)} cm³/mol is below model range at this T (V at ${P_max} GPa ≈ ${V_at_Phi.toFixed(3)} cm³/mol).`);
  let lo = P_min, hi = P_max;
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2;
    if (computeVolumeFrankPVT(T, mid, fp) > V_target) lo = mid; else hi = mid;
    if ((hi - lo) / (P_max - P_min) < 1e-12) break;
  }
  return (lo + hi) / 2;
}

// T (K), V (cm³/mol) → P (GPa) via bisection;  M = molar mass in g/mol
export function computePressureFeistelWagner(T: number, V_molar: number, M: number): number {
  if (T <= 0)    throw new Error('Temperature must be positive (K).');
  if (T > FW_Tt) throw new Error(`Feistel & Wagner (2006) valid for T ≤ ${FW_Tt} K (ice Ih).`);
  if (V_molar <= 0) throw new Error('Volume must be positive (cm³/mol).');
  const v_target = V_molar / (M * 1000); // cm³/mol → m³/kg
  const P_lo = -2e7;  // Pa (−0.02 GPa)
  const P_hi =  3e8;  // Pa (0.30 GPa)
  const v_at_lo = fwSpecificVolume(T, P_lo);
  const v_at_hi = fwSpecificVolume(T, P_hi);
  if (v_target > v_at_lo)
    throw new Error(`V = ${V_molar.toFixed(3)} cm³/mol is outside model range (P < −20 MPa).`);
  if (v_target < v_at_hi)
    throw new Error(`V = ${V_molar.toFixed(3)} cm³/mol is outside model range (P > 300 MPa).`);
  let Plo = P_lo, Phi = P_hi;
  for (let i = 0; i < 300; i++) {
    const Pm = (Plo + Phi) / 2;
    if (fwSpecificVolume(T, Pm) > v_target) Plo = Pm; else Phi = Pm;
    if ((Phi - Plo) / (P_hi - P_lo) < 1e-12) break;
  }
  return (Plo + Phi) / 2 / 1e9; // Pa → GPa
}
