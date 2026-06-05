import { spawn } from 'child_process';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

function runWorker(pythonPath: string, scriptPath: string, input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, [scriptPath]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr.trim() || `Python exited with code ${code}`));
    });
    proc.on('error', (err) => reject(new Error(`Failed to start Python: ${err.message}`)));
    proc.stdin.write(input);
    proc.stdin.end();
  });
}

export async function POST(req: NextRequest) {
  // On Vercel, api/seafreeze.py (Python serverless function) handles this path
  // and this Next.js handler is never reached due to routing priority.
  // If somehow reached on Vercel, surface a clear error.
  if (process.env.VERCEL) {
    return NextResponse.json(
      { status: 'error', message: 'SeaFreeze route misconfiguration: api/seafreeze.py should handle this on Vercel. Check vercel.json.' },
      { status: 501 }
    );
  }

  const body = await req.json();

  const pythonPath = process.env.SEAFREEZE_PYTHON ?? 'python3';
  const scriptPath = path.join(process.cwd(), 'scripts', 'seafreeze_worker.py');

  try {
    const raw = await runWorker(pythonPath, scriptPath, JSON.stringify(body));
    const data = JSON.parse(raw.trim());
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: 'error', message: msg }, { status: 500 });
  }
}
