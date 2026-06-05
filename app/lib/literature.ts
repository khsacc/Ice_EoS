import type { VolumeUnit } from './units';

export type IcePolymorph = 'Ih' | 'II' | 'III' | 'V' | 'VI' | 'VII' | 'VIII';
export type Molecule = 'H2O' | 'D2O';

export interface EoSParameters {
  V0: number;           // cm³/mol, for calculations (always this unit)
  V0_reported?: number; // V₀ as printed in the paper
  V0_unit?: VolumeUnit; // unit of V0_reported (default 'molar' = cm³/mol)
  T_ref: number;        // K
  P_ref: number;        // GPa
  K0: number;           // GPa
  K0p: number;          // dK/dP (dimensionless)
  alpha: number;        // K⁻¹, volumetric thermal expansion (0 for isothermal)
}

export type EoSType = 'BM3' | 'Vinet' | 'AP1' | 'SeaFreeze' | 'FortesPowerExp';

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

export interface LiteratureEntry {
  id: string;
  citation: string;
  fullRef: string;
  doi?: string;
  eosType: EoSType;
  molecule: Molecule;
  params?: EoSParameters;              // undefined for SeaFreeze / FortesPowerExp entries
  fortesParams?: FortesPowerExpParams; // defined only for FortesPowerExp entries
  seafreezePhase?: string;             // 'II' | 'III' | 'V' | 'VI' for SeaFreeze entries
  isothermal?: boolean;
  notes?: string;
}

export const POLYMORPHS: IcePolymorph[] = ['Ih', 'II', 'III', 'V', 'VI', 'VII', 'VIII'];
export const MOLECULES: Molecule[] = ['H2O', 'D2O'];

export const POLYMORPH_LABELS: Record<IcePolymorph, string> = {
  Ih: 'Ice Ih',
  II: 'Ice II',
  III: 'Ice III',
  V: 'Ice V',
  VI: 'Ice VI',
  VII: 'Ice VII',
  VIII: 'Ice VIII',
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
};

export const LITERATURE: Record<IcePolymorph, LiteratureEntry[]> = {
  VIII: [
    {
      id: 'viii_d2o_klotz2017_bm3_93k',
      citation: 'Klotz et al. (2017) BM3 93 K',
      fullRef: 'Klotz, S. et al. (2017). Bulk moduli and equations of state of ice VII and ice VIII. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'BM3',
      molecule: 'D2O',
      isothermal: true,
      // V0 = 160.35 Å³ (Table II/IV); Z = 8 → 160.35 / (8 × 1.66054) = 12.071 cm³/mol
      params: { V0: 12.071, V0_reported: 160.35, V0_unit: 'cell', T_ref: 93, P_ref: 0, K0: 18.7, K0p: 5.7, alpha: 0 },
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
      params: { V0: 12.071, V0_reported: 160.35, V0_unit: 'cell', T_ref: 93, P_ref: 0, K0: 18.5, K0p: 6.0, alpha: 0 },
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
      params: { V0: 12.071, V0_reported: 160.35, V0_unit: 'cell', T_ref: 93, P_ref: 0, K0: 18.6, K0p: 5.9, alpha: 0 },
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
      // V0 = 164.05 Å³ (Table II/IV); Z = 8 → 164.05 / (8 × 1.66054) = 12.350 cm³/mol
      params: { V0: 12.350, V0_reported: 164.05, V0_unit: 'cell', T_ref: 196, P_ref: 0, K0: 15.6, K0p: 6.2, alpha: 0 },
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
      params: { V0: 12.350, V0_reported: 164.05, V0_unit: 'cell', T_ref: 196, P_ref: 0, K0: 15.4, K0p: 6.4, alpha: 0 },
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
      params: { V0: 12.350, V0_reported: 164.05, V0_unit: 'cell', T_ref: 196, P_ref: 0, K0: 15.6, K0p: 6.2, alpha: 0 },
      notes: 'Table IV, Holzapfel AP1 fit at 196 K. V₀ = 164.05 Å³ imposed.',
    },
  ],
  Ih: [
    {
      id: 'ih_h2o_feistel2006',
      citation: 'Feistel & Wagner (2006)',
      fullRef: 'Feistel, R. & Wagner, W. (2006). A new equation of state for H₂O ice Ih. J. Phys. Chem. Ref. Data, 35, 1021–1047.',
      doi: '10.1063/1.2183324',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 19.65, T_ref: 273.15, P_ref: 0, K0: 8.9, K0p: 6.2, alpha: 5.2e-5 },
      notes: 'Simplified BM3 fit. The original IAPWS-2006 formulation uses a full Gibbs energy approach.',
    },
    {
      id: 'ih_h2o_rottger1994',
      citation: 'Röttger et al. (1994) H₂O',
      fullRef: 'Röttger, K. et al. (1994). Lattice constants and thermal expansion of H₂O and D₂O ice Ih between 10 and 265 K. Acta Cryst. B, 50, 644–648.',
      doi: '10.1107/S0108768194004165',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 19.61, T_ref: 250, P_ref: 0, K0: 8.9, K0p: 6.2, alpha: 5.0e-5 },
      notes: 'Primarily a structural study. Elastic parameters adopted from Gammon et al. (1983).',
    },
    {
      id: 'ih_d2o_rottger1994',
      citation: 'Röttger et al. (1994) D₂O',
      fullRef: 'Röttger, K. et al. (1994). Lattice constants and thermal expansion of H₂O and D₂O ice Ih between 10 and 265 K. Acta Cryst. B, 50, 644–648.',
      doi: '10.1107/S0108768194004165',
      eosType: 'BM3',
      molecule: 'D2O',
      params: { V0: 19.37, T_ref: 250, P_ref: 0, K0: 8.9, K0p: 6.2, alpha: 4.9e-5 },
      notes: 'V₀ derived from D₂O lattice parameters (a = 4.504 Å, c = 7.328 Å at 250 K). Elastic parameters estimated.',
    },
    {
      id: 'ih_h2o_fortes2018',
      citation: 'Fortes (2018) H₂O',
      fullRef: 'Fortes, A.D. (2018). Accurate and precise lattice parameters of H₂O and D₂O ice Ih between 1.6 and 270 K from high-resolution time-of-flight neutron powder diffraction data. Acta Cryst. B, 74, 196–216.',
      doi: '10.1107/S2052520618002159',
      eosType: 'FortesPowerExp',
      molecule: 'H2O',
      // V₀ = 128.220 Å³ (Table 3, unit-cell volume); Z=4 → 128.220 × Nₐ×10⁻²⁴/4 = 19.304 cm³/mol
      fortesParams: { V0: 19.304, V0_cell: 128.220, p: 4.60e-4, q: -38.8, r: -2.10e-5, s: -34.3 },
      notes: 'Power/exponential thermal expansion model, P = 0 GPa only. Valid 1.6–270 K. Table 3.',
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
      notes: 'Power/exponential thermal expansion model, P = 0 GPa only. Valid 1.6–270 K. Table 4.',
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
      id: 'ii_h2o_lobban2002',
      citation: 'Lobban et al. (2002)',
      fullRef: 'Lobban, C. et al. (2002). Ice II structure and transitions. J. Chem. Phys., 117, 3928–3934.',
      doi: '10.1063/1.1495837',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 17.10, T_ref: 250, P_ref: 0, K0: 13.0, K0p: 5.0, alpha: 3.3e-5 },
    },
    {
      id: 'ii_d2o_fortes2006',
      citation: 'Fortes et al. (2006)',
      fullRef: 'Fortes, A.D. et al. (2006). The incompressibility and thermal expansivity of D₂O ice II determined by powder neutron diffraction. J. Appl. Cryst., 39, 547–558.',
      eosType: 'BM3',
      molecule: 'D2O',
      params: { V0: 17.15, T_ref: 250, P_ref: 0, K0: 12.5, K0p: 5.0, alpha: 3.5e-5 },
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
    {
      id: 'iii_h2o_lobban2000',
      citation: 'Lobban et al. (2000)',
      fullRef: 'Lobban, C. et al. (2000). The structure of ice III. Acta Cryst. B, 56, 698–705.',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 17.20, T_ref: 250, P_ref: 0, K0: 8.5, K0p: 5.0, alpha: 3.0e-5 },
      notes: 'Prototype values. Ice III is stable only in a narrow field (0.30–0.45 GPa, 250–270 K).',
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
    {
      id: 'v_h2o_lobban1998',
      citation: 'Lobban et al. (1998)',
      fullRef: 'Lobban, C. et al. (1998). The structure of a new phase of ice. Nature, 391, 268–270.',
      doi: '10.1038/34622',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 16.50, T_ref: 250, P_ref: 0, K0: 10.0, K0p: 5.0, alpha: 3.0e-5 },
      notes: 'Prototype values. Ice V is stable 0.40–0.60 GPa.',
    },
    {
      id: 'v_h2o_fortes2014',
      citation: 'Fortes et al. (2014)',
      fullRef: 'Fortes, A.D. et al. (2014). Equation of state of ice V. J. Appl. Cryst., 47, 215–222.',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 16.48, T_ref: 260, P_ref: 0, K0: 10.5, K0p: 5.2, alpha: 3.1e-5 },
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
      params: { V0: 13.59, T_ref: 300, P_ref: 0, K0: 14.05, K0p: 5.36, alpha: 2.9e-5 },
    },
    {
      id: 'vi_h2o_fortes2012',
      citation: 'Fortes et al. (2012)',
      fullRef: 'Fortes, A.D. et al. (2012). Crystal structure and thermal expansion of ice VI. J. Appl. Cryst., 45, 681–692.',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 13.60, T_ref: 295, P_ref: 0, K0: 13.7, K0p: 5.4, alpha: 3.0e-5 },
    },
  ],
  VII: [
    {
      id: 'vii_h2o_fei1993',
      citation: 'Fei et al. (1993)',
      fullRef: 'Fei, Y. et al. (1993). Equation of state of water ice VII from 128 to 300 K. J. Geophys. Res., 98, 11875–11884.',
      doi: '10.1029/93JB00701',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 12.38, T_ref: 300, P_ref: 0, K0: 23.9, K0p: 4.2, alpha: 2.5e-5 },
    },
    {
      id: 'vii_h2o_hemley1987',
      citation: 'Hemley et al. (1987)',
      fullRef: 'Hemley, R.J. et al. (1987). Static compression of H₂O-ice to 128 GPa. Nature, 330, 737–740.',
      doi: '10.1038/330737a0',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 12.49, T_ref: 300, P_ref: 0, K0: 22.6, K0p: 4.3, alpha: 2.5e-5 },
    },
    {
      id: 'vii_h2o_sugimura2008',
      citation: 'Sugimura et al. (2008)',
      fullRef: 'Sugimura, E. et al. (2008). Compression of H₂O ice to 126 GPa and implications for hydrogen-bond symmetrization. Phys. Rev. B, 77, 214103.',
      doi: '10.1103/PhysRevB.77.214103',
      eosType: 'BM3',
      molecule: 'H2O',
      params: { V0: 12.50, T_ref: 300, P_ref: 0, K0: 21.5, K0p: 4.5, alpha: 2.5e-5 },
    },
    {
      id: 'vii_d2o_klotz2017_bm3',
      citation: 'Klotz et al. (2017) BM3',
      fullRef: 'Klotz, S. et al. (2017). Equation of state of D₂O ice VII at 298 K. Phys. Rev. B, 95, 174111.',
      doi: '10.1103/PhysRevB.95.174111',
      eosType: 'BM3',
      molecule: 'D2O',
      isothermal: true,
      // V0 = 42.25 Å³ (as reported), converted: 42.25 / (2 × 1.66054) = 12.722 cm³/mol
      params: { V0: 12.722, V0_reported: 42.25, V0_unit: 'cell', T_ref: 298, P_ref: 0, K0: 13.8, K0p: 5.9, alpha: 0 },
      notes: 'Table III, BM3 fit. V₀ = 42.25 Å³ imposed at 298 K.',
    },
    {
      id: 'vii_d2o_klotz2017_vinet',
      citation: 'Klotz et al. (2017) Vinet',
      fullRef: 'Klotz, S. et al. (2017). Equation of state of D₂O ice VII at 298 K. Phys. Rev. B, 95, 174111.',
      eosType: 'Vinet',
      molecule: 'D2O',
      isothermal: true,
      params: { V0: 12.722, V0_reported: 42.25, V0_unit: 'cell', T_ref: 298, P_ref: 0, K0: 13.6, K0p: 6.2, alpha: 0 },
      notes: 'Table III, Vinet (Rydberg-Vinet) fit. V₀ = 42.25 Å³ imposed at 298 K.',
    },
  ],
};
