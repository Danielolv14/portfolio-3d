// Gera os PNG do README a partir dos SVG de docs/wireframes (rode depois de scripts/wireframes.mjs).
// Precisa do Playwright (veja scripts/captura.mjs).
//   node scripts/wireframes-png.mjs
import { readdirSync, readFileSync } from 'node:fs';

const DIR = 'docs/wireframes';

async function launch() {
    if (process.platform === 'win32') {
        const { chromium } = await import('playwright-core');
        return chromium.launch({ channel: 'msedge' });
    }
    const { chromium } = await import('playwright');
    return chromium.launch();
}

const browser = await launch();
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.svg'))) {
    const svg = readFileSync(`${DIR}/${file}`, 'utf8');
    const [, width, height] = svg.match(/width="(\d+)" height="(\d+)"/);
    const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) } });
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: `${DIR}/${file.replace('.svg', '.png')}` });
    await page.close();
    console.log(`${DIR}/${file.replace('.svg', '.png')}`);
}
await browser.close();
