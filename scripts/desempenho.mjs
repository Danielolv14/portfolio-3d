// Mede o quarto 3D: tempo até a cena aparecer, draw calls, triângulos, sombras e FPS.
// Roda no computador (1440x900) e num celular simulado (390x844 com CPU 4x mais lenta).
// Precisa do servidor rodando (npm run dev) e do Playwright (veja scripts/captura.mjs).
//   node scripts/desempenho.mjs
//   URL=http://localhost:4173/ node scripts/desempenho.mjs   (build de produção com npm run preview)
// O campo `frame` usa window.__stats() (Scene.jsx, só em desenvolvimento): draw calls do quadro inteiro.
const url = process.env.URL || 'http://localhost:5173/';

async function launch() {
    if (process.platform === 'win32') {
        const { chromium } = await import('playwright-core');
        return chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
    }
    const { chromium } = await import('playwright');
    return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

const browser = await launch();

async function run(label, opts, throttle) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    // Pega a cena pelo gancho de devtools que o three avisa ao criar renderer e cenas
    await page.addInitScript(() => {
        window.__seen = { scenes: [] };
        const hook = new EventTarget();
        hook.addEventListener('observe', (e) => {
            if (e.detail?.isScene) window.__seen.scenes.push(e.detail);
        });
        window.__THREE_DEVTOOLS__ = hook;
    });
    if (throttle) {
        const cdp = await ctx.newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    }
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('.hint', { timeout: 120000 });
    const readyMs = Date.now() - t0;
    await page.waitForTimeout(3000);
    const stats = await page.evaluate(async () => {
        const count = (s) => {
            let n = 0;
            s.traverse(() => n++);
            return n;
        };
        const scene = window.__seen.scenes.reduce((a, b) => (count(b) > count(a) ? b : a));
        let meshes = 0;
        let shadowCasters = 0;
        let lights = 0;
        let tris = 0;
        scene.traverse((o) => {
            if (o.isLight) lights++;
            if (!o.isMesh) return;
            meshes++;
            if (o.castShadow) shadowCasters++;
            const g = o.geometry;
            tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
        });
        const fps = await new Promise((resolve) => {
            let n = 0;
            const start = performance.now();
            const tick = () => {
                n++;
                if (performance.now() - start < 4000) requestAnimationFrame(tick);
                else resolve(Math.round(n / ((performance.now() - start) / 1000)));
            };
            requestAnimationFrame(tick);
        });
        return { frame: window.__stats?.(), meshes, shadowCasters, lights, sceneTris: Math.round(tris), fps };
    });
    console.log(label, JSON.stringify({ readyMs, ...stats }));
    await ctx.close();
}

await run('computador', { viewport: { width: 1440, height: 900 } }, 0);
await run('celular-cpu4x', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 4);
await browser.close();
