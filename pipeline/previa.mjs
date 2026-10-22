// Prévia rápida: renderiza o quarto no Blender pelas câmeras do site, sem assar (1–3 min).
//   npm run previa                                  (exporta o código e renderiza a visão geral, dia e noite)
//   npm run previa -- --sem-exportar                (mexeu só nos modelos do Blender: pula a exportação)
//   npm run previa -- --vistas=geral,mesa,cama --rigs=noite --amostras=96
// Saída em pipeline/.cache/previa/ (PNGs e previa-<rig>.blend para abrir no Blender).
// A exportação precisa do servidor de desenvolvimento rodando (npm run dev).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const BLENDER = process.env.BLENDER || 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe';
const args = process.argv.slice(2);
const semExportar = args.includes('--sem-exportar');
const extra = args.filter((a) => a !== '--sem-exportar');

function rodar(cmd, lista) {
    const r = spawnSync(cmd, lista, { stdio: 'inherit' });
    return r.status ?? 1;
}

if (!existsSync(BLENDER)) {
    console.error(`Blender não encontrado em ${BLENDER}. Defina a variável BLENDER com o caminho.`);
    process.exit(1);
}
if (!semExportar && rodar('node', ['pipeline/export/exportar.mjs']) !== 0) process.exit(1);

// O mesmo contorno do bake: o Cycles às vezes cai ao preparar as malhas, então tenta até 3 vezes
for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const status = rodar(BLENDER, [
        '-b',
        '--factory-startup',
        '--python-exit-code',
        '1',
        '--python',
        'pipeline/blender/previa.py',
        '--',
        ...extra
    ]);
    if (status === 0) {
        console.log('\nPrévia pronta em pipeline/.cache/previa/');
        process.exit(0);
    }
    console.log(`O Blender saiu com o código ${status} (tentativa ${tentativa} de 3).`);
}
process.exit(1);
