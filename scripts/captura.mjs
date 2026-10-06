// Tira capturas do quarto 3D para comparar com as fotos de referência (só em desenvolvimento).
// Precisa do servidor rodando (npm run dev) e do Playwright:
//   Windows (usa o Edge instalado): npm i -D playwright-core
//   Linux/nuvem (Chromium sem GPU):  npm i -D playwright && npx playwright install chromium
//
// Uso:
//   node scripts/captura.mjs <saida.jpg> [day|night] ["x,y,z da câmera" "x,y,z do alvo"] [--secao=Projetos] [--celular]
// Exemplos:
//   node scripts/captura.mjs capturas/geral.jpg night
//   node scripts/captura.mjs capturas/mesa.jpg day "-0.5,4.5,-1.2" "-4.35,2.45,-2.85"
//   node scripts/captura.mjs capturas/sobre.jpg day --secao="Sobre mim"
// Com câmera e alvo, usa o gancho window.__view (Scene.jsx) e esconde etiquetas e menus.
const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [out, mode = 'day', posArg, targetArg] = args.filter((a) => !a.startsWith('--'));
if (!out) {
    console.error('uso: node scripts/captura.mjs saida.jpg [day|night] ["x,y,z" "x,y,z"] [--secao=Nome] [--celular]');
    process.exit(1);
}
const url = process.env.CAPTURA_URL || 'http://localhost:5173/';
const parse = (s) => s.split(',').map(Number);

// No Windows usa o Edge com GPU; no Linux, o Chromium do Playwright com WebGL por software
async function launch() {
    if (process.platform === 'win32') {
        const { chromium } = await import('playwright-core');
        return chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
    }
    const { chromium } = await import('playwright');
    return chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
}

const browser = await launch();
const viewport = 'celular' in flags ? { width: 390, height: 844 } : { width: 1280, height: 800 };
const page = await browser.newPage({
    viewport,
    deviceScaleFactor: 'celular' in flags ? 2 : 1,
    isMobile: 'celular' in flags,
    hasTouch: 'celular' in flags,
    colorScheme: mode === 'night' ? 'dark' : 'light',
    reducedMotion: 'reduce'
});
const errors = [];
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300));
});

await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector('.hint', { timeout: 60000 }).catch(() => errors.push('a cena não terminou de carregar'));
await page.waitForTimeout(2500);

if (flags.secao) {
    const menu = 'celular' in flags ? '.tabbar' : '.nav';
    await page.click(`${menu} >> text=${flags.secao}`);
} else if (posArg && targetArg) {
    await page.addStyleTag({ content: '.tag, .topbar, .hint, .tabbar { display: none !important; }' });
    await page.evaluate(([p, t]) => window.__view && window.__view(p, t), [parse(posArg), parse(targetArg)]);
}
await page.waitForTimeout(2500);
await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
await browser.close();

console.log(errors.length ? errors.join('\n') : 'sem erros');
console.log('ok', out);
