#!/usr/bin/env python3
"""SeaFreeze calculation worker.
Reads a JSON request from stdin, writes a JSON response to stdout.
SeaFreeze's informational messages are silenced (redirected to stderr).
"""
import sys, json, warnings, io

warnings.filterwarnings('ignore')

# Redirect stdout → stderr while importing / calling SeaFreeze so that
# lbftd's "NOTE: ..." lines don't pollute the JSON we write at the end.
_real_stdout = sys.stdout
sys.stdout = sys.stderr


def _get_rho(T_K: float, P_MPa: float, phase: str) -> float:
    import seafreeze.seafreeze as sf
    import numpy as np
    PTm = np.empty((1,), dtype=object)
    PTm[0] = (P_MPa, T_K)
    out = sf.getProp(PTm, phase)
    import numpy as np
    rho = float(np.squeeze(out.rho))
    if rho != rho:  # NaN check
        raise ValueError(f'SeaFreeze returned NaN (P={P_MPa} MPa, T={T_K} K, phase={phase})')
    return rho


# Valid P ranges (MPa) for each phase (Journaux et al. 2020 coverage)
_P_RANGES = {
    'II':  (200.0,  450.0),
    'III': (250.0,  450.0),
    'V':   (400.0,  620.0),
    'VI':  (600.0, 2300.0),
}


def main() -> None:
    req = json.loads(sys.stdin.read())
    mode = req['mode']      # 'TPtoV' or 'TVtoP'
    T_K = float(req['T_K'])
    phase = req['phase']    # 'II', 'III', 'V', 'VI'

    if mode == 'TPtoV':
        P_GPa = float(req['P_GPa'])
        P_MPa = P_GPa * 1000.0
        try:
            rho = _get_rho(T_K, P_MPa, phase)
            result = {'rho_kgm3': rho, 'status': 'ok'}
        except Exception as exc:
            result = {'status': 'error', 'message': str(exc)}

    elif mode == 'TVtoP':
        from scipy.optimize import brentq
        rho_target = float(req['rho_kgm3'])
        P_lo, P_hi = _P_RANGES.get(phase, (1.0, 2300.0))

        def f(P_MPa: float) -> float:
            return _get_rho(T_K, P_MPa, phase) - rho_target

        try:
            f_lo = f(P_lo)
            f_hi = f(P_hi)
            if f_lo > 0:
                raise ValueError(
                    f'Volume too large — below minimum pressure ({P_lo / 1000:.2f} GPa) for ice {phase}')
            if f_hi < 0:
                raise ValueError(
                    f'Volume too small — above maximum pressure ({P_hi / 1000:.2f} GPa) for ice {phase}')
            P_sol = brentq(f, P_lo, P_hi, xtol=0.1, rtol=1e-6, maxiter=200)
            result = {'P_GPa': P_sol / 1000.0, 'status': 'ok'}
        except Exception as exc:
            result = {'status': 'error', 'message': str(exc)}

    else:
        result = {'status': 'error', 'message': f'Unknown mode: {mode!r}'}

    sys.stdout = _real_stdout
    print(json.dumps(result))


if __name__ == '__main__':
    main()
