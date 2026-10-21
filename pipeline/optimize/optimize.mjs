// Etapa 5 do pipeline: copia o GLB (já comprimido com Draco pelo Blender), as texturas e o
// manifest.json para a pasta que o site serve, e mostra o peso de cada arquivo.
//   node pipeline/optimize/optimize.mjs [destino]      (padrão: public/room-poc)
// A compressão das texturas em KTX2 entra aqui quando o KTX-Software estiver instalado
// (docs/plano/02-pipeline-blender.md, seção 8).
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const origem = 'pipeline/.cache/out';
const destino = process.argv[2] || 'public/room-poc';
mkdirSync(destino, { recursive: true });

const manifesto = JSON.parse(readFileSync(join(origem, 'manifest.json'), 'utf8'));
const arquivos = ['manifest.json', manifesto.glb, ...Object.values(manifesto.grupos).flatMap((g) => [g.albedo, g.luz_dia, g.luz_noite])];
let total = 0;
let totalGzip = 0;
for (const f of arquivos) {
    copyFileSync(join(origem, f), join(destino, f));
    const bytes = statSync(join(destino, f)).size;
    // A Vercel comprime o que não é imagem; o GLB chega comprimido (gzip/brotli)
    const enviado = /.(png|webp)$/.test(f) ? bytes : gzipSync(readFileSync(join(destino, f))).length;
    total += bytes;
    totalGzip += enviado;
    console.log(`${f.padEnd(26)} ${String(Math.round(bytes / 1024)).padStart(6)} KB  (enviado ~${Math.round(enviado / 1024)} KB)`);
}
console.log(`${'total'.padEnd(26)} ${String(Math.round(total / 1024)).padStart(6)} KB  (enviado ~${Math.round(totalGzip / 1024)} KB)`);
console.log('ok', destino);
