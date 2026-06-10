# Water Ice EoS Dictionary

A web application for calculating equations of state (EoS) of water ice polymorphs. Select a polymorph and molecule, choose a literature reference, and get volume/density at given T and P instantly.

Hosted on Vercel. Built with Next.js + TypeScript.

Edited by Hiroki Kobayashi (GcRC, UTokyo) · hiroki@eqchem.s.u-tokyo.ac.jp

## EoS database

### Ice Ih

| Molecule | Reference | EoS type |
|---|---|---|
| H₂O | Feistel & Wagner (2006) | BM3 |
| H₂O | Röttger et al. (1994) | BM3 |
| H₂O | Fortes (2018) | FortesPowerExp |
| D₂O | Röttger et al. (1994) | BM3 |
| D₂O | Fortes (2018) | FortesPowerExp |

### Ice II

| Molecule | Reference | EoS type |
|---|---|---|
| H₂O | Journaux et al. (2020) | SeaFreeze |
| D₂O | Fortes et al. (2006) | BM3 |

### Ice III

| Molecule | Reference | EoS type |
|---|---|---|
| H₂O | Journaux et al. (2020) | SeaFreeze |

### Ice V

| Molecule | Reference | EoS type |
|---|---|---|
| H₂O | Journaux et al. (2020) | SeaFreeze |
| H₂O | Fortes et al. (2014) | BM3 |

### Ice VI

| Molecule | Reference | EoS type |
|---|---|---|
| H₂O | Journaux et al. (2020) | SeaFreeze |
| H₂O | Bezacier et al. (2014) | BM3 |
| H₂O | Fortes et al. (2012) | BM3 |
| D₂O | Fortes et al. (2012) | Murnaghan |

### Ice VII

| Molecule | Reference | EoS type | Notes |
|---|---|---|---|
| H₂O | Bezacier et al. (2014) | BM3 | PVT, 300–450 K |
| H₂O | Fei et al. (1993) | BM3 | |
| H₂O | Frank et al. (2004) | BM3 | 300 K |
| H₂O | Grande et al. (2022) | Vinet | 2.7–5.1 GPa, RT |
| H₂O | Grande et al. (2022) | Vinet | 5.1–30.9 GPa, RT |
| H₂O | Grande et al. (2022) | Vinet | 30.9–60 GPa, RT |
| H₂O | Hemley et al. (1987) | BM3 | 300 K |
| H₂O | Lai et al. (2022) | BM3Thermal | 300–1000 K |
| H₂O | Lai et al. (2022) | BM3 | 300 K |
| H₂O | Lai et al. (2022) | Vinet | 300 K |
| H₂O | Loubeyre et al. (1999) | Vinet | 300 K |
| H₂O | Somayazulu et al. (2008) | Vinet | 300 K |
| H₂O | Sugimura et al. (2008) | Vinet | 300 K |
| H₂O | Sugimura et al. (2010) | VinetAG | PVT |
| H₂O | Wolanin et al. (1997) | BM3 | 300 K |
| H₂O | Wolanin et al. (1997) | Vinet | 300 K |
| D₂O | Klotz et al. (2017) | BM3 | 298 K |
| D₂O | Klotz et al. (2017) | Vinet | 298 K |

### Ice VIII

| Molecule | Reference | EoS type | Notes |
|---|---|---|---|
| H₂O | Fukui et al. (2022) | BM3 | 10 K |
| H₂O | Fukui et al. (2022) | BM3 | 120 K |
| H₂O | Fukui et al. (2022) | BM3 | 300 K |
| H₂O | Fukui et al. (2022) | BM3 | Room T |
| D₂O | Klotz et al. (2017) | BM3 | 93 K |
| D₂O | Klotz et al. (2017) | Vinet | 93 K |
| D₂O | Klotz et al. (2017) | AP1 | 93 K |
| D₂O | Klotz et al. (2017) | BM3 | 196 K |
| D₂O | Klotz et al. (2017) | Vinet | 196 K |
| D₂O | Klotz et al. (2017) | AP1 | 196 K |

### Ice X

| Molecule | Reference | EoS type | Notes |
|---|---|---|---|
| H₂O | Sugimura et al. (2008) | Vinet | 300 K, >63 GPa |

## Development

```bash
npm run dev   # starts Next.js with --webpack (required for vanilla-extract)
```

Open [http://localhost:3000](http://localhost:3000).
