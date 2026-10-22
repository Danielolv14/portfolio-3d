// Baixa do Poly Haven (polyhaven.com, tudo em CC0) as texturas e os modelos listados em
// pipeline/config/bake.json, chave "polyhaven". Só baixa o que ainda não está no cache.
//   node pipeline/polyhaven.mjs
// Texturas: pipeline/.cache/polyhaven/<id>/{diff,nor,rough}.jpg
// Modelos:  pipeline/.cache/polyhaven/<id>/<id>.gltf (+ .bin e texturas)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const cfg = JSON.parse(readFileSync('pipeline/config/bake.json', 'utf8')).polyhaven;
const BASE = 'pipeline/.cache/polyhaven';
const RES = cfg.resolucao || '2k';
const UA = { headers: { 'User-Agent': 'portfolio-3d (github.com/Danielolv14/portfolio-3d)' } };
let total = 0;

async function json(url) {
    const r = await fetch(url, UA);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
}

async function baixar(url, destino) {
    if (existsSync(destino)) return;
    mkdirSync(dirname(destino), { recursive: true });
    const r = await fetch(url, UA);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(destino, buf);
    total += buf.length;
    console.log(`  ${destino} (${Math.round(buf.length / 1024)} KB)`);
}

for (const id of cfg.texturas) {
    const f = await json(`https://api.polyhaven.com/files/${id}`);
    for (const [mapa, nome] of [
        ['Diffuse', 'diff'],
        ['nor_gl', 'nor'],
        ['Rough', 'rough']
    ]) {
        const item = f[mapa]?.[RES]?.jpg;
        if (item) await baixar(item.url, join(BASE, id, `${nome}.jpg`));
    }
}

for (const id of cfg.modelos) {
    const f = await json(`https://api.polyhaven.com/files/${id}`);
    const g = f.gltf[RES].gltf;
    await baixar(g.url, join(BASE, id, `${id}.gltf`));
    for (const [caminho, item] of Object.entries(g.include)) await baixar(item.url, join(BASE, id, caminho));
}

console.log(`Poly Haven: ${Math.round(total / 1024 / 1024)} MB baixados agora`);
