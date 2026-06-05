"""
Vercel Python Serverless Function — SeaFreeze EoS calculator.
Served at /api/seafreeze on Vercel, overriding the local-dev Next.js route handler.

Local development: set SEAFREEZE_PYTHON in .env.local and use `npm run dev`.
  The subprocess-based route at app/api/seafreeze/route.ts handles requests locally.
Vercel production: this file handles all /api/seafreeze POST requests.
"""
from http.server import BaseHTTPRequestHandler
import json, sys, io, warnings
import numpy as np

warnings.filterwarnings('ignore')


# ---------- SeaFreeze helpers ------------------------------------------------

def _get_rho(T_K: float, P_MPa: float, phase: str) -> float:
    """Density in kg/m³ at (T_K, P_MPa) for the given SeaFreeze phase."""
    import seafreeze.seafreeze as sf

    PTm = np.empty((1,), dtype=object)
    PTm[0] = (P_MPa, T_K)

    # Suppress SeaFreeze's informational stdout messages
    _buf = io.StringIO()
    _real_stdout, sys.stdout = sys.stdout, _buf
    try:
        out = sf.getProp(PTm, phase)
    finally:
        sys.stdout = _real_stdout

    rho = float(np.squeeze(out.rho))
    if rho != rho:  # NaN check
        raise ValueError(
            f'SeaFreeze returned NaN (P={P_MPa:.1f} MPa, T={T_K:.1f} K, phase={phase})'
        )
    return rho


# Valid P search ranges (MPa) for bisection in TVtoP mode
_P_RANGES: dict[str, tuple[float, float]] = {
    'II':  (200.0,  450.0),
    'III': (250.0,  450.0),
    'V':   (400.0,  620.0),
    'VI':  (600.0, 2300.0),
}


def _compute(req: dict) -> dict:
    mode  = req['mode']
    T_K   = float(req['T_K'])
    phase = req['phase']

    if mode == 'TPtoV':
        rho = _get_rho(T_K, float(req['P_GPa']) * 1000.0, phase)
        return {'rho_kgm3': rho, 'status': 'ok'}

    if mode == 'TVtoP':
        from scipy.optimize import brentq

        rho_target   = float(req['rho_kgm3'])
        P_lo, P_hi   = _P_RANGES.get(phase, (1.0, 2300.0))

        def f(P_MPa: float) -> float:
            return _get_rho(T_K, P_MPa, phase) - rho_target

        f_lo, f_hi = f(P_lo), f(P_hi)
        if f_lo > 0:
            raise ValueError(
                f'Volume too large — P would be below {P_lo / 1000:.2f} GPa for ice {phase}'
            )
        if f_hi < 0:
            raise ValueError(
                f'Volume too small — P would be above {P_hi / 1000:.2f} GPa for ice {phase}'
            )
        P_sol = brentq(f, P_lo, P_hi, xtol=0.1, rtol=1e-6, maxiter=200)
        return {'P_GPa': P_sol / 1000.0, 'status': 'ok'}

    return {'status': 'error', 'message': f'Unknown mode: {mode!r}'}


# ---------- Vercel HTTP handler ----------------------------------------------

class handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # Suppress access log noise in Vercel function logs

    def do_GET(self):
        """Diagnostic endpoint: GET /api/seafreeze returns import/file status."""
        import os, importlib
        report = {}
        for pkg in ('seafreeze', 'scipy', 'numpy', 'h5py', 'hdf5storage'):
            try:
                m = importlib.import_module(pkg)
                report[pkg] = getattr(m, '__version__', 'imported (no version)')
            except Exception as exc:
                report[pkg] = f'ERROR: {exc}'
        # Check that the .mat data file exists inside the installed package
        try:
            import seafreeze.seafreeze as sf
            mat_path = sf.defpath
            report['mat_file'] = mat_path
            report['mat_exists'] = os.path.isfile(mat_path)
        except Exception as exc:
            report['mat_file'] = f'ERROR: {exc}'
        # Quick smoke test
        try:
            _PTm = np.empty((1,), dtype=object)
            _PTm[0] = (350.0, 250.0)
            _buf = io.StringIO()
            _real, sys.stdout = sys.stdout, _buf
            try:
                import seafreeze.seafreeze as sf2
                _out = sf2.getProp(_PTm, 'II')
                report['smoke_test'] = f"ice II rho={float(np.squeeze(_out.rho)):.2f} kg/m³ at 350 MPa, 250 K"
            finally:
                sys.stdout = _real
        except Exception as exc:
            report['smoke_test'] = f'ERROR: {exc}'
        body = json.dumps(report, indent=2).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        req    = json.loads(self.rfile.read(length))
        try:
            result = _compute(req)
        except Exception as exc:
            result = {'status': 'error', 'message': str(exc)}

        body = json.dumps(result).encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
