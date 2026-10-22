// Converte os modelos de terceiros (art/terceiros/<pasta>/) para modelo.glb, no Blender.
//   npm run terceiros                  (só os que ainda não têm modelo.glb)
//   npm run terceiros -- --forcar      (todos de novo)
//   npm run terceiros -- --so=xdj,ps5  (só esses)
import { spawnSync } from 'node:child_process';

const BLENDER = process.env.BLENDER || 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe';
const args = [
    '-b',
    '--factory-startup',
    '--python-exit-code',
    '1',
    '--python',
    'pipeline/blender/converter.py',
    '--',
    ...process.argv.slice(2)
];
const r = spawnSync(BLENDER, args, { stdio: 'inherit' });
process.exit(r.status ?? 1);
