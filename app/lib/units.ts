export type TempUnit = 'K' | 'C';
export type VolumeUnit = 'molar' | 'cell' | 'gcm3' | 'kgm3';

export const TEMP_UNIT_LABELS: Record<TempUnit, string> = { K: 'K', C: '°C' };

export const VOLUME_UNIT_LABELS: Record<VolumeUnit, string> = {
  molar: 'cm³/mol',
  cell:  'Å³',
  gcm3:  'g/cm³',
  kgm3:  'kg/m³',
};

export const VOLUME_UNITS: VolumeUnit[] = ['molar', 'cell', 'gcm3', 'kgm3'];

// N_A = 6.02214076 × 10²³ mol⁻¹; 1 cm³ = 10²⁴ Å³
// V_cell [Å³] = V_molar [cm³/mol] × Z × (10²⁴ / N_A)
const CM3_MOL_TO_A3 = 1e24 / 6.02214076e23; // ≈ 1.66054 Å³·mol / (cm³ · formula unit)

export function toKelvin(T: number, unit: TempUnit): number {
  return unit === 'C' ? T + 273.15 : T;
}

export function fromKelvin(T_K: number, unit: TempUnit): number {
  return unit === 'C' ? T_K - 273.15 : T_K;
}

// Convert an arbitrary volume/density value → molar volume (cm³/mol)
export function toMolar(value: number, unit: VolumeUnit, Z: number, M: number): number {
  switch (unit) {
    case 'molar': return value;
    case 'cell':  return value / (Z * CM3_MOL_TO_A3);
    case 'gcm3':  return M / value;
    case 'kgm3':  return (M * 1000) / value; // ρ[kg/m³] = M[g/mol]*1000 / V[cm³/mol]
  }
}

// Convert molar volume (cm³/mol) → arbitrary unit
export function fromMolar(vMolar: number, unit: VolumeUnit, Z: number, M: number): number {
  switch (unit) {
    case 'molar': return vMolar;
    case 'cell':  return vMolar * Z * CM3_MOL_TO_A3;
    case 'gcm3':  return M / vMolar;
    case 'kgm3':  return (M * 1000) / vMolar;
  }
}

// Decimal places for display per unit
export const VOLUME_UNIT_DECIMALS: Record<VolumeUnit, number> = {
  molar: 4,
  cell:  2,
  gcm3:  4,
  kgm3:  1,
};
