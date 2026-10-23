// Gera a imagem de prévia do link (Open Graph, 1200x630) a partir do quarto de verdade.
// Precisa do servidor rodando (npm run dev) e do playwright-core (no Windows usa o Edge com GPU).
//
// Uso:
//   node scripts/previa-link.mjs public/og.jpg [day|night]
//
// Esconde a interface, empurra o quarto 200 px para a direita e escreve o nome à esquerda.
// Se a imagem mudar, troque o nome do arquivo (e o index.html): LinkedIn e WhatsApp guardam a antiga por dias.
import { chromium } from 'playwright-core';

const [out, mode = 'day'] = process.argv.slice(2);
if (!out) {
    console.error('uso: node scripts/previa-link.mjs saida.jpg [day|night]');
    process.exit(1);
}

const browser = await chromium.launch({ channel: 'msedge', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
// Tema e idioma escolhidos antes de a página abrir (as mesmas chaves do App.jsx)
await context.addInitScript((m) => {
    localStorage.setItem('portfolio-theme', m);
    localStorage.setItem('portfolio-lang', 'pt');
}, mode);
const page = await context.newPage();
await page.goto(process.env.CAPTURA_URL || 'http://localhost:5173/', { waitUntil: 'load' });
// A dica só aparece quando o quarto terminou de carregar
await page.waitForSelector('.hint', { timeout: 90000 });

await page.evaluate(() => {
    const card = document.createElement('div');
    card.className = 'og-card';
    card.innerHTML = `<div class="og-nome">Daniel<br>Oliveira</div>
        <div class="og-cargo">Engenharia de Software · Full Stack</div>
        <div class="og-frase">Um portfólio em forma de quarto 3D</div>
        <div class="og-url">danielolv.dev</div>`;
    document.body.appendChild(card);
    // Usa as cores do site (var(--fg), var(--muted)...), então o texto acompanha o dia e a noite
    const style = document.createElement('style');
    style.textContent = `
        .topbar, .hint, .credits-link, .tabbar, .tag { display: none !important; }
        .stage canvas { transform: translateX(200px); }
        .og-card { position: fixed; left: 64px; top: 50%; transform: translateY(-50%); z-index: 99;
            display: grid; gap: 10px; width: 380px; color: var(--fg); }
        .og-nome { font-family: Unbounded, sans-serif; font-weight: 600; font-size: 54px;
            letter-spacing: -0.02em; line-height: 1.05; margin-bottom: 6px; }
        .og-cargo { font-family: Figtree, sans-serif; font-weight: 600; font-size: 23px; }
        .og-frase { font-family: Figtree, sans-serif; font-weight: 500; font-size: 21px; color: var(--muted); }
        .og-url { justify-self: start; margin-top: 14px; padding: 8px 16px; border-radius: 999px;
            border: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 70%, transparent);
            font-family: 'JetBrains Mono', monospace; font-size: 19px; }`;
    document.head.appendChild(style);
});
// Tempo para a câmera assentar e as fontes carregarem
await page.waitForTimeout(2500);
await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
await browser.close();
console.log('prévia salva em', out);
