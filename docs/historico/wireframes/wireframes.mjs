// Gera os wireframes de média fidelidade em docs/wireframes/*.svg.
// Cada SVG pode ser arrastado para o Figma e vira um quadro editável (formas e textos).
// Rodar com: node scripts/wireframes.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'docs/wireframes';

// Tons de cinza (wireframe) + laranja só para as anotações
const C = {
    canvas: '#f1f1ee',
    frame: '#ffffff',
    block: '#ebebe8',
    block2: '#dcdcd8',
    block3: '#c9c9c4',
    line: '#a5a5a0',
    ink: '#262624',
    mute: '#76766f',
    dark: '#55554f',
    note: '#d9480f'
};
const FONT = "Inter, 'Segoe UI', Arial, sans-serif";

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- Primitivas ----------

const rect = (x, y, w, h, { fill = C.block, stroke = 'none', sw = 1, r = 0, dash = '' } = {}) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

const text = (x, y, s, { size = 14, weight = 400, fill = C.ink, anchor = 'start' } = {}) =>
    `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;

const line = (x1, y1, x2, y2, { stroke = C.line, sw = 1, dash = '' } = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;

const circle = (cx, cy, r, { fill = C.block, stroke = 'none', sw = 1 } = {}) =>
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

const ellipse = (cx, cy, rx, ry, { fill = C.block, stroke = 'none', sw = 1 } = {}) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

const poly = (pts, { fill = C.block, stroke = C.line, sw = 1 } = {}) =>
    `<polygon points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

// Largura aproximada de um texto (para dimensionar pílulas)
const tw = (s, size) => s.length * size * 0.56;

// Lugar de imagem: caixa com um X, o símbolo clássico de wireframe
function imgPh(x, y, w, h, label = '') {
    return [
        rect(x, y, w, h, { fill: C.block, stroke: C.line, r: 8 }),
        line(x, y, x + w, y + h, { stroke: C.block3 }),
        line(x + w, y, x, y + h, { stroke: C.block3 }),
        label ? rect(x + w / 2 - tw(label, 12) / 2 - 10, y + h / 2 - 13, tw(label, 12) + 20, 26, { fill: C.frame, r: 13 }) : '',
        label ? text(x + w / 2, y + h / 2 + 4, label, { size: 12, fill: C.mute, anchor: 'middle' }) : ''
    ].join('');
}

// Linhas de texto genérico (barras cinza); a última é mais curta
function bars(x, y, w, n, { gap = 16, h = 8 } = {}) {
    let out = '';
    for (let i = 0; i < n; i++) {
        const lw = i === n - 1 && n > 1 ? w * 0.62 : w;
        out += rect(x, y + i * gap, lw, h, { fill: C.block2, r: 4 });
    }
    return out;
}

function pill(x, y, label, { size = 13, h = 32, fill = C.frame, stroke = C.line, weight = 600, dot = false, color = C.ink } = {}) {
    const w = tw(label, size) + (dot ? 40 : 28);
    return {
        w,
        svg:
            rect(x, y, w, h, { fill, stroke, r: h / 2 }) +
            (dot ? circle(x + 15, y + h / 2, 4, { fill: C.dark }) : '') +
            text(x + (dot ? 26 : 14), y + h / 2 + size * 0.36, label, { size, weight, fill: color })
    };
}

// Etiqueta de objeto clicável no quarto (centrada no ponto)
function tag(cx, cy, label, size = 13) {
    const w = tw(label, size) + 40;
    return pill(cx - w / 2, cy - 16, label, { size, dot: true }).svg;
}

// Marcador numerado das anotações
const mark = (n, x, y) =>
    circle(x, y, 13, { fill: C.note }) + text(x, y + 4.5, String(n), { size: 13, weight: 700, fill: '#ffffff', anchor: 'middle' });

// ---------- Ícones simples ----------

const icon = {
    moon: (x, y) => `<path d="M${x + 6} ${y - 7}a8 8 0 1 0 8 10a6 6 0 0 1 -8 -10z" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`,
    list: (x, y) => [0, 6, 12].map((d) => line(x - 6, y - 6 + d, x + 7, y - 6 + d, { stroke: C.ink, sw: 1.6 })).join(''),
    cube: (x, y) => `<path d="M${x} ${y - 8}l7 4v8l-7 4l-7 -4v-8z M${x - 7} ${y - 4}l7 4l7 -4 M${x} ${y}v8" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`,
    close: (x, y) => line(x - 6, y - 6, x + 6, y + 6, { stroke: C.ink, sw: 1.8 }) + line(x + 6, y - 6, x - 6, y + 6, { stroke: C.ink, sw: 1.8 }),
    square: (x, y, s = 16) => rect(x - s / 2, y - s / 2, s, s, { fill: 'none', stroke: C.ink, sw: 1.5, r: 3 })
};

// ---------- Quarto em perspectiva isométrica ----------
// Mesmas medidas do quarto 3D (Room.jsx). x vai para a direita-frente, z para a esquerda-frente, y para cima.

function iso(o, x, y, z) {
    const tilt = o.tilt ?? 0.5;
    const ys = o.ys ?? 1;
    return [o.cx + (x - z) * 0.866 * o.s, o.cy + (x + z) * tilt * o.s - y * ys * o.s];
}

function isoBox(o, [x0, y0, z0], [x1, y1, z1], { top = C.block, side = C.block2, front = C.block3, stroke = C.line } = {}) {
    const P = (x, y, z) => iso(o, x, y, z);
    return [
        poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], { fill: side, stroke }),
        poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], { fill: front, stroke }),
        poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], { fill: top, stroke })
    ].join('');
}

// Retângulo desenhado sobre uma parede (x fixo = parede esquerda, z fixo = parede do fundo)
const onLeftWall = (o, x, y0, z0, y1, z1, opts) =>
    poly([iso(o, x, y0, z0), iso(o, x, y0, z1), iso(o, x, y1, z1), iso(o, x, y1, z0)], opts);
const onBackWall = (o, z, x0, y0, x1, y1, opts) =>
    poly([iso(o, x0, y0, z), iso(o, x1, y0, z), iso(o, x1, y1, z), iso(o, x0, y1, z)], opts);

function floorCircle(o, x, y, z, r, opts) {
    const [cx, cy] = iso(o, x, y, z);
    return ellipse(cx, cy, r * o.s * 1.2247, r * o.s * (o.tilt ?? 0.5) * 1.4142, opts);
}

// Desenha o quarto (mesmo layout do quarto 3D) e devolve as posições de tela de cada objeto
function room(o, { labels = true, compact = false } = {}) {
    const parts = [];
    const P = (x, y, z) => iso(o, x, y, z);
    const L = (a, b, opts) => line(a[0], a[1], b[0], b[1], opts);
    const dark = { top: C.dark, side: C.dark, front: '#3d3d3a' };

    // Piso e paredes
    parts.push(isoBox(o, [-5.3, -0.4, -5.3], [5.3, 0, 5.3], { top: '#f4f4f1', side: C.block2, front: C.block3 }));
    parts.push(isoBox(o, [-5.3, 0, -5.3], [-5.0, 5.6, 5.3], { top: C.block3, side: '#f7f7f5', front: C.block2 }));
    parts.push(isoBox(o, [-5.0, 0, -5.3], [5.3, 5.6, -5.0], { top: C.block3, side: C.block2, front: C.block }));

    // Tapete no chão
    parts.push(poly([P(-0.7, 0.01, -1.95), P(3.9, 0.01, -1.95), P(3.9, 0.01, 1.9), P(-0.7, 0.01, 1.9)], { fill: C.block, stroke: C.line }));

    // Parede da janela: janela com persiana e quatro pôsteres
    parts.push(onBackWall(o, -5.0, -2.5, 2.0, 0.3, 4.3, { fill: C.frame, stroke: C.dark, sw: 1.5 }));
    for (let y = 2.5; y < 4.25; y += 0.22) parts.push(L(P(-1.05, y, -5.0), P(0.25, y, -5.0), { stroke: C.line }));
    parts.push(L(P(-1.1, 2.0, -5.0), P(-1.1, 4.3, -5.0), { stroke: C.dark }));
    parts.push(onBackWall(o, -4.97, 0.6, 2.9, 1.32, 3.9, { fill: C.block3, stroke: C.dark }));
    for (const [x, y] of [[3.0, 4.15], [4.25, 4.15], [3.0, 2.7], [4.25, 2.7]]) {
        parts.push(onBackWall(o, -4.97, x - 0.5, y - 0.68, x + 0.5, y + 0.68, { fill: C.block3, stroke: C.dark }));
    }

    // Parede da mesa: painel de madeira e TV com light bar
    parts.push(onLeftWall(o, -4.86, 0.05, -4.85, 4.95, -0.75, { fill: '#ececea', stroke: C.line }));
    parts.push(onLeftWall(o, -4.75, 3.3, -4.1, 4.8, -1.5, { fill: C.dark, stroke: 'none' }));
    parts.push(L(P(-4.7, 4.88, -3.75), P(-4.7, 4.88, -1.85), { stroke: C.dark, sw: 3 }));

    // Porta e pôster do CS
    parts.push(onLeftWall(o, -4.93, 0, 0.0, 4.2, 1.75, { fill: C.block2, stroke: C.dark, sw: 1.5 }));
    const [hx, hy] = P(-4.9, 2.0, 1.5);
    parts.push(circle(hx, hy, Math.max(2, o.s * 0.06), { fill: C.dark }));

    // Nicho de prateleiras com a luminária "&", o porta-retrato e as pelúcias
    parts.push(onLeftWall(o, -4.99, 0, 2.3, 4.75, 4.95, { fill: C.block2, stroke: C.line }));
    parts.push(isoBox(o, [-5.0, 0, 2.26], [-4.24, 4.75, 2.33], { top: C.frame, side: C.frame, front: C.block }));
    for (const y of [0.25, 1.6, 2.85, 4.1]) parts.push(isoBox(o, [-5.0, y, 2.33], [-4.24, y + 0.07, 4.92], { top: C.frame, side: C.block, front: C.block }));
    parts.push(isoBox(o, [-5.0, 4.72, 2.26], [-4.24, 4.79, 4.99], { top: C.frame, side: C.block, front: C.block }));
    const [ax, ay] = P(-4.6, 3.35, 4.36);
    parts.push(text(ax, ay + o.s * 0.3, '&', { size: Math.round(o.s * 0.95), weight: 800, fill: C.dark, anchor: 'middle' }));
    parts.push(onLeftWall(o, -4.62, 1.67, 3.06, 2.55, 3.78, { fill: C.frame, stroke: C.dark, sw: 2 }));
    const [fx, fy] = P(-4.6, 2.2, 3.42);
    parts.push(circle(fx, fy, o.s * 0.13, { fill: C.block3 }));
    for (const z of [2.65, 3.3, 3.95, 4.55]) {
        const [px, py] = P(-4.6, 0.6, z);
        parts.push(circle(px, py, o.s * 0.2, { fill: C.block2, stroke: C.line }));
    }
    parts.push(isoBox(o, [-5.0, 0, 4.92], [-4.24, 4.75, 4.99], { top: C.frame, side: C.frame, front: C.block }));

    // Mesa, gaveteiro, gabinete, monitor e teclado
    parts.push(isoBox(o, [-4.86, 0, -4.55], [-3.4, 1.46, -4.47]));
    parts.push(isoBox(o, [-4.86, 1.46, -4.55], [-3.35, 1.56, -1.45], { top: C.block, side: C.block3, front: C.block3 }));
    parts.push(isoBox(o, [-4.86, 0, -1.55], [-2.75, 1.56, -0.45]));
    for (const y of [0.4, 0.78, 1.16]) parts.push(L(P(-2.75, y, -1.55), P(-2.75, y, -0.45), { stroke: C.line }));
    parts.push(isoBox(o, [-4.63, 1.56, -1.31], [-3.27, 3.34, -0.69], dark));
    parts.push(isoBox(o, [-4.42, 1.9, -4.0], [-4.34, 3.2, -1.7], dark));
    parts.push(onLeftWall(o, -4.33, 2.0, -3.9, 3.1, -1.8, { fill: '#6c6c66', stroke: 'none' }));
    parts.push(isoBox(o, [-4.14, 1.56, -3.57], [-3.66, 1.62, -2.32], { top: C.frame, side: C.block2, front: C.block2 }));

    // Cadeira
    parts.push(isoBox(o, [-2.9, 0.93, -3.3], [-2.0, 1.07, -2.4], { top: C.block2, side: C.block3, front: C.block3 }));
    parts.push(isoBox(o, [-2.05, 1.07, -3.3], [-1.9, 2.55, -2.4], { top: C.block2, side: C.block3, front: C.block3 }));
    parts.push(L(P(-2.45, 0.1, -2.85), P(-2.45, 0.93, -2.85), { stroke: C.dark, sw: Math.max(1.5, o.s * 0.06) }));

    // Cama com travesseiro e o celular em cima
    parts.push(isoBox(o, [-1.05, 0, -4.975], [4.95, 0.45, -2.025], { top: C.block2, side: C.dark, front: C.dark }));
    parts.push(isoBox(o, [-1.05, 0.45, -5.0], [4.0, 1.0, -1.95], { top: C.block, side: C.block2, front: C.block2 }));
    parts.push(isoBox(o, [4.0, 0.85, -4.65], [4.86, 1.15, -2.35], { top: C.frame, side: C.block, front: C.block }));
    parts.push(isoBox(o, [2.4, 1.0, -3.05], [2.7, 1.04, -2.45], dark));
    parts.push(isoBox(o, [4.95, 0, -4.95], [5.2, 2.3, -2.05], { top: C.block3, side: '#6c6c66', front: '#6c6c66' }));
    parts.push(isoBox(o, [4.1, 0, -1.95], [5.25, 1.45, -0.85], dark));
    parts.push(L(P(4.6, 1.45, -1.6), P(4.6, 2.1, -1.6), { stroke: C.dark, sw: Math.max(1.5, o.s * 0.05) }));
    parts.push(isoBox(o, [4.4, 2.0, -1.72], [4.65, 2.25, -1.48], { top: C.block2, side: C.block3, front: C.block3 }));

    // Mochila e bola de futevôlei
    parts.push(isoBox(o, [-0.8, 0, -1.55], [-0.35, 0.95, -0.9], dark));
    const [bx, by] = P(3.7, 0.4, 0.95);
    parts.push(circle(bx, by, o.s * 0.4, { fill: C.frame, stroke: C.dark, sw: 1.5 }));
    parts.push('<path d="M' + (bx - o.s * 0.38) + ' ' + by + 'q' + o.s * 0.38 + ' ' + -o.s * 0.3 + ' ' + o.s * 0.76 + ' 0" fill="none" stroke="' + C.line + '"/>');

    const at = {
        about: P(-4.35, 2.75, 1.95),
        experience: P(-4.8, 5.15, -2.8),
        projects: P(-3.7, 1.95, -2.85),
        contact: P(2.55, 1.9, -2.75),
        lamp: P(-4.6, 5.1, 4.36)
    };

    if (labels) {
        const size = compact ? 11 : 13;
        parts.push(tag(at.experience[0], at.experience[1], 'Experiências', size));
        if (!compact) parts.push(tag(at.lamp[0], at.lamp[1], 'Modo noite', size));
        parts.push(tag(at.projects[0], at.projects[1], 'Projetos', size));
        parts.push(tag(at.about[0], at.about[1], 'Sobre mim', size));
        parts.push(tag(at.contact[0], at.contact[1], 'Contato', size));
    }
    return { svg: parts.join(''), at };
}

// ---------- Partes da interface ----------

function topbarDesktop(W, { active = null, flat = false } = {}) {
    const out = [];
    if (flat) {
        out.push(rect(0, 0, W, 72, { fill: C.frame }));
        out.push(line(0, 72, W, 72));
    }
    out.push(rect(16, 14, 176, 44, { fill: C.frame, stroke: C.line, r: 22 }));
    out.push(circle(38, 36, 16, { fill: C.dark }));
    out.push(text(38, 40, '</>', { size: 10, weight: 700, fill: '#ffffff', anchor: 'middle' }));
    out.push(text(62, 41, 'Seu Nome', { size: 15, weight: 700 }));

    const items = ['Sobre mim', 'Projetos', 'Experiências', 'Contato'];
    const widths = items.map((s) => tw(s, 14) + 28);
    const navW = widths.reduce((a, b) => a + b, 0) + 8 + 4 * (items.length - 1);
    let x = W / 2 - navW / 2;
    out.push(rect(x, 14, navW, 44, { fill: C.frame, stroke: C.line, r: 22 }));
    x += 4;
    items.forEach((s, i) => {
        if (s === active) out.push(rect(x, 18, widths[i], 36, { fill: C.block2, r: 18 }));
        out.push(text(x + widths[i] / 2, 41, s, { size: 14, weight: 600, fill: s === active ? C.ink : C.mute, anchor: 'middle' }));
        x += widths[i] + 4;
    });

    const view = flat ? 'Ver em 3D' : 'Ver sem 3D';
    const vw = tw(view, 13) + 48;
    let tx = W - 16 - vw;
    out.push(rect(tx, 16, vw, 40, { fill: C.frame, stroke: C.line, r: 20 }));
    out.push((flat ? icon.cube : icon.list)(tx + 20, 36));
    out.push(text(tx + 36, 41, view, { size: 13, weight: 600 }));
    tx -= 48;
    out.push(circle(tx + 20, 36, 20, { fill: C.frame, stroke: C.line }));
    out.push(icon.moon(tx + 20, 36));
    tx -= 48;
    out.push(circle(tx + 20, 36, 20, { fill: C.frame, stroke: C.line }));
    out.push(text(tx + 20, 40.5, 'EN', { size: 12, weight: 600, anchor: 'middle' }));
    return { svg: out.join(''), navX: W / 2 - navW / 2, navW, toolsX: tx };
}

function topbarMobile(W) {
    const out = [];
    out.push(rect(12, 12, 150, 40, { fill: C.frame, stroke: C.line, r: 20 }));
    out.push(circle(32, 32, 14, { fill: C.dark }));
    out.push(text(32, 35.5, '</>', { size: 9, weight: 700, fill: '#ffffff', anchor: 'middle' }));
    out.push(text(54, 37, 'Seu Nome', { size: 14, weight: 700 }));
    let x = W - 12 - 40;
    for (const ic of ['list', 'moon', 'EN']) {
        out.push(circle(x + 20, 32, 20, { fill: C.frame, stroke: C.line }));
        if (ic === 'EN') out.push(text(x + 20, 36.5, 'EN', { size: 12, weight: 600, anchor: 'middle' }));
        else out.push(icon[ic](x + 20, 32));
        x -= 46;
    }
    return out.join('');
}

function tabbar(W, H, active) {
    const out = [rect(0, H - 64, W, 64, { fill: C.frame }), line(0, H - 64, W, H - 64)];
    const tabs = ['Sobre mim', 'Projetos', 'Experiências', 'Contato'];
    const tw4 = (W - 16) / 4;
    tabs.forEach((s, i) => {
        const x = 8 + i * tw4;
        if (s === active) out.push(rect(x + 2, H - 58, tw4 - 4, 52, { fill: C.block2, r: 12 }));
        out.push(icon.square(x + tw4 / 2, H - 40));
        out.push(text(x + tw4 / 2, H - 15, s, { size: 11, weight: 600, fill: s === active ? C.ink : C.mute, anchor: 'middle' }));
    });
    return out.join('');
}

function sectionHead(x, y, title, size = 22) {
    return rect(x, y, 40, 40, { fill: C.block2, r: 12 }) + icon.square(x + 20, y + 20, 14) + text(x + 54, y + 28, title, { size, weight: 700 });
}

function chips(x, y, labels, size = 12) {
    let out = '';
    let cx = x;
    for (const l of labels) {
        const p = pill(cx, y, l, { size, h: 26, fill: C.block, stroke: C.line, weight: 500 });
        out += p.svg;
        cx += p.w + 6;
    }
    return out;
}

function projectsPanel(x, y, w, h) {
    const out = [rect(x, y, w, h, { fill: C.frame, stroke: C.line, r: 22 })];
    const ix = x + 20;
    const iw = w - 40;
    out.push(circle(x + w - 34, y + 31, 20, { fill: C.frame, stroke: C.line }), icon.close(x + w - 34, y + 31));
    out.push(sectionHead(ix, y + 64, 'Projetos'));
    out.push(text(ix, y + 132, 'Do mais antigo ao mais recente.', { size: 14, fill: C.mute }));
    // Linha do tempo
    const tlx = ix + 6;
    out.push(line(tlx, y + 156, tlx, y + h - 16, { stroke: C.block3, sw: 2 }));
    let cy = y + 156;
    for (const [date, name] of [['mar 2024', 'Calculadora de Notas'], ['set 2024', 'Agenda de Estudos']]) {
        out.push(circle(tlx, cy + 8, 7, { fill: C.frame, stroke: C.dark, sw: 3 }));
        out.push(text(tlx + 22, cy + 13, date, { size: 12, fill: C.mute }));
        const cx = tlx + 22;
        const cw = iw - 28;
        const ch = 350;
        const visible = Math.min(ch, y + h - 12 - (cy + 26));
        out.push(`<g clip-path="url(#clip-${Math.round(cy)})">`);
        out.push(`<clipPath id="clip-${Math.round(cy)}"><rect x="${cx - 2}" y="${cy + 24}" width="${cw + 4}" height="${visible + 2}"/></clipPath>`);
        out.push(rect(cx, cy + 26, cw, ch, { fill: C.canvas, stroke: C.line, r: 16 }));
        out.push(imgPh(cx + 12, cy + 38, cw - 24, (cw - 24) * 0.5, 'GIF do projeto'));
        const ty = cy + 38 + (cw - 24) * 0.5 + 28;
        out.push(text(cx + 12, ty, name, { size: 17, weight: 700 }));
        out.push(bars(cx + 12, ty + 14, cw - 40, 2));
        out.push(chips(cx + 12, ty + 50, ['HTML', 'CSS', 'JavaScript'], 11));
        out.push(text(cx + 12, ty + 100, 'Ver no GitHub ↗', { size: 14, weight: 700, fill: C.dark }));
        out.push(line(cx + 12, ty + 104, cx + 120, ty + 104, { stroke: C.dark }));
        out.push('</g>');
        cy += ch + 40;
    }
    return out.join('');
}

function contactPanel(x, y, w, h) {
    const out = [rect(x, y, w, h, { fill: C.frame, stroke: C.line, r: 22 })];
    const ix = x + 20;
    const iw = w - 40;
    out.push(circle(x + w - 34, y + 31, 20, { fill: C.frame, stroke: C.line }), icon.close(x + w - 34, y + 31));
    out.push(sectionHead(ix, y + 64, 'Contato'));
    out.push(text(ix, y + 132, 'Escolha o canal que preferir ou mande uma mensagem.', { size: 14, fill: C.mute }));
    let cy = y + 150;
    for (const [label, value, act] of [['E-MAIL', 'seuemail@exemplo.com', 'copiar'], ['LINKEDIN', 'linkedin.com/in/seu-perfil', 'abrir'], ['GITHUB', 'github.com/seu-usuario', 'abrir'], ['INSTAGRAM', '@seu-perfil', 'abrir']]) {
        out.push(rect(ix, cy, iw, 58, { fill: C.canvas, stroke: C.line, r: 14 }));
        out.push(circle(ix + 30, cy + 29, 18, { fill: C.block2 }), icon.square(ix + 30, cy + 29, 13));
        out.push(text(ix + 58, cy + 24, label, { size: 10, weight: 600, fill: C.mute }));
        out.push(text(ix + 58, cy + 42, value, { size: 14, weight: 600 }));
        out.push(rect(ix + iw - 74, cy + 13, 62, 32, { fill: C.frame, stroke: C.line, r: 16 }));
        out.push(text(ix + iw - 43, cy + 33, act, { size: 12, weight: 600, anchor: 'middle' }));
        cy += 66;
    }
    cy += 14;
    for (const [label, hh] of [['Nome', 42], ['E-mail', 42], ['Mensagem', 96]]) {
        out.push(text(ix, cy + 14, label, { size: 14, weight: 600 }));
        out.push(rect(ix, cy + 22, iw, hh, { fill: C.canvas, stroke: C.line, r: 12 }));
        cy += hh + 36;
    }
    out.push(rect(ix, cy, 170, 44, { fill: C.dark, r: 22 }));
    out.push(text(ix + 85, cy + 27, 'Enviar mensagem', { size: 14, weight: 700, fill: '#ffffff', anchor: 'middle' }));
    return { svg: out.join(''), formY: cy - 186, channelsY: y + 150, buttonY: cy + 22 };
}

// Moldura com título e coluna de anotações
function board({ name, title, W, H, body, notes, out }) {
    const pad = 40;
    const head = 70;
    const notesW = 340;
    const totalW = pad + W + pad + notesW + pad;
    const noteHeights = notes.map((n) => 28 + wrap(n, 40).length * 20);
    const totalH = Math.max(head + H + pad, head + noteHeights.reduce((a, b) => a + b, 0) + pad);
    let ny = head + 6;
    const notesSvg = notes
        .map((n, i) => {
            const lines = wrap(n, 40);
            const s = mark(i + 1, pad + W + pad + 13, ny + 10) + lines.map((l, j) => text(pad + W + pad + 36, ny + 15 + j * 20, l, { size: 14, fill: C.ink })).join('');
            ny += noteHeights[i];
            return s;
        })
        .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
<title>${esc(title)}</title>
${rect(0, 0, totalW, totalH, { fill: C.canvas })}
${text(pad, 34, 'Portfólio 3D · Wireframe', { size: 12, weight: 600, fill: C.mute })}
${text(pad, 56, title, { size: 18, weight: 700 })}
${text(pad + W + pad, 56, 'Anotações', { size: 14, weight: 700, fill: C.mute })}
<g transform="translate(${pad} ${head})">
<clipPath id="frame"><rect width="${W}" height="${H}" rx="12"/></clipPath>
<g clip-path="url(#frame)">
${rect(0, 0, W, H, { fill: C.frame })}
${body}
</g>
${rect(0, 0, W, H, { fill: 'none', stroke: C.dark, sw: 1.5, r: 12 })}
${out || ''}
</g>
${notesSvg}
</svg>
`;
    writeFileSync(`${OUT}/${name}.svg`, svg);
    console.log(`${OUT}/${name}.svg`);
}

// Quebra um texto em linhas de até n caracteres
function wrap(s, n) {
    const words = s.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        if ((cur + ' ' + w).trim().length > n) {
            lines.push(cur.trim());
            cur = w;
        } else cur += ' ' + w;
    }
    if (cur.trim()) lines.push(cur.trim());
    return lines;
}

// ---------- Telas ----------

mkdirSync(OUT, { recursive: true });

// 01 · Computador: visão geral
{
    const W = 1440;
    const H = 900;
    const tb = topbarDesktop(W);
    const o = { cx: 720, cy: 590, s: 44 };
    const r = room(o);
    const hint = pill(16, H - 52, 'Arraste para girar · role para aproximar · clique nos objetos', { size: 12, h: 34, weight: 500, color: C.mute });
    const body = [rect(0, 0, W, H, { fill: '#f6f6f3' }), r.svg, tb.svg, hint.svg].join('');
    const marks = [
        mark(1, tb.navX - 18, 36),
        mark(2, tb.toolsX - 18, 36),
        mark(3, r.at.contact[0] + 64, r.at.contact[1] - 22),
        mark(4, r.at.lamp[0] + 76, r.at.lamp[1] - 20),
        mark(5, hint.w + 34, H - 35)
    ].join('');
    board({
        name: '01-computador-visao-geral',
        title: '01 · Visão geral do quarto (computador, 1440 × 900)',
        W, H, body, out: marks,
        notes: [
            'Menu fixo no topo. Cada item leva a câmera até o objeto da seção.',
            'Ferramentas: idioma (PT/EN), dia/noite e "Ver sem 3D".',
            'Objetos clicáveis com etiqueta: o porta-retrato do nicho abre Sobre mim, o monitor abre Projetos, a TV abre Experiências e o celular em cima da cama abre Contato.',
            'Atalho no próprio quarto: a luminária "&" do nicho troca entre dia e noite.',
            'Dica de uso no canto: arrastar para girar e rolar para aproximar.'
        ]
    });
}

// Close-up de frente do monitor (seção Projetos), com a TV em cima
function deskCloseUp(w, h) {
    const out = [rect(0, 0, w, h, { fill: '#ececea' })];
    const mx = w * 0.18;
    const my = h * 0.3;
    const mw = w * 0.52;
    const mh = h * 0.34;
    out.push(rect(mx - 20, -40, mw + 40, my - 30, { fill: C.dark, r: 6 }));
    out.push(rect(mx + 30, -10, mw - 60, my - 90, { fill: '#6c6c66' }));
    out.push(rect(0, h * 0.72, w, 30, { fill: C.block2, stroke: C.line }));
    out.push(rect(w * 0.42, my + mh, 22, h * 0.72 - my - mh, { fill: C.dark }));
    out.push(rect(mx, my, mw, mh, { fill: C.dark, r: 6 }));
    out.push(rect(mx + 10, my + 10, mw - 20, mh - 20, { fill: '#6c6c66' }));
    out.push(rect(w * 0.42 - 30, my - 18, 82, 20, { fill: C.dark, r: 6 }));
    for (let i = 0; i < 9; i++) {
        const lw = [0.5, 0.3, 0.62, 0.42, 0.55, 0.25, 0.48, 0.36, 0.2][i];
        out.push(rect(mx + 40 + (i % 3) * 20, my + 30 + i * 22, (mw - 120) * lw, 8, { fill: C.block3, r: 3 }));
    }
    out.push(rect(w * 0.22, h * 0.72 + 6, w * 0.6, 18, { fill: '#55554f', r: 4 }));
    out.push(rect(w * 0.3, h * 0.72 + 8, w * 0.24, 12, { fill: C.frame, stroke: C.line, r: 3 }));
    out.push(rect(w * 0.76, h * 0.72 - 54, 90, 56, { fill: C.block3, stroke: C.dark, r: 4 }));
    out.push(text(w * 0.76 + 45, h * 0.72 - 18, '12:36', { size: 22, weight: 700, fill: C.dark, anchor: 'middle' }));
    out.push(rect(w * 0.05, h * 0.72 + 4, 120, 22, { fill: C.dark, r: 4 }));
    return out.join('');
}

// 02 · Computador: seção Projetos aberta
{
    const W = 1440;
    const H = 900;
    const tb = topbarDesktop(W, { active: 'Projetos' });
    const px = W - 16 - 460;
    const body = [rect(0, 0, W, H, { fill: C.block }), deskCloseUp(px - 16, H), tb.svg, projectsPanel(px, 76, 460, H - 92)].join('');
    const marks = [
        mark(1, 360, 300),
        mark(2, px - 4, 112),
        mark(3, px + 26, 240),
        mark(4, px + 440, 460),
        mark(5, tb.navX + 150, 70)
    ].join('');
    board({
        name: '02-computador-projetos',
        title: '02 · Seção aberta: Projetos (computador)',
        W, H, body, out: marks,
        notes: [
            'A câmera voa até o monitor e desloca a imagem para a esquerda, para o objeto não ficar escondido atrás do painel.',
            'Painel lateral (até 460 px) com rolagem própria. O X, a tecla ESC ou um clique fora voltam ao quarto.',
            'Linha do tempo do projeto mais antigo ao mais recente.',
            'Cada projeto tem GIF dele funcionando, nome, descrição, tecnologias e link do GitHub.',
            'O item da seção aberta fica destacado no menu.'
        ]
    });
}

// Close-up do celular em cima da cama (seção Contato)
function phoneCloseUp(w, h) {
    const out = [rect(0, 0, w, h, { fill: '#f4f4f1' })];
    out.push(rect(-40, h * 0.18, w * 0.9, h * 0.9, { fill: C.block, stroke: C.line, r: 30 }));
    out.push('<clipPath id="quilt"><rect x="-40" y="' + h * 0.18 + '" width="' + w * 0.9 + '" height="' + h * 0.9 + '" rx="30"/></clipPath><g clip-path="url(#quilt)">');
    for (let d = -h; d < w; d += 60) {
        out.push(line(d, h * 0.18, d + h, h * 1.08, { stroke: C.block2 }));
        out.push(line(d + h, h * 0.18, d, h * 1.08, { stroke: C.block2 }));
    }
    out.push('</g>');
    out.push(rect(w * 0.82, h * 0.2, w * 0.3, h * 0.6, { fill: C.frame, stroke: C.line, r: 40 }));
    const cx = w * 0.45;
    const cy = h * 0.55;
    out.push('<g transform="rotate(-24 ' + cx + ' ' + cy + ')">');
    out.push(rect(cx - 70, cy - 140, 140, 280, { fill: C.dark, r: 16 }));
    out.push(rect(cx - 60, cy - 130, 120, 260, { fill: '#6c6c66', r: 10 }));
    out.push(text(cx, cy - 70, '12:36', { size: 24, weight: 700, fill: C.block, anchor: 'middle' }));
    for (let i = 0; i < 8; i++) out.push(rect(cx - 48 + (i % 4) * 26, cy + Math.floor(i / 4) * 32, 20, 20, { fill: C.block3, r: 5 }));
    out.push('</g>');
    return out.join('');
}

// 03 · Computador: seção Contato aberta
{
    const W = 1440;
    const H = 900;
    const tb = topbarDesktop(W, { active: 'Contato' });
    const px = W - 16 - 460;
    const cp = contactPanel(px, 76, 460, H - 92);
    const body = [rect(0, 0, W, H, { fill: '#f4f4f1' }), phoneCloseUp(px - 16, H), tb.svg, cp.svg].join('');
    const marks = [mark(1, 560, 330), mark(2, px - 4, cp.channelsY + 30), mark(3, px - 4, cp.formY + 80), mark(4, px + 200, cp.buttonY)].join('');
    board({
        name: '03-computador-contato',
        title: '03 · Seção aberta: Contato (computador)',
        W, H, body, out: marks,
        notes: [
            'A câmera vai até o celular em cima da cama.',
            'Ícones clicáveis: o e-mail tem botão de copiar; LinkedIn, GitHub e Instagram abrem em nova aba.',
            'Formulário com nome, e-mail e mensagem. Os campos são validados antes do envio, com a mensagem de erro embaixo de cada um.',
            'O envio é feito pelo EmailJS. Abaixo do botão aparece a confirmação ou o aviso de erro.'
        ]
    });
}

// 04 · Celular: visão geral
{
    const W = 390;
    const H = 844;
    const o = { cx: 195, cy: 420, s: 19, tilt: 0.68, ys: 0.85 };
    const r = room(o, { compact: true });
    const hintText = 'Arraste para girar · toque nos objetos';
    const hw = tw(hintText, 11) + 28;
    const hint = pill(W / 2 - hw / 2, H - 64 - 46, hintText, { size: 11, h: 32, weight: 500, color: C.mute });
    const body = [rect(0, 0, W, H, { fill: '#f6f6f3' }), r.svg, topbarMobile(W), hint.svg, tabbar(W, H, null)].join('');
    const marks = [mark(1, 34, 200), mark(2, W - 20, H - 80), mark(3, r.at.contact[0] + 58, r.at.contact[1] - 16), mark(4, W - 104, 66)].join('');
    board({
        name: '04-celular-visao-geral',
        title: '04 · Visão geral (celular, 390 × 844)',
        W, H, body, out: marks,
        notes: [
            'Em tela em pé a câmera fica mais alta e mais longe, para o quarto inteiro caber.',
            'O menu vira abas embaixo, ao alcance do polegar.',
            'Etiquetas menores. A luminária "&" fica sem etiqueta porque o botão de dia/noite já está no topo.',
            'No topo ficam o nome e as ferramentas; "Ver sem 3D" vira só um ícone.'
        ]
    });
}

// 05 · Celular: Sobre mim aberto
{
    const W = 390;
    const H = 844;
    const out = [rect(0, 0, W, H, { fill: C.block })];
    // Close-up do porta-retrato no alto
    out.push(rect(95, 92, 200, 230, { fill: C.dark, r: 4 }));
    out.push(rect(109, 106, 172, 202, { fill: C.frame }));
    out.push(circle(195, 190, 38, { fill: C.block3 }));
    out.push(ellipse(195, 300, 70, 46, { fill: C.block3 }));
    out.push(topbarMobile(W));
    // Folha de baixo
    const sy = H - 64 - 0.58 * H;
    out.push(rect(0, sy, W, H - sy, { fill: C.frame, stroke: C.line, r: 22 }));
    out.push(circle(W - 36, sy + 31, 20, { fill: C.frame, stroke: C.line }), icon.close(W - 36, sy + 31));
    out.push(sectionHead(16, sy + 62, 'Sobre mim', 20));
    out.push(rect(16, sy + 118, 56, 56, { fill: C.dark, r: 16 }));
    out.push(text(44, sy + 152, 'SN', { size: 16, weight: 700, fill: '#ffffff', anchor: 'middle' }));
    out.push(text(86, sy + 142, 'Seu Nome', { size: 17, weight: 700 }));
    out.push(text(86, sy + 162, 'Engenharia de Software · PUC Minas', { size: 12, fill: C.mute }));
    // Troca de idioma
    out.push(rect(16, sy + 188, 236, 36, { fill: C.canvas, stroke: C.line, r: 18 }));
    out.push(text(30, sy + 211, 'Ler em', { size: 12, fill: C.mute }));
    out.push(rect(78, sy + 192, 92, 28, { fill: C.dark, r: 14 }));
    out.push(text(124, sy + 211, 'Português', { size: 12, weight: 600, fill: '#ffffff', anchor: 'middle' }));
    out.push(text(210, sy + 211, 'English', { size: 12, weight: 600, anchor: 'middle' }));
    out.push(bars(16, sy + 244, W - 32, 4));
    out.push(text(16, sy + 332, 'INTERESSES', { size: 10, weight: 600, fill: C.mute }));
    out.push(chips(16, sy + 342, ['Front-end', 'APIs REST', '3D na web'], 11));
    out.push(tabbar(W, H, 'Sobre mim'));
    const marks = [mark(1, W - 20, sy + 90), mark(2, 320, 140), mark(3, 268, sy + 206), mark(4, 18, H - 64 - 14)].join('');
    board({
        name: '05-celular-sobre-mim',
        title: '05 · Seção aberta: Sobre mim (celular)',
        W, H, body: out.join(''), out: marks,
        notes: [
            'O conteúdo abre numa folha que sobe de baixo e ocupa 58% da altura, com rolagem própria.',
            'A câmera sobe o objeto (o porta-retrato) para a parte visível acima da folha.',
            'Botão Português/English dentro da própria seção, como pede o enunciado.',
            'A aba da seção aberta fica destacada.'
        ]
    });
}

// 06 · Computador: modo sem 3D
{
    const W = 1440;
    const H = 900;
    const tb = topbarDesktop(W, { flat: true });
    const cx = W / 2 - 360;
    const out = [rect(0, 0, W, H, { fill: '#f6f6f3' })];
    out.push(sectionHead(cx, 158, 'Sobre mim', 24));
    out.push(rect(cx, 216, 60, 60, { fill: C.dark, r: 18 }));
    out.push(text(cx + 30, 252, 'SN', { size: 18, weight: 700, fill: '#ffffff', anchor: 'middle' }));
    out.push(text(cx + 76, 242, 'Seu Nome', { size: 18, weight: 700 }));
    out.push(text(cx + 76, 264, 'Estudante de Engenharia de Software', { size: 14, fill: C.mute }));
    out.push(rect(cx, 292, 260, 36, { fill: C.canvas, stroke: C.line, r: 18 }));
    out.push(text(cx + 14, 315, 'Ler em', { size: 12, fill: C.mute }));
    out.push(rect(cx + 64, 296, 100, 28, { fill: C.dark, r: 14 }));
    out.push(text(cx + 114, 315, 'Português', { size: 12, weight: 600, fill: '#ffffff', anchor: 'middle' }));
    out.push(text(cx + 208, 315, 'English', { size: 12, weight: 600, anchor: 'middle' }));
    out.push(bars(cx, 350, 720, 5));
    out.push(chips(cx, 440, ['Front-end', 'APIs REST', '3D na web', 'UX'], 12));
    out.push(sectionHead(cx, 516, 'Projetos', 24));
    out.push(text(cx, 584, 'Do mais antigo ao mais recente.', { size: 14, fill: C.mute }));
    out.push(line(cx + 6, 606, cx + 6, H, { stroke: C.block3, sw: 2 }));
    out.push(circle(cx + 6, 614, 7, { fill: C.frame, stroke: C.dark, sw: 3 }));
    out.push(text(cx + 28, 619, 'mar 2024', { size: 12, fill: C.mute }));
    out.push(rect(cx + 28, 634, 692, 400, { fill: C.canvas, stroke: C.line, r: 16 }));
    out.push(imgPh(cx + 40, 646, 668, 300, 'GIF do projeto'));
    const body = [out.join(''), tb.svg].join('');
    const marks = [mark(1, cx - 26, 180), mark(2, tb.navX - 18, 36), mark(3, W - 92, 70), mark(4, cx + 746, 650)].join('');
    board({
        name: '06-computador-sem-3d',
        title: '06 · Modo sem 3D (computador)',
        W, H, body, out: marks,
        notes: [
            'As mesmas seções numa página comum, uma abaixo da outra, numa coluna de 720 px.',
            'O menu rola a página até a seção escolhida.',
            'Este modo liga sozinho se o navegador não tiver WebGL. O botão "Ver em 3D" volta para o quarto.',
            'Usa os mesmos componentes do painel do modo 3D, então o conteúdo nunca fica diferente.'
        ]
    });
}
