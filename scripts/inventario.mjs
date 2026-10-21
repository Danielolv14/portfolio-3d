// Inventário do quarto para o pipeline do Blender: conta as malhas por grupo de bake e por tipo,
// e lista as que ficaram sem grupo (nenhuma deveria ficar). Ver o <Bake> em src/room/shared.jsx.
// Precisa do servidor rodando (npm run dev) e do Playwright (veja scripts/captura.mjs).
//   node scripts/inventario.mjs            (resumo)
//   node scripts/inventario.mjs --json     (também grava capturas/inventario.json, malha por malha)
import { mkdirSync, writeFileSync } from 'node:fs';

const url = process.env.URL || 'http://localhost:5173/';
const asJson = process.argv.includes('--json');

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
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
// Pega a cena pelo gancho de devtools que o three avisa ao criar cenas (igual ao desempenho.mjs)
await page.addInitScript(() => {
    window.__seen = { scenes: [] };
    const hook = new EventTarget();
    hook.addEventListener('observe', (e) => {
        if (e.detail?.isScene) window.__seen.scenes.push(e.detail);
    });
    window.__THREE_DEVTOOLS__ = hook;
});
await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector('.hint', { timeout: 120000 });
await page.waitForTimeout(2000);

const result = await page.evaluate(() => {
    const count = (s) => {
        let n = 0;
        s.traverse(() => n++);
        return n;
    };
    const scene = window.__seen.scenes.reduce((a, b) => (count(b) > count(a) ? b : a));

    // Sobe pelos pais até achar o <Bake> mais perto que define cada coisa
    const nearest = (o, key) => {
        for (let p = o; p; p = p.parent) {
            const v = p.userData?.bake?.[key];
            if (v) return { value: v, node: p };
        }
        return null;
    };
    const path = (o) => {
        const parts = [];
        for (let p = o; p && p !== scene; p = p.parent) parts.unshift(p.name || p.type);
        return parts.join(' > ');
    };
    // Tipo pelo material, quando não foi marcado à mão
    const byMaterial = (m) => {
        if (!m) return null;
        if (m.transparent && m.opacity < 1) return 'glass';
        if ((m.emissiveIntensity ?? 0) > 0 && m.emissive && m.emissive.getHex() !== 0) return 'emit';
        if (m.isMeshBasicMaterial && m.toneMapped === false) return 'emit';
        if ((m.metalness ?? 0) >= 0.8) return 'metal';
        return null;
    };

    const meshes = [];
    scene.traverse((o) => {
        if (!o.isMesh) return;
        const mat = Array.isArray(o.material) ? o.material[0] : o.material;
        const group = nearest(o, 'group')?.value ?? null;
        const marked = nearest(o, 'kind');
        let kind = marked?.value ?? null;
        let id = marked?.node.userData.bake.id ?? null;
        if (o.name.startsWith('screen-')) {
            kind = 'screen';
            id = o.name.slice('screen-'.length);
        }
        // Dentro de um hotspot, as peças continuam sendo assadas; o tipo do material só complementa
        const material = byMaterial(mat);
        meshes.push({ path: path(o), group, kind, id, material, visible: o.visible });
    });
    return meshes;
});
await browser.close();

const tally = (key) => result.reduce((acc, m) => ((acc[m[key] ?? '(nenhum)'] = (acc[m[key] ?? '(nenhum)'] || 0) + 1), acc), {});
const skipped = new Set(['skip', 'live']);
const missing = result.filter((m) => !m.group && !skipped.has(m.kind));

console.log(`Malhas: ${result.length}`);
console.log('Por grupo:', tally('group'));
console.log('Por tipo marcado:', tally('kind'));
console.log('Por tipo de material:', tally('material'));
console.log('Hotspots e partes que se mexem:', [...new Set(result.filter((m) => m.id).map((m) => `${m.kind}:${m.id}`))].join(', '));
if (missing.length) {
    console.log(`\nSEM GRUPO (${missing.length}):`);
    missing.slice(0, 40).forEach((m) => console.log('  ' + m.path));
} else {
    console.log('\nTodas as malhas têm grupo de bake. ✔');
}
if (asJson) {
    mkdirSync('capturas', { recursive: true });
    writeFileSync('capturas/inventario.json', JSON.stringify(result, null, 2));
    console.log('Gravado em capturas/inventario.json');
}
process.exit(missing.length ? 1 : 0);
