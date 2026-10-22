// Roda o pipeline inteiro: exporta a cena, assa no Blender e copia para public/room.
//   npm run bake                 (bake final, ~25 min)
//   npm run bake -- --preview    (versão rápida, ~7 min; não use para publicar)
// O Cycles do Blender 4.5 às vezes cai sozinho ao preparar as malhas (EXCEPTION_ACCESS_VIOLATION,
// intermitente; ver docs/plano/resultados-poc.md). Por isso o bake é repetido até 3 vezes.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const BLENDER = process.env.BLENDER || 'C:/Program Files/Blender Foundation/Blender 4.5/blender.exe';
const extra = process.argv.slice(2);

function rodar(cmd, args) {
    const r = spawnSync(cmd, args, { stdio: 'inherit' });
    return r.status ?? 1;
}

if (!existsSync(BLENDER)) {
    console.error(`Blender não encontrado em ${BLENDER}. Defina a variável BLENDER com o caminho.`);
    process.exit(1);
}
if (rodar('node', ['pipeline/export/exportar.mjs']) !== 0) process.exit(1);

for (let tentativa = 1; tentativa <= 3; tentativa++) {
    console.log(`\n== bake, tentativa ${tentativa} de 3 ==`);
    // --python-exit-code 1: um erro no script Python também conta como falha (sem isso o Blender sai com 0)
    const status = rodar(BLENDER, [
        '-b',
        '--factory-startup',
        '--python-exit-code',
        '1',
        '--python',
        'pipeline/blender/main.py',
        '--',
        ...extra
    ]);
    if (status === 0) {
        process.exit(rodar('node', ['pipeline/optimize/optimize.mjs']));
    }
    console.log(`O Blender saiu com o código ${status}.`);
}
console.error('O bake falhou 3 vezes seguidas.');
process.exit(1);
