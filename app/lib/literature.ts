import type { ReportedEoSParameters } from './paramUnits';

// Re-export so callers (eos.ts, tab components) can keep importing from './literature'
export type { EoSParameters, ReportedEoSParameters } from './paramUnits';

export type IcePolymorph = 'Ih' | 'II' | 'III' | 'V' | 'VI' | 'VII' | 'VIII' | 'X';
export type Molecule = 'H2O' | 'D2O';

export type EoSType = 'BM3' | 'Vinet' | 'AP1' | 'SeaFreeze' | 'FortesPowerExp' | 'Murnaghan' | 'VinetAG' | 'BM3Thermal' | 'FeistelWagner' | 'RottgerPolynomial' | 'BM3FrankPVT';

// Parameters for Fortes (2018) power/exponential thermal expansion model (P = 0 only)
// α(T) = p·T^(q/T) + r·exp(s/T)
// V(T) = V₀ · exp(∫₀ᵀ α dT')
export interface FortesPowerExpParams {
  V0: number;       // cm³/mol, extrapolated T=0 molar volume (fitted parameter)
  V0_cell: number;  // Å³, unit-cell volume as reported
  p: number;        // K⁻¹
  q: number;        // K (characteristic temperature, power-law term)
  r: number;        // K⁻¹
  s: number;        // K (characteristic temperature, exponential term)
}

// Parameters for Röttger et al. (2012) polynomial unit-cell volume fit — P = 0 GPa only
// V_cell(T) [Å³] = Σ_{i=0}^{8} A[i] · T^i;  valid 10–265 K
export interface RottgerPolynomialParams {
  A: [number, number, number, number, number, number, number, number, number]; // A0..A8 in Å³/K^i
  Z: number; // formula units per unit cell
}

// Parameters for Murnaghan (1944) thermal PVT EoS — Fortes et al. (2012) form
// V(P,T) = V_{P_ref,T_ref}(T) / [P*(K'/K(T)) + 1]^(1/K')
// V_ref(T) = V_ref + X1·T* + X2·T*²    T* = T − T_ref
// K(T)     = K_ref + dKdT·T*
// P* = P − P_ref
export interface MurnaghanParams {
  V_ref: number;  // cm³/mol at P_ref, T_ref
  X1: number;     // cm³/mol/K
  X2: number;     // cm³/mol/K²
  K_ref: number;  // GPa, bulk modulus at P_ref, T_ref
  dKdT: number;   // GPa/K, ∂K/∂T at constant P
  Kp: number;     // dimensionless, K' = ∂K/∂P
  P_ref: number;  // GPa, reference pressure
  T_ref: number;  // K, reference temperature
}

// Parameters for Frank et al. (2004) BM3+thermal PVT EoS for ice VII
// V(P,T) = V_BM3(P,T_ref) × exp{[a₀(T−T_ref) + (a₁/2)(T²−T_ref²)] / (1 + (K0p/K0)·P)^eta}
// where V_BM3(P,T_ref) is the isothermal BM3 volume at T_ref (= 300 K)
export interface FrankPVTParams {
  V0: number;    // cm³/mol (BM3 zero-pressure volume at T_ref)
  K0: number;    // GPa
  K0p: number;   // dimensionless
  T_ref: number; // K (reference temperature = 300 K)
  a0: number;    // K⁻¹ (intercept of linear α₀(T) = a₀ + a₁T)
  a1: number;    // K⁻² (slope of α₀(T))
  eta: number;   // dimensionless (pressure exponent for α)
  P_min: number; // GPa (outer bisection lower bound; ≈ lower limit of valid range)
  P_max: number; // GPa (outer bisection upper bound; ≈ upper limit of valid range)
}

export interface LiteratureEntry {
  id: string;
  citation: string;
  fullRef: string;
  doi?: string;
  eosType: EoSType;
  molecule: Molecule;
  params?: ReportedEoSParameters;           // undefined for SeaFreeze / FortesPowerExp / Murnaghan / RottgerPolynomial / BM3FrankPVT
  fortesParams?: FortesPowerExpParams;      // defined only for FortesPowerExp entries
  murnaghanParams?: MurnaghanParams;        // defined only for Murnaghan entries
  rottgerParams?: RottgerPolynomialParams;  // defined only for RottgerPolynomial entries
  frankPVTParams?: FrankPVTParams;          // defined only for BM3FrankPVT entries
  seafreezePhase?: string;                  // 'II' | 'III' | 'V' | 'VI' for SeaFreeze entries
  isothermal?: boolean;
  notes?: string;
}

export const POLYMORPHS: IcePolymorph[] = ['Ih', 'II', 'III', 'V', 'VI', 'VII', 'VIII', 'X'];
export const MOLECULES: Molecule[] = ['H2O', 'D2O'];

export const POLYMORPH_LABELS: Record<IcePolymorph, string> = {
  Ih: 'Ice Ih',
  II: 'Ice II',
  III: 'Ice III',
  V: 'Ice V',
  VI: 'Ice VI',
  VII: 'Ice VII',
  VIII: 'Ice VIII',
  X: 'Ice X',
};

export const MOLECULE_LABELS: Record<Molecule, string> = {
  H2O: 'H₂O',
  D2O: 'D₂O',
};

export const MOLAR_MASS: Record<Molecule, number> = {
  H2O: 18.015, // g/mol
  D2O: 20.027, // g/mol
};

// Number of formula units per conventional unit cell
export const POLYMORPH_Z: Record<IcePolymorph, number> = {
  Ih:   4,  // P6₃/mmc hexagonal
  II:  12,  // R3̄ rhombohedral primitive cell
  III: 12,  // P4₁2₁2 tetragonal
  V:   28,  // C2/c monoclinic
  VI:  10,  // P4₂/nmc tetragonal
  VII:  2,  // Pn3̄m cubic
  VIII: 8,  // I4₁/amd body-centered tetragonal
  X:    2,  // Pn3̄m cubic (proton-symmetric; same bcc O sublattice as VII)
};

export const LITERATURE: Record<IcePolymorph, LiteratureEntry[]> = {
  X: [
    {
      id: 'x_h2o_sugimura2008',
      citation: 'Sugimura et al. (2008)',
      fullRef: 'Sugimura, E. et al. (2008). Compression of H₂O ice to 126 GPa and implications for hydrogen-bond symmetrization: Synchrotron x-ray diffraction measurements and density-functional calculations. Phys. Rev. B, 77, 214103.',
      doi: '10.1103/PhysRevB.77.214103',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table II, Experiment row "Dynamically disordered ice X". K' fixed at 4.
      params: {
        V0:    { value: '8.05',  unit: 'cm3/mol' },
        T_ref: { value: '300',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '145',   unit: 'GPa' },
        K0p:   { value: '4',     unit: '1' },
      },
      notes: 'Table II, Experiment. Vinet EoS fit to data above ~63 GPa at 300 K. K₀′ fixed at 4. V₀ is a fitted parameter (not measured at 0 GPa).',
    },
  ],
  VIII: [
    {
      id: 'viii_h2o_fukui2022_10k',
      citation: 'Fukui et al. (2022) 10 K',
      fullRef: 'Fukui, H. et al. (2022). Equation of states for dense ice up to 80 GPa at low-temperature conditions. J. Chem. Phys., 156, 064504.',
      doi: '10.1063/5.0084278',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      params: {
        V0:    { value: '12.030', unit: 'cm3/mol' },
        T_ref: { value: '10',    unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '30.8(13)',  unit: 'GPa' },
        K0p:   { value: '3.7(1)',   unit: '1' },
      },
      notes: 'Table I, BM3 at 10 K. V₀ fixed from literature. Valid 9.8–53.0 GPa.',
    },
    {
      id: 'viii_h2o_fukui2022_120k',
      citation: 'Fukui et al. (2022) 120 K',
      fullRef: 'Fukui, H. et al. (2022). Equation of states for dense ice up to 80 GPa at low-temperature conditions. J. Chem. Phys., 156, 064504.',
      doi: '10.1063/5.0084278',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      params: {
        V0:    { value: '12.129', unit: 'cm3/mol' },
        T_ref: { value: '120',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '26.7(12)',  unit: 'GPa' },
        K0p:   { value: '4.1(1)',   unit: '1' },
      },
      notes: 'Table I, BM3 at 120 K. V₀ fixed from literature. Valid 9.0–52.6 GPa.',
    },
    {
      id: 'viii_h2o_fukui2022_300k',
      citation: 'Fukui et al. (2022) 300 K',
      fullRef: 'Fukui, H. et al. (2022). Equation of states for dense ice up to 80 GPa at low-temperature conditions. J. Chem. Phys., 156, 064504.',
      doi: '10.1063/5.0084278',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      params: {
        V0:    { value: '12.730', unit: 'cm3/mol' },
        T_ref: { value: '300',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '14.8(12)',  unit: 'GPa' },
        K0p:   { value: '4.59(8)',  unit: '1' },
      },
      notes: 'Table I, BM3 at 300 K. V₀ fixed from literature. Valid 4.4–78.2 GPa.',
    },
    {
      id: 'viii_d2o_klotz2017_bm3_93k',
      citation: 'Klotz et al. (2017) BM3 93 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'BM3',
      molecule: 'D2O',
      isothermal: true,
      // V0 = 160.35 Å³ (Table II/IV); Z=8 → 160.35/(8×1.66054) = 12.071 cm³/mol
      params: {
        V0:    { value: '160.35', unit: 'A3/cell' },
        T_ref: { value: '93',    unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '18.7(2)',  unit: 'GPa' },
        K0p:   { value: '5.7(1)',   unit: '1' },
      },
      notes: 'Table IV, BM3 fit at 93 K. V₀ = 160.35 Å³ imposed.',
    },
    {
      id: 'viii_d2o_klotz2017_vinet_93k',
      citation: 'Klotz et al. (2017) Vinet 93 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'Vinet',
      molecule: 'D2O',
      isothermal: true,
      params: {
        V0:    { value: '160.35', unit: 'A3/cell' },
        T_ref: { value: '93',    unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '18.5(2)',  unit: 'GPa' },
        K0p:   { value: '6.0(1)',   unit: '1' },
      },
      notes: 'Table IV, Rydberg-Vinet fit at 93 K. V₀ = 160.35 Å³ imposed.',
    },
    {
      id: 'viii_d2o_klotz2017_ap1_93k',
      citation: 'Klotz et al. (2017) AP1 93 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'AP1',
      molecule: 'D2O',
      isothermal: true,
      params: {
        V0:    { value: '160.35', unit: 'A3/cell' },
        T_ref: { value: '93',    unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '18.6(2)',  unit: 'GPa' },
        K0p:   { value: '5.9(1)',   unit: '1' },
      },
      notes: 'Table IV, Holzapfel AP1 fit at 93 K. V₀ = 160.35 Å³ imposed.',
    },
    {
      id: 'viii_d2o_klotz2017_bm3_196k',
      citation: 'Klotz et al. (2017) BM3 196 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'BM3',
      molecule: 'D2O',
      isothermal: true,
      // V0 = 164.05 Å³ (Table II/IV); Z=8 → 164.05/(8×1.66054) = 12.350 cm³/mol
      params: {
        V0:    { value: '164.05', unit: 'A3/cell' },
        T_ref: { value: '196',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '15.6(3)',  unit: 'GPa' },
        K0p:   { value: '6.2(2)',   unit: '1' },
      },
      notes: 'Table IV, BM3 fit at 196 K. V₀ = 164.05 Å³ imposed.',
    },
    {
      id: 'viii_d2o_klotz2017_vinet_196k',
      citation: 'Klotz et al. (2017) Vinet 196 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'Vinet',
      molecule: 'D2O',
      isothermal: true,
      params: {
        V0:    { value: '164.05', unit: 'A3/cell' },
        T_ref: { value: '196',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '15.4(2)',  unit: 'GPa' },
        K0p:   { value: '6.4(2)',   unit: '1' },
      },
      notes: 'Table IV, Rydberg-Vinet fit at 196 K. V₀ = 164.05 Å³ imposed.',
    },
    {
      id: 'viii_d2o_klotz2017_ap1_196k',
      citation: 'Klotz et al. (2017) AP1 196 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'AP1',
      molecule: 'D2O',
      isothermal: true,
      params: {
        V0:    { value: '164.05', unit: 'A3/cell' },
        T_ref: { value: '196',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '15.6(3)',  unit: 'GPa' },
        K0p:   { value: '6.2(2)',   unit: '1' },
      },
      notes: 'Table IV, Holzapfel AP1 fit at 196 K. V₀ = 164.05 Å³ imposed.',
    },
  ],
  Ih: [
    {
      id: 'ih_h2o_feistel2006',
      citation: 'Feistel & Wagner (2006)',
      fullRef: 'Feistel, R. & Wagner, W. (2006). A new equation of state for H₂O ice Ih. J. Phys. Chem. Ref. Data, 35, 1021–1047.',
      doi: '10.1063/1.2183324',
      eosType: 'FeistelWagner',
      molecule: 'H2O',
      notes: 'IAPWS-2006 Gibbs energy EoS. Valid range: T ≤ 273.16 K, P ≲ 210 MPa (ice Ih stability).',
    },
    {
      id: 'ih_h2o_rottger2012',
      citation: 'Röttger et al. (2012) H₂O',
      fullRef: 'Röttger, K., Endriss, A., Ihringer, J., Doyle, S. & Kuhs, W.F. (2012). Lattice constants and thermal expansion of H₂O and D₂O ice Ih between 10 and 265 K. Addendum. Acta Cryst. B, 68, 91.',
      doi: '10.1107/S0108768111046908',
      eosType: 'RottgerPolynomial',
      molecule: 'H2O',
      rottgerParams: {
        // V_cell(T) [Å³] = Σ A[i]·T^i, Table 1 of the 2012 addendum
        A: [128.2147, 0, 0, -1.3152e-6, 2.4837e-8, -1.6064e-10, 4.6097e-13, -4.9661e-16, 0],
        Z: 4,
      },
      notes: 'V_cell(T) = A₀ + A₃T³ + A₄T⁴ + … + A₇T⁷ [Å³]. P = 0 GPa only. Valid 10–265 K.',
    },
    {
      id: 'ih_d2o_rottger2012',
      citation: 'Röttger et al. (2012) D₂O',
      fullRef: 'Röttger, K., Endriss, A., Ihringer, J., Doyle, S. & Kuhs, W.F. (2012). Lattice constants and thermal expansion of H₂O and D₂O ice Ih between 10 and 265 K. Addendum. Acta Cryst. B, 68, 91.',
      doi: '10.1107/S0108768111046908',
      eosType: 'RottgerPolynomial',
      molecule: 'D2O',
      rottgerParams: {
        // V_cell(T) [Å³] = Σ A[i]·T^i, Table 1 of the 2012 addendum
        // A[8] = 4.5747e-18: image renders "10^-1" but context (A[7]=4.86e-15, lattice-a A[8]=1.28e-19) implies 10^-18
        A: [128.3316, 0, 0, -2.2616e-6, 5.1581e-8, -4.5811e-10, 2.0890e-12, -4.8591e-15, 4.5747e-18],
        Z: 4,
      },
      notes: 'V_cell(T) = A₀ + A₃T³ + A₄T⁴ + … + A₈T⁸ [Å³]. P = 0 GPa only. Valid 10–265 K. A₈ = 4.5747×10⁻¹⁸ (paper likely has a typo: "×10⁻¹" should be "×10⁻¹⁸").',
    },
    {
      id: 'ih_h2o_fortes2018',
      citation: 'Fortes (2018) H₂O',
      fullRef: 'Fortes, A.D. (2018). Accurate and precise lattice parameters of H₂O and D₂O ice Ih between 1.6 and 270 K from high-resolution time-of-flight neutron powder diffraction data. Acta Cryst. B, 74, 196–216.',
      doi: '10.1107/S2052520618002159',
      eosType: 'FortesPowerExp',
      molecule: 'H2O',
      // V₀ = 128.220 Å³ (Table 3, unit-cell volume); Z=4 → 128.220 × Nₐ×10⁻²⁴/4 = 19.304 cm³/mol
      fortesParams: { V0: 19.304, V0_cell: 128.220, p: 4.60e-4, q: -38.8, r: -5.7e-5, s: -34.3 },
      notes: 'α(T) = p·T^(q/T) + r·exp(s/T); V(T) = V₀·exp(∫₀ᵀ α dT\'). P = 0 GPa only. Valid 1.6–270 K. Table 3.',
    },
    {
      id: 'ih_d2o_fortes2018',
      citation: 'Fortes (2018) D₂O',
      fullRef: 'Fortes, A.D. (2018). Accurate and precise lattice parameters of H₂O and D₂O ice Ih between 1.6 and 270 K from high-resolution time-of-flight neutron powder diffraction data. Acta Cryst. B, 74, 196–216.',
      doi: '10.1107/S2052520618002159',
      eosType: 'FortesPowerExp',
      molecule: 'D2O',
      // V₀ = 128.2867 Å³ (Table 4, unit-cell volume); Z=4 → 128.2867 × Nₐ×10⁻²⁴/4 = 19.314 cm³/mol
      fortesParams: { V0: 19.314, V0_cell: 128.2867, p: 5.29e-4, q: -42.0, r: -5.18e-5, s: -32.5 },
      notes: 'α(T) = p·T^(q/T) + r·exp(s/T); V(T) = V₀·exp(∫₀ᵀ α dT\'). P = 0 GPa only. Valid 1.6–270 K. Table 4.',
    },
  ],
  II: [
    {
      id: 'ii_h2o_journaux2020',
      citation: 'Journaux et al. (2020)',
      fullRef: 'Journaux, B. et al. (2020). Holistic approach for studying planetary hydrospheres: Gibbs representation of ices thermodynamics, elasticity, and the water phase diagram to 2,300 MPa. J. Geophys. Res. Planets, 125, e2019JE006176.',
      doi: '10.1029/2019JE006176',
      eosType: 'SeaFreeze',
      molecule: 'H2O',
      seafreezePhase: 'II',
      notes: 'Gibbs energy (LBF) representation. Valid: ~0.20–0.45 GPa, 180–270 K.',
    },
    {
      id: 'ii_d2o_fortes2005',
      citation: 'Fortes et al. (2005) D₂O',
      fullRef: 'Fortes, A.D., Wood, I.G., Alfredsson, M., Vočadlo, L. & Knight, K.S. (2005). The incompressibility and thermal expansivity of D₂O ice II determined by powder neutron diffraction. J. Appl. Cryst., 38, 612–618.',
      doi: '10.1107/S0021889805014226',
      eosType: 'BM3',
      molecule: 'D2O',
      isothermal: true,
      params: {
        V0:    { value: '306.95', unit: 'A3/cell' },
        T_ref: { value: '225',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '12.13', unit: 'GPa' },
        K0p:   { value: '6.0',   unit: '1' },
      },
      notes: 'Isothermal BM3 at 225 K. K₀′ = 6.0 fixed from ab initio (Fortes et al. 2003a). Fitted to 9 data points 0.25–0.45 GPa. BM3: P = (3K₀/2)(x^7/3 − x^5/3)(1 + 3/4(K₀′−4)(x^2/3−1)), x = V₀/V.',
    },
  ],
  III: [
    {
      id: 'iii_h2o_journaux2020',
      citation: 'Journaux et al. (2020)',
      fullRef: 'Journaux, B. et al. (2020). Holistic approach for studying planetary hydrospheres: Gibbs representation of ices thermodynamics, elasticity, and the water phase diagram to 2,300 MPa. J. Geophys. Res. Planets, 125, e2019JE006176.',
      doi: '10.1029/2019JE006176',
      eosType: 'SeaFreeze',
      molecule: 'H2O',
      seafreezePhase: 'III',
      notes: 'Gibbs energy (LBF) representation. Valid: ~0.29–0.45 GPa, 240–270 K.',
    },
  ],
  V: [
    {
      id: 'v_h2o_journaux2020',
      citation: 'Journaux et al. (2020)',
      fullRef: 'Journaux, B. et al. (2020). Holistic approach for studying planetary hydrospheres: Gibbs representation of ices thermodynamics, elasticity, and the water phase diagram to 2,300 MPa. J. Geophys. Res. Planets, 125, e2019JE006176.',
      doi: '10.1029/2019JE006176',
      eosType: 'SeaFreeze',
      molecule: 'H2O',
      seafreezePhase: 'V',
      notes: 'Gibbs energy (LBF) representation. Valid: ~0.40–0.62 GPa, 210–280 K.',
    },
  ],
  VI: [
    {
      id: 'vi_h2o_journaux2020',
      citation: 'Journaux et al. (2020)',
      fullRef: 'Journaux, B. et al. (2020). Holistic approach for studying planetary hydrospheres: Gibbs representation of ices thermodynamics, elasticity, and the water phase diagram to 2,300 MPa. J. Geophys. Res. Planets, 125, e2019JE006176.',
      doi: '10.1029/2019JE006176',
      eosType: 'SeaFreeze',
      molecule: 'H2O',
      seafreezePhase: 'VI',
      notes: 'Gibbs energy (LBF) representation. Valid: ~0.62–2.30 GPa, 130–450 K.',
    },
    {
      id: 'vi_h2o_bezacier2014',
      citation: 'Bezacier et al. (2014)',
      fullRef: 'Bezacier, L. et al. (2014). Equations of state of ice VI and ice VII at high pressure and high temperature. J. Chem. Phys., 141, 104505.',
      doi: '10.1063/1.4894421',
      eosType: 'BM3',
      molecule: 'H2O',
      // Table II, PVT fit. BM2 (K₀' = 4 fixed). α₀ = 14.6(14) × 10⁻⁵ K⁻¹.
      params: {
        V0:    { value: '14.17(2)',    unit: 'cm3/mol' },
        T_ref: { value: '300',        unit: 'K' },
        P_ref: { value: '0',          unit: 'GPa' },
        K0:    { value: '14.05(23)',   unit: 'GPa' },
        K0p:   { value: '4',        unit: '1' },
        alpha: { value: '14.6(14)', unit: '10-5/K' },
      },
      notes: 'PVT BM2 fit (K₀′ fixed at 4). Valid ~1–2.6 GPa, 300–340 K. Table II. P = (3K₀/2)[(V₀(T)/V)^(7/3) − (V₀(T)/V)^(5/3)]; V₀(T) = V₀[1 + α₀(T − T_ref)].',
    },
    {
      id: 'vi_d2o_fortes2012',
      citation: 'Fortes et al. (2012) D₂O',
      fullRef: 'Fortes, A.D. et al. (2012). The P–V–T equation of state of D₂O ice VI determined by neutron powder diffraction in the range 0 < P < 2.6 GPa and 120 < T < 330 K. J. Appl. Cryst., 45, 523–534.',
      doi: '10.1107/S0021889812014847',
      eosType: 'Murnaghan',
      molecule: 'D2O',
      // Table 4, unit-cell volume column. Z=10, V_cell[Å³] / (10×1.66054) → cm³/mol.
      // V_1.25,225 = 214.94 Å³ → 12.944 cm³/mol
      // X1 = 6.1×10⁻² Å³/K → 3.673×10⁻³ cm³/mol/K
      // X2 = 6.1×10⁻⁵ Å³/K² → 3.673×10⁻⁶ cm³/mol/K²
      murnaghanParams: {
        V_ref: 12.944, X1: 3.673e-3, X2: 3.673e-6,
        K_ref: 21.7, dKdT: -0.015, Kp: 4.4,
        P_ref: 1.25, T_ref: 225,
      },
      notes: 'Murnaghan PVT fit. Valid 0 < P < 2.6 GPa, 120 < T < 330 K. Table 4.',
    },
  ],
  VII: [
    {
      id: 'vii_h2o_bezacier2014',
      citation: 'Bezacier et al. (2014)',
      fullRef: 'Bezacier, L. et al. (2014). Equations of state of ice VI and ice VII at high pressure and high temperature. J. Chem. Phys., 141, 104505.',
      doi: '10.1063/1.4894421',
      eosType: 'BM3',
      molecule: 'H2O',
      // Table II, PVT fit. BM2 (K₀' = 4 fixed). α₀ = 11.58(54) × 10⁻⁵ K⁻¹.
      params: {
        V0:    { value: '12.49(1)',    unit: 'cm3/mol' },
        T_ref: { value: '300',        unit: 'K' },
        P_ref: { value: '0',          unit: 'GPa' },
        K0:    { value: '20.15(17)',   unit: 'GPa' },
        K0p:   { value: '4',          unit: '1' },
        alpha: { value: '11.58(54)',  unit: '10-5/K' },
      },
      notes: 'PVT BM2 fit (K₀′ fixed at 4). Valid ~2.7–10.1 GPa, 300–450 K. Table II. P = (3K₀/2)[(V₀(T)/V)^(7/3) − (V₀(T)/V)^(5/3)]; V₀(T) = V₀[1 + α₀(T − T_ref)].',
    },
    {
      id: 'vii_h2o_fei1993',
      citation: 'Fei et al. (1993)',
      fullRef: 'Fei, Y., Mao, H.-K. & Hemley, R.J. (1993). Thermal expansivity, bulk modulus, and melting curve of H₂O–ice VII to 20 GPa. J. Chem. Phys., 99, 5369–5373.',
      doi: '10.1063/1.465980',
      eosType: 'BM3Thermal',
      molecule: 'H2O',
      params: {
        V0:    { value: '12.3(2)',  unit: 'cm3/mol' },
        T_ref: { value: '300',     unit: 'K' },
        P_ref: { value: '0',       unit: 'GPa' },
        K0:    { value: '23.9(7)', unit: 'GPa' },
        K0p:   { value: '4.2(5)',  unit: '1' },
        // α₀(T) = a₀ + a₁T; a₀=−3.9×10⁻⁴, a₁=1.5×10⁻⁶. alpha = α₀(300K), alpha1 = a₁
        alpha:  { value: '6.0', unit: '10-5/K' },
        alpha1: { value: '1.5', unit: '10-6/K2' },
      },
      notes: 'BM3 (isothermal, 300 K): P = (3K₀/2)(x⁷/³−x⁵/³)(1+(3/4)(K₀′−4)(x²/³−1)), x=V₀/V. PVT: V(P,T)=V(P,300K)·exp[∫α(P,T)dT], α(P,T)=α₀(T)(1+K′₀/K₀·P)^(−η), α₀(T)=a₀+a₁T; a₀=−3.9×10⁻⁴, a₁=1.5×10⁻⁶, η=0.9. Pressure-dependent α correction (η) not implemented; zero-pressure α₀(T) is used.',
    },
    {
      id: 'vii_h2o_hemley1987',
      citation: 'Hemley et al. (1987)',
      fullRef: 'Hemley, R.J. et al. (1987). Static compression of H₂O-ice to 128 GPa. Nature, 330, 737–740.',
      doi: '10.1038/330737a0',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      // Fig. 2 caption in Hemley et al. (1987): V₀₂=12.3(3) cm³/mol, K₀₂=23.7(9) GPa, K₀₂'=4.15(7). RT.
      // V₀ fitted simultaneously with K₀ using Jeanloz (1981) finite-strain method (BM3 form, p* = ρ₀₁ of ice I).
      params: {
        V0:    { value: '12.3(3)',  unit: 'cm3/mol' },
        T_ref: { value: '300',     unit: 'K' },
        P_ref: { value: '0',       unit: 'GPa' },
        K0:    { value: '23.7(9)', unit: 'GPa' },
        K0p:   { value: '4.15(7)', unit: '1' },
      },
      notes: 'BM3 (Jeanloz 1981 finite-strain form): P = (3K₀/2)(x⁷/³−x⁵/³)(1+(3/4)(K₀′−4)(x²/³−1)), x=V₀/V. V₀ extrapolated to zero pressure by linear least-squares fit using ice I density as reference. 4.3–128 GPa, RT.',
    },
    {
      id: 'vii_h2o_frank2004',
      citation: 'Frank et al. (2004)',
      fullRef: 'Frank, M.R., Fei, Y. & Hu, J. (2004). Constraining the equation of state of fluid H₂O to 80 GPa using the melting curve, bulk modulus, and thermal expansivity of Ice VII. Geochim. Cosmochim. Acta, 68, 2781–2790.',
      doi: '10.1016/j.gca.2003.12.007',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      // Table 3 "This study". BM3 fit; V₀ constrained by compression data (nonquenchable phase).
      params: {
        V0:    { value: '12.4', unit: 'cm3/mol' },
        T_ref: { value: '300', unit: 'K' },
        P_ref: { value: '0',   unit: 'GPa' },
        K0:    { value: '21.1', unit: 'GPa' },
        K0p:   { value: '4.4', unit: '1' },
      },
      notes: 'Table 3, BM3 fit at 300 K. Valid 6.57–60.52 GPa. V₀ is a fitted parameter (ice VII is nonquenchable).',
    },
    {
      id: 'vii_h2o_frank2004_pvt',
      citation: 'Frank et al. (2004) PVT',
      fullRef: 'Frank, M.R., Fei, Y. & Hu, J. (2004). Constraining the equation of state of fluid H₂O to 80 GPa using the melting curve, bulk modulus, and thermal expansivity of Ice VII. Geochim. Cosmochim. Acta, 68, 2781–2790.',
      doi: '10.1016/j.gca.2003.12.007',
      eosType: 'BM3FrankPVT',
      molecule: 'H2O',
      // Eqs. 2–5. BM3 isothermal params at 300 K from Table 3 "This study".
      // α(P,T) = (a₀+a₁T)/(1+(K′/K)P)^η; a₀=-4.2×10⁻⁴ K⁻¹, a₁=1.56×10⁻⁶ K⁻², η=1.1
      frankPVTParams: {
        V0: 12.4,    // cm³/mol
        K0: 21.1,    // GPa
        K0p: 4.4,
        T_ref: 300,  // K
        a0: -4.2e-4, // K⁻¹
        a1: 1.56e-6, // K⁻²
        eta: 1.1,
        P_min: 5.0,  // GPa (data from 6.57 GPa; slight extension for bisection)
        P_max: 65.0, // GPa (data to 60.52 GPa)
      },
      notes: 'Eqs. 4–5. α(P,T) = (a₀+a₁T)·(1+(K′/K)P)⁻η; V(P,T) = V_BM3(P,300K)·exp(∫₃₀₀ᵀ α dT). Valid 6.57–60.52 GPa, T ≥ 300 K (data collected on heating).',
    },
    {
      id: 'vii_h2o_sugimura2008',
      citation: 'Sugimura et al. (2008) P–V 300 K',
      fullRef: 'Sugimura, E. et al. (2008). Compression of H₂O ice to 126 GPa and implications for hydrogen-bond symmetrization: Synchrotron x-ray diffraction measurements and density-functional calculations. Phys. Rev. B, 77, 214103.',
      doi: '10.1103/PhysRevB.77.214103',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table II, Experiment row. V₀ = 14.52 cm³/mol fixed from ambient conditions (Ref. 3 therein).
      params: {
        V0:    { value: '14.52', unit: 'cm3/mol' },
        T_ref: { value: '300',  unit: 'K' },
        P_ref: { value: '0',    unit: 'GPa' },
        K0:    { value: '5.02', unit: 'GPa' },
        K0p:   { value: '7.51', unit: '1' },
      },
      notes: 'Table II, Experiment. Vinet EoS fit to synchrotron XRD data up to ~40 GPa at 300 K. V₀ fixed at ambient value.',
    },
    {
      id: 'vii_h2o_sugimura2010',
      citation: 'Sugimura et al. (2010) P–V–T',
      fullRef: 'Sugimura, E. et al. (2010). Simultaneous high-pressure and high-temperature volume measurements of ice VII and its thermal equation of state. Phys. Rev. B, 82, 134103.',
      doi: '10.1103/PhysRevB.82.134103',
      eosType: 'VinetAG',
      molecule: 'H2O',
      // Table II "This study": V₀=14.52 cm³/mol (from Loubeyre et al.), K₀=5.02 GPa, K'=7.51
      // α₀=150×10⁻⁵ K⁻¹, δ_T=5.1 (Anderson-Grüneisen)
      params: {
        V0:     { value: '14.52', unit: 'cm3/mol' },
        T_ref:  { value: '300',  unit: 'K' },
        P_ref:  { value: '0',    unit: 'GPa' },
        K0:     { value: '5.02', unit: 'GPa' },
        K0p:    { value: '7.51', unit: '1' },
        alpha:  { value: '150',  unit: '10-5/K' },
        deltaT: { value: '5.1',  unit: '1' },
      },
      notes: 'Table II, This study. Vinet + Anderson-Grüneisen P-V-T EoS. Valid ~19–50 GPa, 430–880 K.',
    },
    // --- Lai et al. (2022) ---
    {
      id: 'vii_h2o_lai2022',
      citation: 'Lai et al. (2022)',
      fullRef: 'Lai, X. et al. (2022). Thermal equation of state of ice-VII revisited by single-crystal X-ray diffraction. American Mineralogist.',
      doi: '10.2138/am-2022-8554',
      eosType: 'BM3Thermal',
      molecule: 'H2O',
      // Table 1 "This study", BM EoS thermal. V₀=12.3 cm³/mol fixed at 300 K.
      // K₀(T)=21.0+(-0.009)(T-300) GPa; α(T)=15×10⁻⁵+15×10⁻⁸(T-300) K⁻¹ [Berman 1988]
      params: {
        V0:     { value: '12.3',   unit: 'cm3/mol' },
        T_ref:  { value: '300',   unit: 'K' },
        P_ref:  { value: '0',     unit: 'GPa' },
        K0:     { value: '21.0',  unit: 'GPa' },
        K0p:    { value: '4.45',  unit: '1' },
        alpha:  { value: '15',    unit: '10-5/K' },
        alpha1: { value: '15',    unit: '10-8/K2' },
        dKdT:   { value: '-0.009', unit: 'GPa/K' },
      },
      notes: 'Table 1, Berman (1988) thermal BM3. Valid 3.5–78.2 GPa, 300–1000 K. SCXRD.',
    },
    {
      id: 'vii_h2o_lai2022_300k',
      citation: 'Lai et al. (2022) 300 K',
      fullRef: 'Lai, X. et al. (2022). Thermal equation of state of ice-VII revisited by single-crystal X-ray diffraction. American Mineralogist.',
      doi: '10.2138/am-2022-8554',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 "This study", BM EoS 300 K fit (V₀ fitted).
      params: {
        V0:    { value: '12.4', unit: 'cm3/mol' },
        T_ref: { value: '300', unit: 'K' },
        P_ref: { value: '0',   unit: 'GPa' },
        K0:    { value: '19.2', unit: 'GPa' },
        K0p:   { value: '4.6', unit: '1' },
      },
      notes: 'Table 1, isothermal BM3 at 300 K. Valid 3.5–78.2 GPa. SCXRD.',
    },
    {
      id: 'vii_h2o_lai2022_300k_vinet',
      citation: 'Lai et al. (2022) Vinet 300 K',
      fullRef: 'Lai, X. et al. (2022). Thermal equation of state of ice-VII revisited by single-crystal X-ray diffraction. American Mineralogist.',
      doi: '10.2138/am-2022-8554',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 "This study", Vinet EoS 300 K fit (V₀ fitted, preferred by authors).
      params: {
        V0:    { value: '12.7', unit: 'cm3/mol' },
        T_ref: { value: '300', unit: 'K' },
        P_ref: { value: '0',   unit: 'GPa' },
        K0:    { value: '15.0', unit: 'GPa' },
        K0p:   { value: '5.6', unit: '1' },
      },
      notes: 'Table 1, isothermal Vinet at 300 K (fitted V₀). Valid 3.5–78.2 GPa. SCXRD.',
    },
    // --- Wolanin et al. (1997) ---
    {
      id: 'vii_h2o_wolanin1997_bm3',
      citation: 'Wolanin et al. (1997) BM3',
      fullRef: 'Wolanin, E. et al. (1997). Equation of state of ice VII up to 106 GPa. Phys. Rev. B, 56, 5781.',
      doi: '10.1103/PhysRevB.56.5781',
      eosType: 'BM3',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=14.9(8) fixed, K'=5.4(1), V₀=12.37(8). RT.
      params: {
        V0:    { value: '12.37(8)', unit: 'cm3/mol' },
        T_ref: { value: '300',     unit: 'K' },
        P_ref: { value: '0',       unit: 'GPa' },
        K0:    { value: '14.9(8)', unit: 'GPa' },
        K0p:   { value: '5.4(1)',  unit: '1' },
      },
      notes: 'BM3 fit, ~5–106 GPa, RT. K₀ was fixed during fitting. PXRD.',
    },
    {
      id: 'vii_h2o_wolanin1997_vinet',
      citation: 'Wolanin et al. (1997) Vinet',
      fullRef: 'Wolanin, E. et al. (1997). Equation of state of ice VII up to 106 GPa. Phys. Rev. B, 56, 5781.',
      doi: '10.1103/PhysRevB.56.5781',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=14.9(8) fixed, K'=6.2(1), V₀=12.1(3). RT.
      params: {
        V0:    { value: '12.1(3)',  unit: 'cm3/mol' },
        T_ref: { value: '300',     unit: 'K' },
        P_ref: { value: '0',       unit: 'GPa' },
        K0:    { value: '14.9(8)', unit: 'GPa' },
        K0p:   { value: '6.2(1)',  unit: '1' },
      },
      notes: 'Vinet fit, ~5–106 GPa, RT. K₀ was fixed during fitting. PXRD.',
    },
    // --- Loubeyre et al. (1999) ---
    {
      id: 'vii_h2o_loubeyre1999',
      citation: 'Loubeyre et al. (1999)',
      fullRef: 'Loubeyre, P. et al. (1999). Modulated phases and proton centring in ice observed by X-ray diffraction up to 170 GPa. Nature, 397, 503–506.',
      doi: '10.1038/17109',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=4.26, K'=7.75, V₀=14.52. RT, 2–170 GPa.
      params: {
        V0:    { value: '14.52', unit: 'cm3/mol' },
        T_ref: { value: '300',  unit: 'K' },
        P_ref: { value: '0',    unit: 'GPa' },
        K0:    { value: '4.26', unit: 'GPa' },
        K0p:   { value: '7.75', unit: '1' },
      },
      notes: 'Vinet fit, 2–170 GPa, RT. V₀ fixed at ambient value. SCXRD.',
    },
    // --- Somayazulu et al. (2008) ---
    {
      id: 'vii_h2o_somayazulu2008',
      citation: 'Somayazulu et al. (2008)',
      fullRef: 'Somayazulu, M. et al. (2008). In situ high-pressure x-ray diffraction study of H₂O ice VII. J. Chem. Phys., 128, 064510.',
      doi: '10.1063/1.2813890',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=4.21(4), K'=7.77(2), V₀=14.52(5). RT, 3–48 GPa.
      params: {
        V0:    { value: '14.52(5)', unit: 'cm3/mol' },
        T_ref: { value: '300',     unit: 'K' },
        P_ref: { value: '0',       unit: 'GPa' },
        K0:    { value: '4.21(4)', unit: 'GPa' },
        K0p:   { value: '7.77(2)', unit: '1' },
      },
      notes: 'Vinet fit, 3–48 GPa, RT. rXRD + SXRD.',
    },
    // --- Grande et al. (2022) — 3 pressure-range Vinet fits ---
    {
      id: 'vii_h2o_grande2022_low',
      citation: 'Grande et al. (2022) 2.7–5.1 GPa',
      fullRef: 'Grande, Z.M. et al. (2022). Pressure-driven symmetry transitions in dense H₂O ice. Phys. Rev. B, 105, 104109.',
      doi: '10.1103/PhysRevB.105.104109',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=18.5(40), K'=2.5(16), V₀=12.79(27). RT.
      params: {
        V0:    { value: '12.79(27)', unit: 'cm3/mol' },
        T_ref: { value: '300',      unit: 'K' },
        P_ref: { value: '0',        unit: 'GPa' },
        K0:    { value: '18.5(40)', unit: 'GPa' },
        K0p:   { value: '2.5(16)',  unit: '1' },
      },
      notes: 'Vinet fit, 2.7–5.1 GPa, RT. PXRD.',
    },
    {
      id: 'vii_h2o_grande2022_mid',
      citation: 'Grande et al. (2022) 5.1–30.9 GPa',
      fullRef: 'Grande, Z.M. et al. (2022). Pressure-driven symmetry transitions in dense H₂O ice. Phys. Rev. B, 105, 104109.',
      doi: '10.1103/PhysRevB.105.104109',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=20.8(25), K'=4.49(35), V₀=12.37(16). RT.
      params: {
        V0:    { value: '12.37(16)', unit: 'cm3/mol' },
        T_ref: { value: '300',      unit: 'K' },
        P_ref: { value: '0',        unit: 'GPa' },
        K0:    { value: '20.8(25)', unit: 'GPa' },
        K0p:   { value: '4.49(35)', unit: '1' },
      },
      notes: 'Vinet fit, 5.1–30.9 GPa, RT. PXRD.',
    },
    {
      id: 'vii_h2o_grande2022_high',
      citation: 'Grande et al. (2022) 30.9–60 GPa',
      fullRef: 'Grande, Z.M. et al. (2022). Pressure-driven symmetry transitions in dense H₂O ice. Phys. Rev. B, 105, 104109.',
      doi: '10.1103/PhysRevB.105.104109',
      eosType: 'Vinet',
      molecule: 'H2O',
      isothermal: true,
      // Table 1 in Lai et al. (2022): K₀=50.5(42), K'=4.50(15), V₀=10.18(13). RT.
      params: {
        V0:    { value: '10.18(13)', unit: 'cm3/mol' },
        T_ref: { value: '300',      unit: 'K' },
        P_ref: { value: '0',        unit: 'GPa' },
        K0:    { value: '50.5(42)', unit: 'GPa' },
        K0p:   { value: '4.50(15)', unit: '1' },
      },
      notes: 'Vinet fit, 30.9–60 GPa, RT. PXRD.',
    },
    {
      id: 'vii_d2o_klotz2017_bm3',
      citation: 'Klotz et al. (2017) BM3',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'BM3',
      molecule: 'D2O',
      isothermal: true,
      // V0 = 42.25 Å³ (as reported); Z=2 → 42.25/(2×1.66054) = 12.722 cm³/mol
      params: {
        V0:    { value: '42.25',  unit: 'A3/cell' },
        T_ref: { value: '298',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '13.8(2)', unit: 'GPa' },
        K0p:   { value: '5.9(1)',  unit: '1' },
      },
      notes: 'Table III, BM3 fit. V₀ = 42.25 Å³ imposed at 298 K.',
    },
    {
      id: 'vii_d2o_klotz2017_vinet',
      citation: 'Klotz et al. (2017) Vinet',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'Vinet',
      molecule: 'D2O',
      isothermal: true,
      params: {
        V0:    { value: '42.25',  unit: 'A3/cell' },
        T_ref: { value: '298',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '13.6(2)', unit: 'GPa' },
        K0p:   { value: '6.2(1)',  unit: '1' },
      },
      notes: 'Table III, Vinet (Rydberg-Vinet) fit. V₀ = 42.25 Å³ imposed at 298 K.',
    },
    {
      id: 'vii_d2o_klotz2017_ap1',
      citation: 'Klotz et al. (2017) AP1',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'AP1',
      molecule: 'D2O',
      isothermal: true,
      // V0 = 42.25 Å³ (imposed); Z=2 → 42.25/(2×1.66054) = 12.722 cm³/mol
      params: {
        V0:    { value: '42.25',  unit: 'A3/cell' },
        T_ref: { value: '298',   unit: 'K' },
        P_ref: { value: '0',     unit: 'GPa' },
        K0:    { value: '13.7(1)', unit: 'GPa' },
        K0p:   { value: '6.0(1)',  unit: '1' },
      },
      notes: 'Table III, Holzapfel AP1 fit. V₀ = 42.25 Å³ imposed at 298 K.',
    },
  ],
};
