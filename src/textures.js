// Texturas desenhadas em <canvas>: nada de imagem externa, tudo gerado no navegador.
// As cores seguem as fotos do quarto do Daniel.
import * as THREE from 'three';

import { monthLabel } from './content';

function canvasTexture(width, height, draw, { repeat } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    if (repeat) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(...repeat);
    }
    return texture;
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// Gerador pseudoaleatório com semente, para o desenho ser sempre igual
function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// Veios de madeira: faixas finas e onduladas sobre a cor base.
// `bands` acrescenta manchas largas e suaves por baixo dos veios (madeira com mais "desenho").
// `parallel` faz os veios seguirem quase paralelos, como no MDF (uma onda lenta comum + um tremor pequeno).
function woodGrain(ctx, w, h, { base, dark, light, seed, vertical = false, lines = 90, bands = 0, parallel = false }) {
    const rand = seeded(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const len = vertical ? h : w;
    const across = vertical ? w : h;
    for (let i = 0; i < bands; i++) {
        const pos = rand() * across;
        const width = across * (0.03 + rand() * 0.09);
        const amp = 4 + rand() * 14;
        const freq = 0.002 + rand() * 0.004;
        const phase = rand() * 10;
        ctx.strokeStyle = rand() > 0.45 ? dark : light;
        ctx.globalAlpha = 0.08 + rand() * 0.12;
        ctx.lineWidth = width;
        ctx.beginPath();
        for (let t = 0; t <= len; t += 8) {
            const off = pos + Math.sin(t * freq + phase) * amp;
            if (vertical) ctx.lineTo(off, t);
            else ctx.lineTo(t, off);
        }
        ctx.stroke();
    }
    for (let i = 0; i < lines; i++) {
        const pos = rand() * across;
        const amp = 2 + rand() * 6;
        const freq = 0.004 + rand() * 0.01;
        const phase = rand() * 10;
        ctx.strokeStyle = rand() > 0.5 ? dark : light;
        ctx.globalAlpha = 0.18 + rand() * 0.3;
        ctx.lineWidth = 0.6 + rand() * 1.8;
        ctx.beginPath();
        for (let t = 0; t <= len; t += 8) {
            const off = parallel
                ? pos + Math.sin(t * 0.003 + pos * 0.004) * 6 + Math.sin(t * freq + phase) * 1.2
                : pos + Math.sin(t * freq + phase) * amp;
            if (vertical) ctx.lineTo(off, t);
            else ctx.lineTo(t, off);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
}

// Piso de porcelanato creme em placas grandes
export function tilesTexture() {
    return canvasTexture(1024, 1024, (ctx, w, h) => {
        const rand = seeded(5);
        const n = 6;
        const s = w / n;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const tone = 228 + Math.floor(rand() * 8);
                ctx.fillStyle = `rgb(${tone}, ${tone - 6}, ${tone - 17})`;
                ctx.fillRect(i * s, j * s, s, s);
                // leve manchado do porcelanato
                for (let k = 0; k < 40; k++) {
                    ctx.fillStyle = `rgba(190, 175, 155, ${0.03 + rand() * 0.04})`;
                    ctx.beginPath();
                    ctx.ellipse(i * s + rand() * s, j * s + rand() * s, 10 + rand() * 40, 6 + rand() * 20, rand() * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
        ctx.fillStyle = 'rgba(160, 148, 132, 0.55)';
        for (let i = 0; i <= n; i++) {
            ctx.fillRect(i * s - 1.5, 0, 3, h);
            ctx.fillRect(0, i * s - 1.5, w, 3);
        }
    });
}

// Painel de MDF carvalho claro atrás da mesa: bege-acinzentado com veio vertical fino
export function oakTexture() {
    return canvasTexture(512, 1024, (ctx, w, h) =>
        woodGrain(ctx, w, h, { base: '#ccb699', dark: '#a08a6e', light: '#ddcfb8', seed: 21, vertical: true, lines: 220, bands: 4, parallel: true })
    );
}

// Nogueira escura da mesa e do gaveteiro, com veios castanho-claros (veio horizontal)
export function walnutTexture() {
    return canvasTexture(1024, 512, (ctx, w, h) =>
        woodGrain(ctx, w, h, { base: '#5e4636', dark: '#33241b', light: '#806556', seed: 9, lines: 170, bands: 22 })
    );
}

// Reflexo do cromado (panorama 360°): teto claro, paredes bege com a janela, faixa escura dos móveis e o piso.
// O contraste entre as faixas é o que faz o metal parecer cromado.
export function chromeEnvTexture() {
    const texture = canvasTexture(512, 256, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.1, '#f3eee6');
        g.addColorStop(0.2, '#aaa194');
        g.addColorStop(0.36, '#97897a');
        g.addColorStop(0.48, '#7c6e60');
        g.addColorStop(0.5, '#1f1b18');
        g.addColorStop(0.58, '#342e29');
        g.addColorStop(0.62, '#c4bbaf');
        g.addColorStop(1, '#878075');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // janela clara e móveis escuros na altura das paredes
        ctx.fillStyle = '#fff8ec';
        ctx.fillRect(w * 0.12, h * 0.3, w * 0.1, h * 0.14);
        ctx.fillStyle = 'rgba(30, 24, 20, 0.8)';
        [[0.42, 0.06], [0.63, 0.03], [0.82, 0.08]].forEach(([x, width]) => ctx.fillRect(w * x, h * 0.38, w * width, h * 0.14));
    });
    texture.mapping = THREE.EquirectangularReflectionMapping;
    return texture;
}

// Mancha do camuflado: contorno suave e alongado, passando pelos pontos médios.
// `spread` limita a inclinação (menor = manchas mais deitadas); `points` e `wobble` (raio mínimo e variação)
// deixam o contorno mais ou menos recortado.
function camoBlob(ctx, rand, cx, cy, r, { spread = 1.6, points: n = 11, wobble = [0.45, 0.7] } = {}) {
    const stretch = 1.8 + rand() * 1.2;
    const angle = (rand() - 0.5) * spread;
    const pts = [];
    for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const k = r * (wobble[0] + rand() * wobble[1]);
        const x = Math.cos(a) * k * stretch;
        const y = Math.sin(a) * k;
        pts.push([cx + x * Math.cos(angle) - y * Math.sin(angle), cy + x * Math.sin(angle) + y * Math.cos(angle)]);
    }
    const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    ctx.beginPath();
    ctx.moveTo(...mid(pts[n - 1], pts[0]));
    pts.forEach((p, i) => {
        const m = mid(p, pts[(i + 1) % n]);
        ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    });
    ctx.fill();
}

// Camuflado cinza da frente do gabinete (ou marrom-verde, para a JBL).
// Com `mesh`, desenha por cima as fendas verticais da tela perfurada do gabinete.
export function camoTexture(palette = ['#d0d0cc', '#838486', '#424347', '#1a1b1e'], seed = 4, mesh = true) {
    const [width, height] = mesh ? [384, 1024] : [256, 512];
    return canvasTexture(width, height, (ctx, w, h) => {
        const rand = seeded(seed);
        ctx.fillStyle = palette[0];
        ctx.fillRect(0, 0, w, h);
        // quantas manchas de cada cor, por "quadrado" da textura (a última camada é a mais escura).
        // O gabinete é camuflado urbano: poucas manchas grandes e fluidas; a JBL tem manchas miúdas.
        const density = mesh ? [5, 4, 2] : [5.5, 4, 7];
        // raio mínimo e variação (em larguras da textura) e o formato das manchas
        const [r0, dr, shape] = mesh ? [0.08, 0.12, { spread: 0.7, points: 16, wobble: [0.3, 1.0] }] : [0.05, 0.09, undefined];
        palette.slice(1).forEach((color, layer) => {
            ctx.fillStyle = color;
            const count = Math.round((h / w) * density[layer % density.length]);
            for (let i = 0; i < count; i++) {
                camoBlob(ctx, rand, rand() * w, rand() * h, w * (r0 + rand() * dr), shape);
            }
        });
        if (mesh) {
            // fendas verticais em fileiras desencontradas
            ctx.fillStyle = 'rgba(6, 6, 8, 0.6)';
            for (let row = 0, y = 2; y < h; y += 11, row++) {
                for (let x = row % 2 ? 1.5 : 5.25; x < w; x += 7.5) ctx.fillRect(x, y, 3, 8);
            }
        }
    });
}

// Cores da janela do monitor na textura. Elas passam pelo tone mapping (ACES) do pós-processamento
// e saem mais escuras na tela; o CSS da camada HTML (.screen--monitor, em styles.css) usa as cores
// que saem de verdade, de dia e de noite, para a troca textura -> HTML não dar salto de cor.
const MONITOR_COLORS = {
    bg: '#2a2730',
    bar: '#38343f',
    card: '#34303b',
    line: '#4d4756',
    fg: '#f4eeea',
    muted: '#b4a9ad',
    accent: '#ff7ad9',
    accentSoft: '#5a3a55',
    // texto do botão rosa ("Voltar ao quarto"): sai #1d0a19, o --accent-ink do CSS
    accentInk: '#351e30',
    dots: ['#ff6b8b', '#ffc27a', '#6fd3a0']
};

// Medidas da janela em % da largura da tela: iguais às do CSS (.win-bar, .win-scroll, em `cqw`)
const MONITOR_LAYOUT = { bar: 3.6, padX: 2.6 };

// Tela do monitor em repouso: a mesma janela da camada HTML (src/screens/MonitorScreen.jsx), com a
// barra de título, os projetos de verdade e a barra de tarefas. `redraw(t)` redesenha no idioma novo,
// e `fit(largura)` recebe a largura (px) que a tela vai ter na página quando a câmera parar.
export function monitorScreenTexture() {
    const canvas = document.createElement('canvas');
    // mesma proporção do plano da tela (2,22 x 1,22) e resolução boa para a câmera bem perto
    canvas.width = 1600;
    canvas.height = 880;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const W = canvas.width;
    const H = canvas.height;
    const u = W / 100; // 1 "cqw"
    const c = MONITOR_COLORS;
    const { bar, padX } = MONITOR_LAYOUT;

    // Largura da tela na página. O CSS tem limites em px (letra de 14 a 32px, barra de 40px...): numa
    // tela pequena o mínimo vale mais que o cqw, e a textura faz igual para a troca não dar salto.
    let pageW = W;
    // `cq(n, min, max)`: n cqw, mas nunca menos que `min` px nem mais que `max` px na página
    // (como o max() e o clamp() do CSS). O resultado é em cqw.
    const cq = (n, min = 0, max = Infinity) => Math.min(Math.max(n, (min / pageW) * 100), (max / pageW) * 100);

    // Largura de um texto, em cqw
    const textWidth = (value, size, { weight = 400, font = 'Figtree' } = {}) => {
        ctx.font = `${weight} ${size * u}px "${font}", system-ui, sans-serif`;
        ctx.letterSpacing = '0px';
        return ctx.measureText(value).width / u;
    };

    // `spacing`: espaço entre letras em em, como o letter-spacing do CSS
    const text = (value, x, y, size, { weight = 400, font = 'Figtree', color = c.fg, align = 'left', spacing = 0 } = {}) => {
        ctx.font = `${weight} ${size * u}px "${font}", system-ui, sans-serif`;
        ctx.letterSpacing = `${spacing * size * u}px`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(value, x, y);
    };

    const draw = (t) => {
        texture.userData.t = t;
        // letra da área com rolagem (.win-scroll: clamp(14px, 1.4cqw, 32px)); o cabeçalho da seção
        // é medido nela (em), como no CSS
        const em = cq(1.4, 14, 32);
        ctx.textBaseline = 'middle';
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        // barra de título: 3 bolinhas, o caminho no meio e o X
        ctx.fillStyle = c.bar;
        ctx.fillRect(0, 0, W, bar * u);
        c.dots.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc((1.9 + i * 1.4) * u, (bar / 2) * u, 0.45 * u, 0, Math.PI * 2);
            ctx.fill();
        });
        text(t.ui.screen.path.projects, W / 2, (bar / 2) * u, 1.25, { weight: 500, font: 'JetBrains Mono', color: c.muted, align: 'center' });
        ctx.strokeStyle = c.muted;
        ctx.lineWidth = 0.14 * u;
        ctx.lineCap = 'round';
        const x0 = W - 2.2 * u;
        const y0 = (bar / 2) * u;
        const s = 0.5 * u;
        ctx.beginPath();
        ctx.moveTo(x0 - s, y0 - s);
        ctx.lineTo(x0 + s, y0 + s);
        ctx.moveTo(x0 + s, y0 - s);
        ctx.lineTo(x0 - s, y0 + s);
        ctx.stroke();

        // título da seção com o ícone e a frase de abertura (medidas do .section-head, em em)
        const top = (bar + 2.4) * u;
        const icon = 2.3 * em;
        ctx.fillStyle = c.accentSoft;
        roundRect(ctx, padX * u, top, icon * u, icon * u, 0.6 * em * u);
        ctx.fill();
        // o mesmo ícone de monitor do HTML (IconMonitor, desenhado numa grade de 24)
        const g = (1.2 * em * u) / 24;
        const gx = (padX + 0.55 * em) * u;
        const gy = top + 0.55 * em * u;
        ctx.strokeStyle = c.fg;
        ctx.lineWidth = 1.8 * g;
        roundRect(ctx, gx + 3 * g, gy + 4 * g, 18 * g, 12 * g, 2 * g);
        ctx.moveTo(gx + 9 * g, gy + 20 * g);
        ctx.lineTo(gx + 15 * g, gy + 20 * g);
        ctx.moveTo(gx + 12 * g, gy + 16 * g);
        ctx.lineTo(gx + 12 * g, gy + 20 * g);
        ctx.stroke();
        text(t.ui.nav.projects, (padX + 3.05 * em) * u, top + (icon / 2) * u, 1.5 * em, { weight: 600, font: 'Unbounded', spacing: -0.01 });
        text(t.projects.intro, padX * u, top + 3.96 * em * u, em, { color: c.muted });

        // linha do tempo resumida: data, nome e tecnologias de cada projeto (do mais antigo ao mais recente)
        const items = [...t.projects.items].sort((a, b) => a.date.localeCompare(b.date));
        const listTop = top + 5.43 * em * u;
        const row = 6.4 * u;
        const lineX = (padX + 0.6) * u;
        ctx.fillStyle = c.line;
        ctx.fillRect(lineX - 0.1 * u, listTop, 0.2 * u, row * items.length - 1.2 * u);
        items.forEach((item, i) => {
            const y = listTop + i * row;
            ctx.fillStyle = c.card;
            roundRect(ctx, (padX + 2.2) * u, y, W - (2 * padX + 2.2) * u, row - 1.2 * u, 1 * u);
            ctx.fill();
            ctx.fillStyle = c.bg;
            ctx.strokeStyle = c.accent;
            ctx.lineWidth = 0.3 * u;
            ctx.beginPath();
            ctx.arc(lineX, y + 2.6 * u, 0.55 * u, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            const mid = y + (row - 1.2 * u) / 2;
            text(monthLabel(item.date, t), (padX + 3.6) * u, mid, 1.1, { font: 'JetBrains Mono', color: c.muted });
            text(item.name, (padX + 12) * u, mid, 1.75, { weight: 700 });
            text(item.tech.join(' · '), W - (padX + 1.4) * u, mid, 1.05, { font: 'JetBrains Mono', color: c.muted, align: 'right' });
        });

        // barra de tarefas (.win-task): a dica do teclado à esquerda e as saídas à direita
        const taskbar = cq(4, 40);
        const mid = H - (taskbar / 2) * u;
        ctx.fillStyle = c.bar;
        ctx.fillRect(0, H - taskbar * u, W, taskbar * u);
        // em tela de toque não há tecla Esc (no CSS, a .win-hint some com hover: none)
        if (!window.matchMedia?.('(hover: none)').matches) {
            text(t.ui.screen.escHint, padX * u, mid, cq(1.1, 12), { font: 'JetBrains Mono', color: c.muted });
        }
        // botões (.win-btn), da direita para a esquerda: "Voltar ao quarto" e "Ler em 2D"
        const font = cq(1.15, 13);
        const height = cq(2.7, 30);
        const border = (1 / pageW) * 100; // 1px da página
        let right = 100 - 1; // padding da direita: 1cqw
        const button = (label, { primary = false, listIcon = false } = {}) => {
            const iconSize = listIcon ? 1.3 * font : 0;
            const gap = listIcon ? 0.5 * font : 0;
            const width = 2 * (1.1 * font + border) + iconSize + gap + textWidth(label, font, { weight: 600 });
            const x = right - width;
            roundRect(ctx, x * u, mid - (height / 2) * u, width * u, height * u, (height / 2) * u);
            if (primary) {
                ctx.fillStyle = c.accent;
                ctx.fill();
            } else {
                ctx.strokeStyle = c.line;
                ctx.lineWidth = border * u;
                ctx.stroke();
            }
            const color = primary ? c.accentInk : c.fg;
            const textX = x + border + 1.1 * font;
            if (listIcon) {
                // o mesmo ícone de lista do HTML (IconList, grade de 24): 3 linhas com um ponto na frente
                const k = (iconSize * u) / 24;
                const ix = textX * u;
                const iy = mid - (iconSize / 2) * u;
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.8 * k;
                ctx.lineCap = 'round';
                ctx.beginPath();
                for (const y of [6, 12, 18]) {
                    ctx.moveTo(ix + 8 * k, iy + y * k);
                    ctx.lineTo(ix + 21 * k, iy + y * k);
                    ctx.moveTo(ix + 3.5 * k, iy + y * k);
                    ctx.lineTo(ix + 3.51 * k, iy + y * k);
                }
                ctx.stroke();
            }
            text(label, (textX + iconSize + gap) * u, mid, font, { weight: 600, color });
            right = x - 0.8; // espaço entre os botões: 0.8cqw
        };
        button(t.ui.close, { primary: true });
        button(t.ui.screen.read2d, { listIcon: true });
        texture.needsUpdate = true;
    };

    texture.userData.redraw = draw;
    // Chamado pelo Scene.jsx antes do voo até a tela, com a largura (px) que ela vai ter na página
    texture.userData.fit = (width) => {
        if (!(width > 0) || Math.abs(width - pageW) < 0.5) return;
        pageW = width;
        if (texture.userData.t) draw(texture.userData.t);
    };
    return texture;
}

// Tela da TV: cartão da experiência atual (seção Experiências)
export function tvScreenTexture() {
    return canvasTexture(768, 432, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#16121a');
        g.addColorStop(1, '#2a1630');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '600 22px system-ui, sans-serif';
        ctx.fillText('EXPERIÊNCIA · EXPERIENCE', 56, 78);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 76px system-ui, sans-serif';
        ctx.fillText('Teknisa', 52, 170);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '500 30px system-ui, sans-serif';
        ctx.fillText('Full Stack · Retail · PDV', 56, 222);
        // linha do tempo
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(56, 330);
        ctx.lineTo(w - 56, 330);
        ctx.stroke();
        ctx.fillStyle = '#ff5ad9';
        ctx.beginPath();
        ctx.arc(w - 140, 330, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '500 22px system-ui, sans-serif';
        ctx.fillText('2026', w - 168, 372);
    });
}

// Segmentos acesos de cada dígito (a: topo, b/c: direita, d: base, e/f: esquerda, g: meio)
const SEGMENTS = {
    0: 'abcdef',
    1: 'bc',
    2: 'abdeg',
    3: 'abcdg',
    4: 'bcfg',
    5: 'acdfg',
    6: 'acdefg',
    7: 'abc',
    8: 'abcdefg',
    9: 'abcdfg'
};

// Dígito de 7 segmentos inclinado, como no LCD. Os segmentos apagados ficam "fantasmas".
function sevenSeg(ctx, ch, x, y, w, h, t, ink) {
    const lit = SEGMENTS[ch] ?? '';
    const gap = t * 0.2;
    const horizontal = (yc) => [
        [t / 2 + gap, yc],
        [t + gap, yc - t / 2],
        [w - t - gap, yc - t / 2],
        [w - t / 2 - gap, yc],
        [w - t - gap, yc + t / 2],
        [t + gap, yc + t / 2]
    ];
    const vertical = (xc, y0, y1) => [
        [xc, y0 + gap],
        [xc + t / 2, y0 + t / 2 + gap],
        [xc + t / 2, y1 - t / 2 - gap],
        [xc, y1 - gap],
        [xc - t / 2, y1 - t / 2 - gap],
        [xc - t / 2, y0 + t / 2 + gap]
    ];
    const segs = {
        a: horizontal(t / 2),
        g: horizontal(h / 2),
        d: horizontal(h - t / 2),
        f: vertical(t / 2, t / 2, h / 2),
        b: vertical(w - t / 2, t / 2, h / 2),
        e: vertical(t / 2, h / 2, h - t / 2),
        c: vertical(w - t / 2, h / 2, h - t / 2)
    };
    ctx.save();
    ctx.translate(x + h * 0.1, y);
    ctx.transform(1, 0, -0.1, 1, 0, 0);
    Object.entries(segs).forEach(([id, pts]) => {
        ctx.fillStyle = lit.includes(id) ? ink : 'rgba(20, 26, 22, 0.025)';
        ctx.beginPath();
        pts.forEach(([px, py]) => ctx.lineTo(px, py));
        ctx.closePath();
        ctx.fill();
    });
    ctx.restore();
}

// Nuvem com chuva, o ícone da previsão do tempo no canto do visor
function rainIcon(ctx, ink) {
    const cloud = (x, y, s) => {
        ctx.beginPath();
        ctx.arc(x, y, 22 * s, Math.PI * 0.95, Math.PI * 1.85);
        ctx.arc(x + 34 * s, y - 8 * s, 26 * s, Math.PI * 1.15, Math.PI * 1.95);
        ctx.arc(x + 62 * s, y + 10 * s, 18 * s, Math.PI * 1.4, Math.PI * 0.5);
        ctx.lineTo(x - 18 * s, y + 28 * s);
        ctx.arc(x - 18 * s, y + 12 * s, 16 * s, Math.PI * 0.5, Math.PI * 1.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    };
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.fillStyle = 'rgba(175, 190, 178, 0.5)';
    cloud(118, 112, 0.9);
    cloud(52, 118, 1);
    ctx.fillStyle = ink;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 9; c++) {
            const x = 30 + c * 16 + r * 5;
            const y = 172 + r * 20;
            ctx.beginPath();
            ctx.ellipse(x, y, 2.6, 5.5, 0.35, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Visor transparente do relógio digital da mesa: hora, dia da semana e data de verdade
export function clockTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 820;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const ink = '#101412';
    const digits = (text, x, y, w, h, t, step) =>
        [...text].forEach((ch, i) => sevenSeg(ctx, ch, x + i * step, y, w, h, t, ink));
    const label = (text, x, y, size, weight = 700) => {
        ctx.font = `${weight} ${size}px Arial, Helvetica, sans-serif`;
        ctx.fillText(text, x, y);
    };
    const draw = () => {
        const now = new Date();
        const hours = now.getHours() % 12 || 12;
        const month = now.getMonth() + 1;
        const day = now.getDate();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // vidro cinza-esverdeado, com um reflexo diagonal bem leve
        ctx.fillStyle = 'rgba(176, 192, 180, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const glare = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        glare.addColorStop(0.15, 'rgba(255, 255, 255, 0)');
        glare.addColorStop(0.3, 'rgba(255, 255, 255, 0.12)');
        glare.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        rainIcon(ctx, ink);
        ctx.fillStyle = ink;
        ctx.textAlign = 'left';
        label(now.getHours() < 12 ? 'AM' : 'PM', 232, 128, 34);

        // hora grande em 12h (a dezena some quando é zero)
        digits(`${hours > 9 ? 1 : ' '}${hours % 10}`, 330, 14, 62, 126, 13, 72);
        ctx.fillStyle = ink;
        [52, 102].forEach((cy) => ctx.fillRect(482, cy, 11, 11));
        digits(String(now.getMinutes()).padStart(2, '0'), 508, 14, 62, 126, 13, 72);

        // dia da semana na caixinha
        ctx.fillStyle = ink;
        label('Day', 714, 24, 17, 600);
        ctx.strokeStyle = ink;
        ctx.lineWidth = 4;
        roundRect(ctx, 666, 32, 140, 66, 10);
        ctx.stroke();
        ctx.textAlign = 'center';
        label(WEEKDAYS[now.getDay()], 736, 84, 50, 'italic 700');
        label('MONTH', 650, 140, 16, 600);
        label('DATE', 770, 140, 16, 600);

        // linha de baixo: umidade, temperatura e mês/dia
        ctx.textAlign = 'left';
        digits('59', 236, 160, 38, 76, 9, 46);
        label('%', 330, 232, 42);
        digits('26', 440, 160, 38, 76, 9, 46);
        label('°C', 530, 186, 28);
        digits(String(month).padStart(2, ' '), 590, 160, 38, 76, 9, 46);
        ctx.save();
        ctx.translate(690, 160);
        ctx.transform(1, 0, -0.35, 1, 0, 0);
        ctx.fillRect(22, 4, 9, 70);
        ctx.restore();
        digits(String(day).padStart(2, ' '), 718, 160, 38, 76, 9, 46);
        texture.needsUpdate = true;
    };
    draw();
    texture.userData.redraw = draw;
    return texture;
}

export function phoneScreenTexture() {
    return canvasTexture(300, 600, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#3a1d3f');
        g.addColorStop(1, '#0e1020');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = '600 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('12:36', w / 2, 130);
        const icons = ['#f0b44c', '#5ef2d6', '#ff8fa3', '#7cc7ff', '#c3a6ff', '#3fd17a', '#ffffff', '#ff6b5e'];
        icons.forEach((c, i) => {
            ctx.fillStyle = c;
            roundRect(ctx, 26 + (i % 4) * 66, 300 + Math.floor(i / 4) * 80, 50, 50, 14);
            ctx.fill();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(ctx, 22, h - 100, w - 44, 70, 26);
        ctx.fill();
    });
}

// Teclado mecânico preto (vista de cima)
export function keyboardTexture() {
    return canvasTexture(512, 192, (ctx, w, h) => {
        ctx.fillStyle = '#16171a';
        ctx.fillRect(0, 0, w, h);
        const rows = 6;
        const kw = 30;
        for (let r = 0; r < rows; r++) {
            const cols = r === 0 ? 15 : 14;
            for (let c = 0; c < cols; c++) {
                let x = 10 + c * (kw + 3) + (r % 2) * 6;
                if (x + kw > w - 50) continue;
                ctx.fillStyle = '#2b2d32';
                roundRect(ctx, x, 10 + r * 29, kw, 25, 4);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                ctx.fillRect(x + 3, 12 + r * 29, kw - 6, 3);
            }
        }
        // botão giratório
        ctx.fillStyle = '#3a3c42';
        ctx.beginPath();
        ctx.arc(w - 26, 26, 16, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Calculadora científica (vista de cima)
export function calculatorTexture() {
    return canvasTexture(160, 300, (ctx, w, h) => {
        ctx.fillStyle = '#2c2e33';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#9fa89a';
        ctx.fillRect(16, 20, w - 32, 56);
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 5; c++) {
                ctx.fillStyle = r > 3 ? '#e6e6e6' : '#4b4e55';
                roundRect(ctx, 14 + c * 27, 96 + r * 24, 21, 15, 4);
                ctx.fill();
            }
        }
    });
}

// Emblemas prateados da frente do gabinete (estilizados): 'logo' (chama) ou 'wings' (asas)
export function caseBadgeTexture(kind) {
    if (kind === 'logo') {
        return canvasTexture(128, 128, (ctx) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3c3d42';
            ctx.lineWidth = 5;
            // três penas curvas, como uma chama subindo
            [[0, 0, 1], [10, 30, 0.85], [20, 58, 0.7]].forEach(([dx, dy, s]) => {
                ctx.save();
                ctx.translate(30 + dx, 30 + dy);
                ctx.scale(s, s);
                ctx.beginPath();
                ctx.moveTo(0, 30);
                ctx.bezierCurveTo(10, 8, 40, 0, 78, 0);
                ctx.bezierCurveTo(52, 10, 40, 22, 34, 40);
                ctx.bezierCurveTo(24, 34, 12, 32, 0, 30);
                ctx.stroke();
                ctx.fill();
                ctx.restore();
            });
        });
    }
    return canvasTexture(512, 128, (ctx, w, h) => {
        const cx = w / 2;
        const cy = h / 2;
        ctx.fillStyle = '#ffffff';
        // contorno escuro para o prata não sumir no camuflado claro
        ctx.strokeStyle = '#3c3d42';
        ctx.lineWidth = 5;
        // asas: quatro penas afinando para fora, de cada lado
        [-1, 1].forEach((side) => {
            for (let i = 0; i < 4; i++) {
                const y = cy - 34 + i * 18;
                const len = 214 - i * 40;
                ctx.beginPath();
                ctx.moveTo(cx + side * 40, y);
                ctx.lineTo(cx + side * (40 + len), y + 2);
                ctx.lineTo(cx + side * (30 + len), y + 14);
                ctx.lineTo(cx + side * 40, y + 15);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
        });
        // medalhão no meio, escuro por dentro
        ctx.beginPath();
        ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        ctx.fillStyle = '#26272b';
        ctx.beginPath();
        ctx.arc(cx, cy, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - 26);
        ctx.lineTo(cx + 20, cy - 8);
        ctx.lineTo(cx + 12, cy + 24);
        ctx.lineTo(cx - 12, cy + 24);
        ctx.lineTo(cx - 20, cy - 8);
        ctx.closePath();
        ctx.fill();
    });
}

// Adesivos na lateral do gabinete: um redondo com a "estrela" laranja e um ícone azul
export function caseStickersTexture() {
    return canvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = '#f4efe6';
        ctx.beginPath();
        ctx.arc(176, 54, 46, 0, Math.PI * 2);
        ctx.fill();
        // estrela laranja: miolo redondo com raios
        ctx.fillStyle = '#d9773f';
        ctx.save();
        ctx.translate(176, 54);
        for (let i = 0; i < 12; i++) {
            ctx.rotate(Math.PI / 6);
            roundRect(ctx, -4.5, -36, 9, 36, 4.5);
            ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // ícone azul (uma fita dobrada, estilizada)
        ctx.lineCap = 'round';
        ctx.lineWidth = 30;
        ctx.strokeStyle = '#3aa2f2';
        ctx.beginPath();
        ctx.moveTo(200, 124);
        ctx.lineTo(118, 190);
        ctx.lineTo(200, 234);
        ctx.stroke();
        ctx.fillStyle = '#1d74d0';
        roundRect(ctx, 192, 108, 40, 142, 8);
        ctx.fill();
    });
}

// Tela da cadeira: trama fina e escura, um pouco vazada (usada com transparência)
export function chairMeshTexture() {
    return canvasTexture(64, 64, (ctx, w, h) => {
        ctx.fillStyle = 'rgba(30, 31, 35, 0.8)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(12, 12, 14, 0.96)';
        for (let i = 0; i < w; i += 8) {
            ctx.fillRect(i, 0, 3, h);
            ctx.fillRect(0, i, w, 3);
        }
    }, { repeat: [9, 9] });
}

// Bola de futevôlei: gomos amarelo, azul e verde
export function ballTexture() {
    return canvasTexture(512, 256, (ctx, w, h) => {
        const colors = ['#f2c318', '#1f5fb8', '#f2c318', '#2f9a4a'];
        const bands = 12;
        for (let i = 0; i < bands; i++) {
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo((i / bands) * w, 0);
            for (let y = 0; y <= h; y += 8) {
                ctx.lineTo((i / bands) * w + Math.sin((y / h) * Math.PI * 2) * 30, y);
            }
            for (let y = h; y >= 0; y -= 8) {
                ctx.lineTo(((i + 1) / bands) * w + Math.sin((y / h) * Math.PI * 2) * 30, y);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        for (let i = 0; i <= bands; i++) {
            ctx.beginPath();
            for (let y = 0; y <= h; y += 8) ctx.lineTo((i / bands) * w + Math.sin((y / h) * Math.PI * 2) * 30, y);
            ctx.stroke();
        }
    });
}

// Pôsteres: versões minimalistas desenhadas aqui (não são as artes oficiais)
const POSTERS = {
    pulp: (ctx, w, h) => {
        ctx.fillStyle = '#1a1414';
        ctx.fillRect(0, 0, w, h);
        const g = ctx.createRadialGradient(w / 2, h * 0.42, 10, w / 2, h * 0.42, w * 0.55);
        g.addColorStop(0, 'rgba(255, 200, 70, 0.95)');
        g.addColorStop(1, 'rgba(255, 160, 40, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // maleta aberta brilhando
        ctx.fillStyle = '#2b2018';
        ctx.fillRect(w * 0.2, h * 0.46, w * 0.6, h * 0.2);
        ctx.fillStyle = '#ffd77a';
        ctx.fillRect(w * 0.24, h * 0.42, w * 0.52, h * 0.06);
        ctx.fillStyle = '#c7372f';
        ctx.font = `900 ${w * 0.15}px Impact, 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('PULP', w / 2, h * 0.18);
        ctx.fillText('FICTION', w / 2, h * 0.3);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = `600 ${w * 0.045}px system-ui, sans-serif`;
        ctx.fillText('1994', w / 2, h * 0.9);
    },
    fight: (ctx, w, h) => {
        ctx.fillStyle = '#f1ece4';
        ctx.fillRect(0, 0, w, h);
        // sabonete rosa
        ctx.fillStyle = '#ef8fb3';
        roundRect(ctx, w * 0.22, h * 0.36, w * 0.56, h * 0.26, w * 0.12);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        roundRect(ctx, w * 0.3, h * 0.4, w * 0.3, h * 0.06, w * 0.03);
        ctx.fill();
        ctx.fillStyle = '#1b1b1b';
        ctx.font = `900 ${w * 0.14}px Impact, 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('FIGHT', w / 2, h * 0.16);
        ctx.fillText('CLUB', w / 2, h * 0.28);
        ctx.font = `600 ${w * 0.045}px system-ui, sans-serif`;
        ctx.fillText('1999', w / 2, h * 0.9);
    },
    beauty: (ctx, w, h) => {
        ctx.fillStyle = '#f6f1ea';
        ctx.fillRect(0, 0, w, h);
        const rand = seeded(8);
        for (let i = 0; i < 26; i++) {
            ctx.fillStyle = `rgba(${170 + rand() * 50}, 20, 35, 0.9)`;
            ctx.beginPath();
            ctx.ellipse(w * (0.25 + rand() * 0.5), h * (0.35 + rand() * 0.35), 10 + rand() * 14, 6 + rand() * 9, rand() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#9e1426';
        ctx.font = `800 ${w * 0.09}px Georgia, 'Times New Roman', serif`;
        ctx.textAlign = 'center';
        ctx.fillText('AMERICAN', w / 2, h * 0.15);
        ctx.fillText('BEAUTY', w / 2, h * 0.25);
        ctx.fillStyle = '#555';
        ctx.font = `600 ${w * 0.045}px system-ui, sans-serif`;
        ctx.fillText('1999', w / 2, h * 0.9);
    },
    basterds: (ctx, w, h) => {
        ctx.fillStyle = '#4a4f2f';
        ctx.fillRect(0, 0, w, h);
        // taco de beisebol
        ctx.save();
        ctx.translate(w / 2, h * 0.56);
        ctx.rotate(-0.5);
        ctx.fillStyle = '#c99a5e';
        ctx.beginPath();
        ctx.moveTo(-w * 0.32, -6);
        ctx.lineTo(w * 0.28, -16);
        ctx.quadraticCurveTo(w * 0.36, 0, w * 0.28, 16);
        ctx.lineTo(-w * 0.32, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#efe6cf';
        ctx.font = `900 ${w * 0.1}px Impact, 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('INGLOURIOUS', w / 2, h * 0.15);
        ctx.fillText('BASTERDS', w / 2, h * 0.25);
        ctx.font = `600 ${w * 0.045}px system-ui, sans-serif`;
        ctx.fillText('2009', w / 2, h * 0.9);
    },
    dust: (ctx, w, h) => {
        ctx.fillStyle = '#d9b77c';
        ctx.fillRect(0, 0, w, h);
        // arco e caixas do mapa, em silhueta
        ctx.fillStyle = '#9b7444';
        ctx.fillRect(w * 0.15, h * 0.42, w * 0.7, h * 0.36);
        ctx.fillStyle = '#d9b77c';
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.58, w * 0.18, Math.PI, 0);
        ctx.lineTo(w * 0.68, h * 0.78);
        ctx.lineTo(w * 0.32, h * 0.78);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6e4f2c';
        ctx.fillRect(w * 0.08, h * 0.66, w * 0.18, h * 0.12);
        ctx.fillRect(w * 0.12, h * 0.56, w * 0.12, h * 0.1);
        ctx.fillStyle = '#2b2116';
        ctx.font = `900 ${w * 0.16}px Impact, 'Arial Black', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('DUST II', w / 2, h * 0.24);
        ctx.font = `700 ${w * 0.06}px ui-monospace, Consolas, monospace`;
        ctx.fillText('de_dust2', w / 2, h * 0.9);
    }
};

export function posterTexture(kind) {
    return canvasTexture(300, 420, POSTERS[kind]);
}
