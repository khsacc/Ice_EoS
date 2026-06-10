@AGENTS.md

# Ice EoS — Project Context for Claude

## What this project is

A Next.js (TypeScript) web application that calculates equations of state (EoS) for ice polymorphs. Hosted on Vercel. Allows users to:
- Select an ice polymorph (Ih, II, III, V, VI, VII, VIII, X) and molecule (H₂O / D₂O) from a sidebar
- Choose a literature reference for the EoS
- Switch between two tabs: **T, P → V** and **T, V → P**
- Get instant results in four volume/density units simultaneously

## Tech stack

| Tool | Notes |
|---|---|
| Next.js 16.2.7, App Router | **must use `--webpack`** (not Turbopack) — vanilla-extract's Next.js plugin is webpack-only |
| TypeScript | strict |
| vanilla-extract | CSS-in-TS at compile time (`.css.ts` files, `style()`, `styleVariants()`) |
| Node.js 22.13.0 | set via `nodenv local 22.13.0` |

### Critical: always use `--webpack`

```json
// package.json
"dev":   "next dev --webpack",
"build": "next build --webpack"
```

Without `--webpack`, vanilla-extract throws a runtime error:  
`"Styles were unable to be assigned to a file"` — this is a Turbopack incompatibility, NOT a code bug.

## File structure (key files)

```
app/
  page.tsx                  Server component — renders <App />; exports page metadata
  page.css.ts               App-level layout styles (vanilla-extract)
  globals.css               Global reset
  layout.tsx                Root layout; exports site-wide Metadata (metadataBase, OG, Twitter)
  sitemap.ts                Generates /sitemap.xml (Next.js App Router convention)
  robots.ts                 Generates /robots.txt (Next.js App Router convention)
  api/
    seafreeze/
      route.ts              Local-dev API route — spawns Python subprocess
                            On Vercel this path is overridden by api/seafreeze.py
  components/
    App.tsx                 Client root — molecule + polymorph state
    Header.tsx              Sticky header; accepts navLink prop to swap the nav link
    Footer.tsx / .css.ts    Sitewide footer with Calculator + Reference List links
    Sidebar.tsx / .css.ts   H₂O / D₂O sections, polymorph buttons (hides phases with no entries)
    EosCalculator.tsx       Tab switcher
    TabTPtoV.tsx            T,P→V tab (instant calc via useEffect)
    TabTVtoP.tsx            T,V→P tab (instant calc via useEffect)
    LiteratureSelect.tsx    Reference dropdown
    Tab.css.ts              Shared tab styles
  lib/
    literature.ts           EoS data (LITERATURE record), polymorph constants, LiteratureEntry types
    paramUnits.ts           ReportedEoSParameters → EoSParameters conversion; unit type definitions
    eos.ts                  BM3, Vinet, AP1 EoS functions + bisection solver
    units.ts                Unit conversion (K/°C, cm³/mol/Å³/g·cm⁻³/kg·m⁻³)
  references/
    page.tsx                Reference list page (Server Component; uses Header + Footer)
    page.css.ts
api/
  seafreeze.py              Vercel Python serverless function (production)
scripts/
  seafreeze_worker.py       Python worker for local-dev subprocess
vercel.json                 Vercel build config + Python function runtime
requirements.txt            Python deps for Vercel (seafreeze, scipy, numpy)
.env.local                  SEAFREEZE_PYTHON=/Users/hiroki/anaconda3/bin/python
```

## EoS implementations (app/lib/eos.ts)

All functions take `(T_K, V_molar_cm3mol, params, eosType)`.

- **BM3** (3rd-order Birch-Murnaghan):  
  `P = (3K₀/2)(x^7/3 − x^5/3)(1 + 3/4(K₀′−4)(x^2/3−1))`, x = V₀/V
- **Vinet** (Rydberg-Vinet):  
  `P = (3B₀/X²)(1−X)exp[(3/2)(B₀′−1)(1−X)]`, X = (V/V₀)^(1/3)
- **AP1** (Holzapfel):  
  `P = (3B₀/X⁵)(1−X)exp[(3/2)(B₀′−3)(1−X)]`, X = (V/V₀)^(1/3)
- **SeaFreeze**: computed via `/api/seafreeze` (Python — see below)

Thermal expansion: `V₀(T) = V₀ × (1 + α(T − T_ref))`.  
Set `alpha: 0` and `isothermal: true` for isothermal EoS (T input disabled, shows "298 K (fixed)").

T,P→V uses **bisection** (300 iterations, relative tolerance 1e-12).

## SeaFreeze integration (Journaux et al. 2020)

SeaFreeze computes thermodynamic properties from Gibbs energy LBF (tensor b-splines) for H₂O ice II, III, V, VI.

### Architecture

```
Frontend (fetch)
  ↓ POST /api/seafreeze  {mode, T_K, P_GPa|rho_kgm3, phase}
  ↓
[Vercel] api/seafreeze.py   ← Python serverless function
[Local]  app/api/seafreeze/route.ts  → subprocess → scripts/seafreeze_worker.py
  ↓
JSON response  {status, rho_kgm3 | P_GPa}
```

- **Local dev**: `SEAFREEZE_PYTHON=/Users/hiroki/anaconda3/bin/python` in `.env.local`
- **Vercel**: `api/seafreeze.py` (Python serverless function) takes routing priority over the Next.js route handler because Vercel serves custom `api/` functions before framework routes
- **vercel.json**: do NOT add a `functions` key — Vercel auto-detects `api/*.py` when `requirements.txt` exists. Explicit `"runtime": "@vercel/python@4"` causes a build error ("must have a valid version")
- **SeaFreeze Python package** is at `/Users/hiroki/anaconda3/lib/python3.11/site-packages/seafreeze/`
- The `.mat` spline data file is bundled inside the seafreeze package: `SeaFreeze_Gibbs_VII_NaCl.mat`

### Unit conversion (SeaFreeze ↔ app)

SeaFreeze returns `rho` in kg/m³. Convert to molar volume:
```
V_molar [cm³/mol] = M [g/mol] × 1000 / ρ [kg/m³]
```
H₂O: `V = 18015 / ρ`.  Inverse: `ρ = M × 1000 / V_molar`.

SeaFreeze pressure is in **MPa**; the app uses **GPa**. Multiply/divide by 1000.

### Valid ranges (phase → P in MPa for bisection)

| Phase | P range |
|---|---|
| II  | 200–450 MPa |
| III | 250–450 MPa |
| V   | 400–620 MPa |
| VI  | 600–2300 MPa |

## Literature data (app/lib/literature.ts + app/lib/paramUnits.ts)

`LITERATURE` is a `Record<IcePolymorph, LiteratureEntry[]>`.

### Two-layer parameter design

Parameters are stored in two forms:

**`ReportedEoSParameters`** (in `paramUnits.ts`) — stored in `literature.ts` exactly as printed in the source paper. Each field is `{ value: string, unit: '...' }`. The `value` string accepts parenthetical last-digit uncertainty notation (e.g. `"42.25(2)"` → 42.25).

**`EoSParameters`** (in `paramUnits.ts`) — computation-ready, all canonical units (GPa, cm³/mol, K, K⁻¹). Obtained at runtime via `resolveParams(rp, Z, M)`, which strips uncertainty, converts units, and applies Z/M for cell-volume → molar-volume conversion.

```typescript
// paramUnits.ts — stored in literature entries
interface ReportedEoSParameters {
  V0:      { value: string; unit: 'cm3/mol' | 'A3/cell' | 'g/cm3' | 'kg/m3' };
  K0:      { value: string; unit: 'GPa' | 'MPa' | 'kbar' };
  K0p:     { value: string; unit: '1' };
  T_ref:   { value: string; unit: 'K' | 'C' };
  P_ref:   { value: string; unit: 'GPa' | 'MPa' | 'kbar' };
  alpha?:  { value: string; unit: 'K-1' | '10-5/K' | '10-6/K' };   // omit for isothermal
  alpha1?: { value: string; unit: 'K-2' | '10-6/K2' | '10-8/K2' }; // BM3Thermal only
  dKdT?:   { value: string; unit: 'GPa/K' | 'MPa/K' };             // BM3Thermal only
  deltaT?: { value: string; unit: '1' };                            // VinetAG only
}

// paramUnits.ts — resolved at runtime for computation
interface EoSParameters {
  V0: number;      // cm³/mol
  T_ref: number;   // K
  P_ref: number;   // GPa
  K0: number;      // GPa
  K0p: number;     // dimensionless
  alpha: number;   // K⁻¹ (0 when no alpha field in reported params)
  alpha1?: number; // K⁻² (BM3Thermal)
  dKdT?: number;   // GPa/K (BM3Thermal)
  deltaT?: number; // dimensionless (VinetAG)
}
```

### Specialty parameter types (not EoS-pressure entries)

```typescript
// FortesPowerExp: α(T) = p·T^(q/T) + r·exp(s/T), V(T) = V₀·exp(∫α dT), P = 0 only
interface FortesPowerExpParams {
  V0: number;      // cm³/mol (fitted T=0 parameter)
  V0_cell: number; // Å³ (as reported)
  p: number; q: number; r: number; s: number; // see eos.ts
}

// RottgerPolynomial: V_cell(T) = Σ A[i]·T^i  (polynomial, P = 0 only)
interface RottgerPolynomialParams {
  A: [number×9]; // A0..A8 in Å³/K^i
  Z: number;     // formula units per unit cell
}

// Murnaghan PVT (Fortes et al. 2012 form)
// V(P,T) = V_ref(T) / [P*(K'/K(T))+1]^(1/K')
interface MurnaghanParams {
  V_ref: number; X1: number; X2: number; // cm³/mol, cm³/mol/K, cm³/mol/K²
  K_ref: number; dKdT: number; Kp: number; // GPa, GPa/K, dimensionless
  P_ref: number; T_ref: number;            // GPa, K
}

// BM3FrankPVT: BM3 isothermal + thermal expansion pressure correction (Frank et al. 2004)
// V(P,T) = V_BM3(P,T_ref) × exp{[a₀ΔT + (a₁/2)(T²−T_ref²)] / (1 + (K0p/K0)·P)^eta}
interface FrankPVTParams {
  V0: number; K0: number; K0p: number; T_ref: number; // cm³/mol, GPa, dim., K
  a0: number; a1: number; eta: number;                // K⁻¹, K⁻², dim.
  P_min: number; P_max: number;                       // GPa bisection bounds
}

// FeistelWagner: no params — uses built-in IAPWS-2006 Gibbs coefficients (H₂O ice Ih only)
```

### LiteratureEntry

```typescript
interface LiteratureEntry {
  id: string;
  citation: string;   // short label for dropdowns (e.g. "Klotz et al. (2017) BM3")
  fullRef: string;    // full bibliographic string for Reference List page
  doi?: string;       // DOI without "https://doi.org/" prefix
  eosType: EoSType;
  molecule: 'H2O' | 'D2O';
  params?: ReportedEoSParameters;           // present for BM3/Vinet/AP1/VinetAG/BM3Thermal
  fortesParams?: FortesPowerExpParams;      // present for FortesPowerExp
  murnaghanParams?: MurnaghanParams;        // present for Murnaghan
  rottgerParams?: RottgerPolynomialParams;  // present for RottgerPolynomial
  frankPVTParams?: FrankPVTParams;          // present for BM3FrankPVT
  seafreezePhase?: string;                  // 'II'|'III'|'V'|'VI' for SeaFreeze entries
  isothermal?: boolean;                // true → T input disabled, shows "T K (fixed)"
  notes?: string;                      // shown in UI; include the key formula(s) used
}
```

**`notes` field convention**: Always include the calculation formula(s) relevant to the entry. For EoS pressure entries, write the EoS equation or the form used (e.g. `"BM3: P = (3K₀/2)(x^7/3 − x^5/3)(1 + 3/4(K₀′−4)(x^2/3−1)), x = V₀(T)/V"`). For thermal-expansion-only entries (FortesPowerExp, RottgerPolynomial), write the α(T) and V(T) forms. Keep it concise — one or two formula strings is enough.

See README.md for the full list of EoS entries currently in the database.

**Not in the database (do not add without source)**: Lobban et al. for ice II/III/V; any Klotz 2009 entries.  
**Previously hallucinated and deleted**: `vi_d2o_klotz2009`, `vii_d2o_klotz2009`.  
**Note**: `v_h2o_fortes2014` (ice V H₂O BM3) and `vi_h2o_fortes2012` (ice VI H₂O BM3) ARE in the database with real citations.

## Unit constants

```typescript
POLYMORPH_Z = { Ih:4, II:12, III:12, V:28, VI:10, VII:2, VIII:8 }
MOLAR_MASS  = { H2O: 18.015, D2O: 20.027 }  // g/mol
CM3_MOL_TO_A3 = 1e24 / 6.02214076e23 ≈ 1.66054
```

Cell volume conversion: `V_cell [Å³] = V_molar [cm³/mol] × Z × 1.66054`

## Design system

M3-inspired (Material Design 3). Background `#f8f9fc`, primary `#0061a4`.  
Styles use vanilla-extract; no Tailwind, no CSS modules.  
Only edit `.css.ts` files for style changes — never inline styles.

## Common pitfalls

1. **Do not use Turbopack** — always `--webpack`
2. **SeaFreeze phase names** are `'II'`, `'III'`, `'V'`, `'VI'` (no `'Ice '` prefix)
3. **Pressure units**: app = GPa, SeaFreeze = MPa — multiply by 1000 when calling SeaFreeze
4. **`params` is optional** — SeaFreeze/FortesPowerExp/Murnaghan/RottgerPolynomial/BM3FrankPVT/FeistelWagner entries have `params: undefined`; always guard before accessing
5. **`isothermal: true`** entries omit `alpha` in `ReportedEoSParameters` — `resolveParams` resolves it to `0`; do NOT apply thermal correction
6. **`params` fields are `{ value: string, unit }` not plain numbers** — never read `entry.params.K0` directly; call `resolveParams(entry.params, Z, M)` first to get `EoSParameters`
7. **Parenthetical uncertainty** in `value` strings (e.g. `"14.6(14)"`) is stripped by `parseParamValue()` — central value only is used for computation
8. **Klotz et al. 2017 ice VII D₂O**: V₀ = 42.25 Å³/cell (unit `'A3/cell'`), isothermal 298 K; BM3 K₀=13.8 K₀′=5.9, Vinet K₀=13.6 K₀′=6.2
