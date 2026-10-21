// Etapa 1 do pipeline: abre export.html (servidor de desenvolvimento rodando) e salva a cena em código
// como pipeline/.cache/source.glb, junto com um resumo de quantas malhas há por grupo e área.
//   node pipeline/export/exportar.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.env.URL || 'http://localhost:5173/export.html';
const out = 'pipeline/.cache/source.glb';

async function launch() {
    if (process.platform === 'win32') {
        const { chromium } = await import('playwright-core');
        return chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
    }
    const { chromium } = await import('playwright');
    return chromium.launch({
        args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
    });
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));

await page.goto(url, { waitUntil: 'load' });
await page.waitForFunction(() => window.__exportReady === true, null, { timeout: 120000 });
const base64 = await page.evaluate(() => window.__exportGLB());
await browser.close();

const glb = Buffer.from(base64, 'base64');
mkdirSync('pipeline/.cache', { recursive: true });
writeFileSync(out, glb);

// Resumo lido do próprio GLB (o JSON fica no primeiro pedaço do arquivo)
const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
const nodes = json.nodes || [];
const tally = {};
const parentOf = new Map();
nodes.forEach((n, i) => (n.children || []).forEach((c) => parentOf.set(c, i)));
const nearest = (i, key) => {
    for (let p = i; p !== undefined; p = parentOf.get(p)) {
        const v = nodes[p].extras?.bake?.[key];
        if (v) return v;
    }
    return '-';
};
nodes.forEach((n, i) => {
    if (n.mesh === undefined) return;
    const k = `${nearest(i, 'group')}/${nearest(i, 'area')}`;
    tally[k] = (tally[k] || 0) + 1;
});
console.log(`GLB: ${(glb.length / 1024).toFixed(0)} KB, ${json.meshes?.length ?? 0} malhas, ${json.images?.length ?? 0} imagens`);
console.log('Malhas por grupo/área:', tally);
if (errors.length) console.log('Erros na página:\n  ' + errors.join('\n  '));
console.log('ok', out);
