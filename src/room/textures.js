// Texturas desenhadas em <canvas>: nada de imagem externa, tudo gerado no navegador.
// As cores seguem as fotos do quarto do Daniel.
import * as THREE from 'three';

import { monthLabel, profile } from '../content/content';
import { languageColor, projectList } from '../screens/github';

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
        woodGrain(ctx, w, h, {
            base: '#ccb699',
            dark: '#a08a6e',
            light: '#ddcfb8',
            seed: 21,
            vertical: true,
            lines: 220,
            bands: 4,
            parallel: true
        })
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
        [
            [0.42, 0.06],
            [0.63, 0.03],
            [0.82, 0.08]
        ].forEach(([x, width]) => ctx.fillRect(w * x, h * 0.38, w * width, h * 0.14));
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

// Cores da janela do monitor na textura (tema escuro do GitHub). Elas passam pelo tone mapping do
// pós-processamento e saem mais escuras na tela; por isso as de entrada são mais claras que as do
// CSS (.screen--monitor, em styles.css), calibradas medindo a tela no quarto, para a troca
// textura -> HTML não dar salto de cor.
const MONITOR_COLORS = {
    bg: '#232428',
    bar: '#2a2c31',
    line: '#4c4f56',
    fg: '#f6fbff',
    muted: '#b5bdc6',
    link: '#6fb1ff',
    tab: '#ff9b84',
    accent: '#2fa84a',
    accentInk: '#ffffff',
    avatar: '#3a3f4a',
    dots: ['#ff8a80', '#f7c96c', '#6fc874']
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
    // a foto do perfil chega depois do primeiro desenho; quando chega, desenha de novo
    const avatar = new Image();

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
        const g = t.projects.gh;
        const items = projectList(t);
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
        text(t.ui.screen.path.projects, W / 2, (bar / 2) * u, 1.25, {
            weight: 500,
            font: 'JetBrains Mono',
            color: c.muted,
            align: 'center'
        });
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

        // Visão geral do perfil (MonitorScreen.jsx + monitor.css), com as medidas do CSS em em
        const em = cq(1.15, 13, 28);
        const lh = 1.55 * em; // altura de uma linha (line-height do body)
        const px = (n) => (n / pageW) * 100; // n px da página, em cqw

        // abas: "Visão geral" (marcada) e "Repositórios" com a contagem
        const tabsTop = bar + 0.7 * em;
        const tabMid = (tabsTop + 0.55 * em + lh / 2) * u;
        const tabsBottom = tabsTop + 0.55 * em + lh + 0.75 * em;
        ctx.fillStyle = c.line;
        ctx.fillRect(0, (tabsBottom + px(2)) * u, W, px(1) * u);
        let tx = padX;
        [g.overview, g.repositories].forEach((label, i) => {
            const x0 = tx;
            const weight = i === 0 ? 600 : 400;
            // ícone (um quadradinho no lugar do desenho do HTML) e o nome da aba
            ctx.strokeStyle = c.muted;
            ctx.lineWidth = px(1.6) * u;
            roundRect(ctx, (x0 + 0.8 * em) * u, tabMid - 0.45 * em * u, 0.9 * em * u, 0.9 * em * u, 0.15 * em * u);
            ctx.stroke();
            tx += 0.8 * em + 1.1 * em + 0.5 * em;
            text(label, tx * u, tabMid, em, { weight });
            tx += textWidth(label, em, { weight });
            if (i === 1) {
                const n = String(items.length);
                const w = textWidth(n, 0.85 * em) + 1.1 * 0.85 * em;
                ctx.fillStyle = c.line;
                roundRect(ctx, (tx + 0.5 * em) * u, tabMid - 0.65 * em * u, w * u, 1.3 * em * u, 0.65 * em * u);
                ctx.fill();
                text(n, (tx + 0.5 * em + w / 2) * u, tabMid, 0.85 * em, { align: 'center' });
                tx += 0.5 * em + w;
            }
            tx += 0.8 * em;
            if (i === 0) {
                ctx.fillStyle = c.tab;
                ctx.fillRect(x0 * u, tabsBottom * u, (tx - x0) * u, px(2) * u);
            }
            tx += 0.4 * em;
        });

        // coluna do perfil: foto redonda, nome e usuário
        const top = tabsBottom + px(3) + 1.1 * em;
        const side = 15 * em;
        const r = (side / 2) * u;
        ctx.save();
        ctx.beginPath();
        ctx.arc((padX + side / 2) * u, top * u + r, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = c.avatar;
        ctx.fillRect(padX * u, top * u, side * u, side * u);
        if (avatar.complete && avatar.naturalWidth) {
            const k = Math.max(side / avatar.naturalWidth, side / avatar.naturalHeight);
            const iw = avatar.naturalWidth * k;
            const ih = avatar.naturalHeight * k;
            ctx.drawImage(avatar, (padX + (side - iw) / 2) * u, (top + (side - ih) / 2) * u, iw * u, ih * u);
        }
        ctx.restore();
        let y = top + side + 0.9 * em;
        text(profile.name, padX * u, (y + 0.96 * em) * u, 1.6 * em, { weight: 600 });
        y += 1.92 * em + 0.5 * em;
        text('Danielolv14', padX * u, (y + 0.9 * em) * u, 1.15 * em, { color: c.muted });

        // projetos fixados em duas colunas, como os cartões do HTML
        const mainX = padX + side + 2 * em;
        const mainW = 100 - padX - mainX;
        y = top + 0.6 * em;
        text(g.pinned, mainX * u, (y + lh / 2) * u, em);
        y += lh + 0.6 * em;
        const small = 0.92 * em;
        const cardW = (mainW - em) / 2;
        const cardH = 2 * em + lh + 0.5 * em + 2 * 1.55 * small + 0.5 * em + 0.85 * lh;
        // corta o texto com reticências para caber na largura
        const clip = (value, size, width, opts) => {
            let v = value;
            while (v.length > 1 && textWidth(v, size, opts) > width) v = v.slice(0, -2);
            return v === value ? v : `${v.trimEnd()}…`;
        };
        items.forEach((item, i) => {
            const x = mainX + (i % 2) * (cardW + em);
            const cy = y + Math.floor(i / 2) * (cardH + em);
            ctx.strokeStyle = c.line;
            ctx.lineWidth = px(1) * u;
            roundRect(ctx, x * u, cy * u, cardW * u, cardH * u, 0.45 * em * u);
            ctx.stroke();
            const inner = cardW - 2 * em;
            const head = (cy + em + lh / 2) * u;
            ctx.strokeStyle = c.muted;
            roundRect(ctx, (x + em) * u, head - 0.5 * em * u, 0.9 * em * u, 1.05 * em * u, 0.12 * em * u);
            ctx.stroke();
            text(clip(item.repoName, em, inner - 6 * em, { weight: 600 }), (x + em + 1.55 * em) * u, head, em, {
                weight: 600,
                color: c.link
            });
            // descrição em até duas linhas
            const desc = cy + em + lh + 0.5 * em;
            let line = '';
            let row = 0;
            for (const word of item.description.split(' ')) {
                const next = line ? `${line} ${word}` : word;
                if (row === 0 && line && textWidth(next, small) > inner) {
                    text(line, (x + em) * u, (desc + 0.5 * 1.55 * small) * u, small, { color: c.muted });
                    row = 1;
                    line = word;
                } else line = next;
            }
            text(clip(line, small, inner), (x + em) * u, (desc + (row + 0.5) * 1.55 * small) * u, small, { color: c.muted });
            // linguagem com a bolinha de cor e o mês
            const foot = (cy + cardH - em - 0.85 * (lh / 2)) * u;
            ctx.fillStyle = languageColor(item.language);
            ctx.beginPath();
            ctx.arc((x + em + 0.425 * em) * u, foot, 0.425 * em * u, 0, Math.PI * 2);
            ctx.fill();
            text(`${item.language}    ${monthLabel(item.date, t)}`, (x + em + 1.15 * em) * u, foot, 0.85 * em, { color: c.muted });
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

    avatar.onload = () => texture.userData.t && draw(texture.userData.t);
    avatar.src = profile.photo;
    texture.userData.redraw = draw;
    // Chamado pelo Scene.jsx antes do voo até a tela, com a largura (px) que ela vai ter na página
    texture.userData.fit = (width) => {
        if (!(width > 0) || Math.abs(width - pageW) < 0.5) return;
        pageW = width;
        if (texture.userData.t) draw(texture.userData.t);
    };
    return texture;
}

// Cores da TV na textura (perfil no estilo do LinkedIn, TvScreen.jsx + tv.css): claro de dia, escuro
// à noite. Como as do monitor, as de entrada foram calibradas para saírem nas do CSS depois do tone
// mapping do 3D.
const TV_COLORS = {
    day: {
        bg: '#f2efea',
        card: '#ffffff',
        line: '#efeeec',
        fg: '#000000',
        muted: '#3c3c3c',
        accent: '#0a4f9a',
        accentInk: '#ffffff',
        cover: ['#0a4f9a', '#4a87c6'],
        logo: '#d3e0ec',
        logoInk: '#1d4670',
        bar: '#ffffff',
        dots: ['#f08a82', '#eec777', '#7cc68a']
    },
    night: {
        bg: '#000000',
        card: '#24262a',
        line: '#474b52',
        fg: '#f2f2f2',
        muted: '#b9b9b9',
        accent: '#86c5ff',
        accentInk: '#000000',
        cover: ['#124d86', '#3b80bd'],
        logo: '#34404d',
        logoInk: '#cbdbea',
        bar: '#24262a',
        dots: ['#f08a82', '#eec777', '#7cc68a']
    }
};

// Tela da TV em repouso: o cartão do topo do perfil (capa, foto, nome, título e o botão Conectar) e o
// começo da aba Experiência, com as medidas do tv.css. `redraw(t, night)` redesenha no idioma e no
// tema atuais (o TV, em Desk.jsx, chama quando um dos dois muda).
export function tvScreenTexture() {
    const canvas = document.createElement('canvas');
    // mesma proporção do plano da tela (2,5 x 1,4)
    canvas.width = 1600;
    canvas.height = 896;
    const ctx = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    const W = canvas.width;
    const H = canvas.height;
    const u = W / 100; // 1 "cqw"
    // largura típica da TV na página com a câmera parada (como o monitor, ~1130 px numa tela de 1280)
    const pageW = 1130;
    const em = Math.min(Math.max(1.1, (13 / pageW) * 100), (28 / pageW) * 100);
    const lh = 1.55 * em;
    const avatar = new Image();

    // tudo em cqw; o canvas recebe em px
    const text = (value, x, y, size, { weight = 400, color, align = 'left' } = {}) => {
        ctx.font = `${weight} ${size * u}px "Figtree", system-ui, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(value, x * u, y * u);
    };
    const width = (value, size, weight = 400) => {
        ctx.font = `${weight} ${size * u}px "Figtree", system-ui, sans-serif`;
        return ctx.measureText(value).width / u;
    };
    const box = (x, y, w, h, r, fill, stroke) => {
        roundRect(ctx, x * u, y * u, w * u, h * u, r * u);
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = (1 / pageW) * 100 * u;
            ctx.stroke();
        }
    };

    const draw = (t, night) => {
        texture.userData.t = t;
        texture.userData.night = night;
        const c = TV_COLORS[night ? 'night' : 'day'];
        const l = t.experience.li;
        const job = t.experience.items[0];
        ctx.textBaseline = 'middle';
        ctx.fillStyle = c.bg;
        ctx.fillRect(0, 0, W, H);

        // barra de cima, como a do monitor (.win-bar): bolinhas, endereço e o X
        const bar = 3.6;
        ctx.fillStyle = c.bar;
        ctx.fillRect(0, 0, W, bar * u);
        c.dots.forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc((1.9 + i * 1.4) * u, (bar / 2) * u, 0.45 * u, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.font = `500 ${1.25 * u}px "JetBrains Mono", monospace`;
        ctx.fillStyle = c.muted;
        ctx.textAlign = 'center';
        ctx.fillText(t.ui.screen.path.experience, W / 2, (bar / 2) * u);

        // cartão do topo
        const padX = 2.6;
        const x = padX;
        const y = bar + 2.4;
        const w = 100 - 2 * padX;
        const cover = 9 * em;
        const bodyH = 4.4 * em + 1.8 * em * 1.2 + (0.3 + 0.5) * em + 1.1 * lh + lh + em + 0.8 * em + lh + 1.6 * em;
        ctx.save();
        roundRect(ctx, x * u, y * u, w * u, (cover + bodyH) * u, 0.6 * em * u);
        ctx.clip();
        ctx.fillStyle = c.card;
        ctx.fillRect(x * u, y * u, w * u, (cover + bodyH) * u);
        const g = ctx.createLinearGradient(x * u, y * u, (x + w) * u, (y + cover) * u);
        g.addColorStop(0, c.cover[0]);
        g.addColorStop(1, c.cover[1]);
        ctx.fillStyle = g;
        ctx.fillRect(x * u, y * u, w * u, cover * u);
        // a faixa clara diagonal da capa
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.beginPath();
        ctx.moveTo((x + w * 0.62) * u, y * u);
        ctx.lineTo((x + w * 0.66) * u, y * u);
        ctx.lineTo((x + w * 0.59) * u, (y + cover) * u);
        ctx.lineTo((x + w * 0.55) * u, (y + cover) * u);
        ctx.fill();
        ctx.restore();
        box(x, y, w, cover + bodyH, 0.6 * em, null, c.line);

        // foto redonda por cima da capa, com a borda da cor do cartão
        const side = 9.5 * em;
        const ax = x + 1.8 * em;
        const ay = y + 3.6 * em;
        ctx.fillStyle = c.card;
        ctx.beginPath();
        ctx.arc((ax + side / 2) * u, (ay + side / 2) * u, (side / 2) * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.arc((ax + side / 2) * u, (ay + side / 2) * u, (side / 2 - 0.25 * em) * u, 0, Math.PI * 2);
        ctx.clip();
        if (avatar.complete && avatar.naturalWidth) {
            const s = side - 0.5 * em;
            const k = Math.max(s / avatar.naturalWidth, s / avatar.naturalHeight);
            ctx.drawImage(
                avatar,
                (ax + 0.25 * em + (s - avatar.naturalWidth * k) / 2) * u,
                (ay + 0.25 * em + (s - avatar.naturalHeight * k) / 2) * u,
                avatar.naturalWidth * k * u,
                avatar.naturalHeight * k * u
            );
        }
        ctx.restore();

        // nome, título, local e o botão Conectar
        const bx = x + 1.8 * em;
        let by = y + cover + 4.4 * em;
        text(profile.name, bx, by + 0.9 * em, 1.8 * em, { weight: 600, color: c.fg });
        by += 1.8 * em * 1.2 + 0.3 * em;
        text(l.headline, bx, by + 0.55 * lh, 1.1 * em, { color: c.fg });
        by += 1.1 * lh + 0.5 * em;
        text(t.about.location, bx + 1.3 * em, by + lh / 2, em, { color: c.muted });
        by += lh + em;
        const bw = width(l.connect, em, 600) + 2.4 * em + 1.4 * em;
        box(bx, by, bw, lh + 0.8 * em, (lh + 0.8 * em) / 2, c.accent);
        text(l.connect, bx + 1.2 * em, by + (lh + 0.8 * em) / 2, em, { weight: 600, color: c.accentInk });

        // empresa e faculdade à direita, com o monograma
        const rows = [job?.org, t.about.education[0]?.school].filter(Boolean);
        const right = x + w - 1.8 * em;
        rows.forEach((name, i) => {
            const ry = y + cover + 4.4 * em + i * (1.76 * em + 0.7 * em);
            const nw = width(name, em, 600);
            text(name, right - nw, ry + 0.88 * em, em, { weight: 600, color: c.fg });
            box(right - nw - 0.6 * em - 1.76 * em, ry, 1.76 * em, 1.76 * em, 0.2 * em, c.logo);
        });

        // o começo do cartão das abas (Experiência marcada)
        const ty = y + cover + bodyH + em;
        box(x, ty, w, H / u, 0.6 * em, c.card, c.line);
        let tx = x + 1.8 * em;
        Object.values(l.tabs).forEach((label, i) => {
            const tw = width(label, em, 600) + 1.6 * em;
            text(label, tx + 0.8 * em, ty + 0.9 * em + lh / 2, em, { weight: 600, color: i === 0 ? c.accent : c.muted });
            if (i === 0) {
                ctx.fillStyle = c.accent;
                ctx.fillRect(tx * u, (ty + 1.6 * em + lh) * u, tw * u, (2 / pageW) * 100 * u);
            }
            tx += tw + 0.4 * em;
        });
        ctx.fillStyle = c.line;
        ctx.fillRect(x * u, (ty + 1.6 * em + lh + (2 / pageW) * 100) * u, w * u, (1 / pageW) * 100 * u);
        if (job) {
            const jy = ty + 1.6 * em + lh + 0.4 * em + em;
            box(x + 1.8 * em, jy, 3.6 * em, 3.6 * em, 0.25 * em, c.logo);
            text(job.org[0], x + 3.6 * em, jy + 1.8 * em, em, { weight: 700, color: c.logoInk, align: 'center' });
            text(job.role, x + 6.4 * em, jy + 0.55 * em * 1.1 * 1.4, 1.1 * em, { weight: 600, color: c.fg });
            text(`${job.org} · ${l.fullTime}`, x + 6.4 * em, jy + 1.1 * em * 1.4 + 0.25 * em + lh / 2, em, { color: c.fg });
        }
        texture.needsUpdate = true;
    };

    avatar.onload = () => texture.userData.t && draw(texture.userData.t, texture.userData.night);
    avatar.src = profile.photo;
    texture.userData.redraw = draw;
    return texture;
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
    const digits = (text, x, y, w, h, t, step) => [...text].forEach((ch, i) => sevenSeg(ctx, ch, x + i * step, y, w, h, t, ink));
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
            [
                [0, 0, 1],
                [10, 30, 0.85],
                [20, 58, 0.7]
            ].forEach(([dx, dy, s]) => {
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
            ctx.ellipse(
                w * (0.25 + rand() * 0.5),
                h * (0.35 + rand() * 0.35),
                10 + rand() * 14,
                6 + rand() * 9,
                rand() * 3,
                0,
                Math.PI * 2
            );
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

// Pôster em resolução maior (para o pipeline do Blender): o mesmo desenho, com o canvas ampliado
export function posterCanvas(kind, scale = 3) {
    const canvas = document.createElement('canvas');
    canvas.width = 300 * scale;
    canvas.height = 420 * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    POSTERS[kind](ctx, 300, 420);
    return canvas;
}
