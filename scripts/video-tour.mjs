// Grava um tour de ~35 s pelo site em MP4 (para o post do LinkedIn): visão geral, monitor, TV, a troca
// para a noite e o celular. Grava a própria aba (o 3D e o HTML das telas) com o MediaRecorder do Edge,
// então não precisa de ffmpeg. Precisa do servidor rodando (npm run dev) e do playwright-core.
//   node scripts/video-tour.mjs capturas/tour.mp4 [url]
// HEADED=1 abre a janela (se a captura da aba falhar sem ela).
import { chromium } from 'playwright-core';

const [out, url = 'http://localhost:5173/'] = process.argv.slice(2);
const W = 1920;
const H = 1080;
const browser = await chromium.launch({
    channel: 'msedge',
    headless: process.env.HEADED ? false : true,
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--auto-accept-this-tab-capture', `--window-size=${W},${H}`]
});
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, acceptDownloads: true });
await context.addInitScript(() => {
    localStorage.setItem('portfolio-theme', 'day');
    localStorage.setItem('portfolio-lang', 'pt');
});
const page = await context.newPage();
page.on('pageerror', (e) => console.log('erro na página:', e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForSelector('.hint', { timeout: 120000 });
await page.waitForTimeout(1500);

// começa a gravar (precisa de um clique antes: o navegador só deixa capturar a aba depois de uma ação)
await page.mouse.click(W - 5, H / 2);
const tipo = await page.evaluate(async () => {
    const tipos = ['video/mp4;codecs=avc1.640028', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9'];
    const mime = tipos.find((t) => MediaRecorder.isTypeSupported(t));
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: false, preferCurrentTab: true });
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    window.__partes = [];
    rec.ondataavailable = (e) => e.data.size && window.__partes.push(e.data);
    rec.start(500);
    window.__rec = rec;
    window.__mime = mime;
    return mime;
});
console.log('gravando em', tipo);

const espera = (ms) => page.waitForTimeout(ms);
// arrasta devagar para girar um pouco o quarto
async function girar(dx, ms) {
    await page.mouse.move(W * 0.45, H * 0.55);
    await page.mouse.down();
    const passos = Math.round(ms / 16);
    for (let i = 1; i <= passos; i++) {
        await page.mouse.move(W * 0.45 + (dx * i) / passos, H * 0.55);
        await espera(16);
    }
    await page.mouse.up();
}
const menu = (nome) => page.locator('.nav .nav-link', { hasText: nome }).click();

await espera(800);
await girar(-260, 2200);
await espera(500);
await menu('Projetos');
await espera(4200);
await page.mouse.move(W * 0.6, H * 0.55);
await page.mouse.wheel(0, 420);
await espera(1600);
await page.keyboard.press('Escape');
await espera(1600);
await menu('Experiências');
await espera(4300);
await page.keyboard.press('Escape');
await espera(1500);
await page.locator('.tools .tool').nth(1).click(); // dia -> noite
await espera(2600);
await menu('Contato');
await espera(4200);
await page.keyboard.press('Escape');
await espera(1400);
await girar(260, 2400);
await espera(900);

// para e baixa o arquivo
const download = page.waitForEvent('download');
await page.evaluate(async () => {
    await new Promise((resolve) => {
        window.__rec.onstop = resolve;
        window.__rec.stop();
    });
    const blob = new Blob(window.__partes, { type: window.__mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = window.__mime.includes('mp4') ? 'tour.mp4' : 'tour.webm';
    document.body.append(a);
    a.click();
});
await (await download).saveAs(out);
console.log('salvo em', out);
await browser.close();
