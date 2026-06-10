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
        from seafreeze.rho2P import rho2P

        rho_target = float(req['rho_kgm3'])
        try:
            P_MPa = float(rho2P(rho_target, T_K, phase))
            if P_MPa != P_MPa:  # NaN
                P_lo, P_hi = _P_RANGES.get(phase, (1.0, 2300.0))
                raise ValueError(
                    f'No solution: density {rho_target:.2f} kg/m³ is outside the valid range '
                    f'for ice {phase} at {T_K:.1f} K '
                    f'({P_lo / 1000:.2f}–{P_hi / 1000:.2f} GPa)'
                )
            result = {'P_GPa': P_MPa / 1000.0, 'status': 'ok'}
        except Exception as exc:
            result = {'status': 'error', 'message': str(exc)}

    else:
        result = {'status': 'error', 'message': f'Unknown mode: {mode!r}'}

    sys.stdout = _real_stdout
    print(json.dumps(result))


if __name__ == '__main__':
    main()
