@AGENTS.md

# Ice EoS — Project Context for Claude

## What this project is

A Next.js (TypeScript) web application that calculates equations of state (EoS) for ice polymorphs. Hosted on Vercel. Allows users to:
- Select an ice polymorph (Ih, II, III, V, VI, VII, VIII) and molecule (H₂O / D₂O) from a sidebar
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
  page.tsx                  Server component — renders <App />
  page.css.ts               App-level layout styles (vanilla-extract)
  globals.css               Global reset
  api/
    seafreeze/
      route.ts              Local-dev API route — spawns Python subprocess
                            On Vercel this path is overridden by api/seafreeze.py
  components/
    App.tsx                 Client root — molecule + polymorph state
    Header.tsx
    Sidebar.tsx / .css.ts   H₂O / D₂O sections, polymorph buttons
    EosCalculator.tsx       Tab switcher
    TabTPtoV.tsx            T,P→V tab (instant calc via useEffect)
    TabTVtoP.tsx            T,V→P tab (instant calc via useEffect)
    LiteratureSelect.tsx    Reference dropdown
    Tab.css.ts              Shared tab styles
  lib/
    literature.ts           All EoS data, polymorph constants, LITERATURE record
    eos.ts                  BM3, Vinet, AP1 EoS functions + bisection solver
    units.ts                Unit conversion (K/°C, cm³/mol/Å³/g·cm⁻³/kg·m⁻³)
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

## Literature data (app/lib/literature.ts)

`LITERATURE` is a `Record<IcePolymorph, LiteratureEntry[]>`.  

Key types:
```typescript
type EoSType = 'BM3' | 'Vinet' | 'AP1' | 'SeaFreeze';
type IcePolymorph = 'Ih' | 'II' | 'III' | 'V' | 'VI' | 'VII' | 'VIII';

interface EoSParameters {
  V0: number;           // cm³/mol — always this unit for computation
  V0_reported?: number; // as printed in paper (e.g. 42.25 Å³)
  V0_unit?: VolumeUnit; // unit of V0_reported ('cell' | 'gcm3' | 'kgm3')
  T_ref: number;        // K
  P_ref: number;        // GPa
  K0: number;           // GPa
  K0p: number;          // dimensionless
  alpha: number;        // K⁻¹ (0 for isothermal)
}

interface LiteratureEntry {
  id: string;
  eosType: EoSType;
  molecule: 'H2O' | 'D2O';
  params?: EoSParameters;  // undefined for SeaFreeze entries
  seafreezePhase?: string; // 'II' | 'III' | 'V' | 'VI'
  isothermal?: boolean;    // disables T input, shows "298 K (fixed)"
  notes?: string;
}
```

### Real entries (verified against papers) — do NOT hallucinate new ones

- **Ice Ih H₂O**: Feistel & Wagner (2006), Röttger et al. (1994)
- **Ice Ih D₂O**: Röttger et al. (1994)
- **Ice II H₂O**: Journaux et al. (2020) [SeaFreeze], Lobban et al. (2002)
- **Ice II D₂O**: Fortes et al. (2006)
- **Ice III H₂O**: Journaux et al. (2020) [SeaFreeze], Lobban et al. (2000)
- **Ice V H₂O**: Journaux et al. (2020) [SeaFreeze], Lobban et al. (1998), Fortes et al. (2014)
- **Ice VI H₂O**: Journaux et al. (2020) [SeaFreeze], Bezacier et al. (2014), Fortes et al. (2012)
- **Ice VII H₂O**: Fei et al. (1993), Hemley et al. (1987), Sugimura et al. (2008)
- **Ice VII D₂O**: Klotz et al. (2017) BM3 + Vinet — isothermal at 298 K, V₀ = 42.25 Å³

**Previously hallucinated and deleted**: `vi_d2o_klotz2009`, `vii_d2o_klotz2009` — these do not exist.

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
4. **`params` is optional** in `LiteratureEntry` — SeaFreeze entries have `params: undefined`; guard before accessing
5. **`isothermal: true`** entries have `alpha: 0` — do NOT apply thermal correction for these
6. **V₀_reported** and **V₀_unit** are display-only; all EoS computations use `V0` (cm³/mol)
7. **Klotz et al. 2017** is ice VII D₂O at 298 K; Table III gives BM3 (K₀=13.8, K₀′=5.9) and Vinet (K₀=13.6, K₀′=6.2)
