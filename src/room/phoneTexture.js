// Tela do celular em repouso (Contato): desenha no canvas a MESMA tela inicial da camada HTML
// (src/screens/PhoneScreen.jsx e phone.css), com as mesmas medidas em cqw (% da largura da tela),
// para a troca textura -> HTML não aparecer quando a câmera para em cima do celular.
//
// As cores: o desenho usa as cores do próprio HTML e, no fim, `undoToneMapping` faz a conta do
// tone mapping (ACES) ao contrário, pixel a pixel. Assim o papel de parede, os widgets, a foto e os
// ícones saem na tela 3D iguais ao HTML, sem calibrar cor por cor.
import * as THREE from 'three';

import { profile } from '../content/content';
import { APP_ART, APP_IDS, PHONE_WHITE, SQUIRCLE } from '../screens/AppIcons';
import { phoneMonth, phoneTime, phoneWeekday } from '../screens/phoneClock';

// Brilho da tela (Phone.jsx). A textura é calibrada para ele. Em 1, o branco mais claro que a tela
// mostra depois do ACES é cerca de #e2 (com 0,85, era #dd): o modo claro do iOS precisa do máximo
// possível sem passar de 1, onde o Bloom (luminanceThreshold 1, Scene.jsx) começaria a brilhar.
export const PHONE_SCREEN_DAY = 1;

// Altura da tela em cqw: a malha tem 0,27 x 0,57
const HEIGHT = (0.57 / 0.27) * 100;
// Mesma fonte do .phone-display
const FONT = "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

// Contorno de cantos arredondados (arcos de círculo, como o border-radius). Não começa um caminho
// novo: dá para juntar dois contornos e preencher só o anel entre eles ('evenodd').
function roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

// ---------- Tone mapping ao contrário ----------
// Na tela 3D a cor da textura é multiplicada pelo brilho (k) e passa pelo ACES do pós-processamento
// (Scene.jsx): cor / 0,6 -> matriz de entrada -> curva -> matriz de saída. Aqui o caminho é o inverso.
const ACES_IN = [
    [0.59719, 0.35458, 0.04823],
    [0.076, 0.90834, 0.01566],
    [0.0284, 0.13383, 0.83777]
];
const ACES_OUT = [
    [1.60475, -0.53108, -0.07367],
    [-0.10208, 1.10813, -0.00605],
    [-0.00327, -0.07276, 1.07602]
];

// Inversa de uma matriz 3 x 3, numa lista de 9 números (linha por linha)
function invert3([[a, b, c], [d, e, f], [g, h, i]]) {
    const A = e * i - f * h;
    const B = f * g - d * i;
    const C = d * h - e * g;
    const det = a * A + b * B + c * C;
    return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d].map((v) => v / det);
}
const IN_INV = invert3(ACES_IN);
const OUT_INV = invert3(ACES_OUT);

// sRGB (0-255) -> linear, por tabela
const TO_LINEAR = Float32Array.from({ length: 256 }, (_, i) => {
    const c = i / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
// linear -> sRGB (0-255), por tabela fina: a conta roda em centenas de milhares de pixels
const STEPS = 16384;
const TO_SRGB = Uint8Array.from({ length: STEPS + 1 }, (_, i) => {
    const c = i / STEPS;
    return Math.round(255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055));
});

// A curva do ACES é y = (x² + 0,0245786x − 0,000090537) / (0,983729x² + 0,432951x + 0,238081).
// Para voltar de y para x, isso vira uma equação do 2º grau em x (fica com a raiz positiva).
function curveInverse(y) {
    const v = Math.min(Math.max(y, 0), 1);
    const a = 1 - 0.983729 * v;
    const b = 0.0245786 - 0.432951 * v;
    const c = -0.000090537 - 0.238081 * v;
    return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

// Troca cada pixel pela cor que, depois do brilho k e do ACES, sai igual ao desenho.
// Cores que a tela não alcança (mais claras que ~#e2) ficam no máximo possível.
function undoToneMapping(data, k) {
    const s = 0.6 / k;
    const [o0, o1, o2, o3, o4, o5, o6, o7, o8] = OUT_INV;
    const [i0, i1, i2, i3, i4, i5, i6, i7, i8] = IN_INV;
    const toSRGB = (v) => TO_SRGB[Math.round(Math.min(Math.max(v, 0), 1) * STEPS)];
    for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3] === 0) continue;
        const r = TO_LINEAR[data[p]];
        const g = TO_LINEAR[data[p + 1]];
        const b = TO_LINEAR[data[p + 2]];
        // desfaz a matriz de saída e a curva
        const xr = curveInverse(o0 * r + o1 * g + o2 * b);
        const xg = curveInverse(o3 * r + o4 * g + o5 * b);
        const xb = curveInverse(o6 * r + o7 * g + o8 * b);
        // desfaz a matriz de entrada, o / 0,6 e o brilho
        data[p] = toSRGB(s * (i0 * xr + i1 * xg + i2 * xb));
        data[p + 1] = toSRGB(s * (i3 * xr + i4 * xg + i5 * xb));
        data[p + 2] = toSRGB(s * (i6 * xr + i7 * xg + i8 * xb));
    }
}

// ---------- A tela inicial ----------

// Cores do phone.css (modo claro do iOS), já dentro do que a tela 3D mostra
const INK = '#141417';
const SOFT = '#6c6c73';
const NOTE_INK = '#3a3a3f';
const RED = '#d8392f';
const NOTES = '#b88400';
const GLASS = 'rgba(232, 234, 240, 0.45)';
const GLASS_EDGE = 'rgba(240, 242, 248, 0.5)';
// Widgets (x, y, largura, altura, em cqw; raio 5,8), a pílula de busca e a dock, iguais ao phone.css
const RADIUS = 5.8;
const CONTACT = { x: 6.7, y: 16, w: 86.6, h: 40.5 };
const CAL = { x: 6.7, y: 61, w: 41.3, h: 41.3 };
const CLOCK = { x: 52, y: 61, w: 41.3, h: 41.3 };
const NOTE = { x: 6.7, y: 106.3, w: 86.6, h: 40.5 };
const SEARCH = { x: 34.5, y: 165.5, w: 31, h: 7.6, r: 3.8 };
const DOCK = { x: 4.2, y: 176.3, w: 91.6, h: 24.6, r: 10.2 };
// Ícones na dock: 16,5cqw, no meio de cada uma das 4 colunas, em y 180,35
const ICON = { size: 16.5, top: 180.35 };

export function phoneScreenTexture() {
    // O desenho é feito num canvas de trabalho, com as cores do HTML. A textura recebe os pixels já
    // convertidos (ImageData): o canvas nunca vai para a placa de vídeo e ler os pixels dele é rápido.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const texture = new THREE.Texture(new ImageData(1, 1));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;

    // Idioma e textos atuais (redraw), e a foto, que chega depois
    const state = { t: null, lang: 'pt', photo: null };
    const photo = new Image();
    photo.decoding = 'async';
    photo.onload = () => {
        state.photo = photo;
        requestDraw();
    };
    photo.src = profile.photo;

    // Tamanho: a largura em px que a tela vai ter na página (fit) vezes a densidade de pixels;
    // assim, com a câmera parada, cada pixel da textura cai num pixel da tela
    const resize = (width) => {
        canvas.width = width;
        canvas.height = Math.round((width * HEIGHT) / 100);
    };
    resize(512);
    // Largura da tela na página, em px (as sombras do canvas são em px)
    let pageW = 300;
    // A camada HTML tem largura e altura arredondadas para px inteiros (ScreenTracker), então o cqw
    // dela é um tiquinho diferente do da malha (274 px de largura contra 274,4, por exemplo). A
    // textura desenha na escala da camada (x e y, quase 1) e com a altura dela (`bottom`, em cqw),
    // para textos e ícones caírem no mesmo px na troca, do topo até a barrinha de início.
    const scale = { x: 1, y: 1, bottom: HEIGHT };
    const measure = () => {
        const html = Math.round(pageW);
        scale.x = html / pageW;
        // o canvas também tem altura inteira (578 linhas para 578,4 px de desenho)
        scale.y = (scale.x * canvas.height * 100) / (canvas.width * HEIGHT);
        scale.bottom = (Math.round((pageW * HEIGHT) / 100) * 100) / html;
    };

    // Texto com line-height: 1, a partir do topo da caixa (como no CSS). A linha de base fica abaixo
    // do topo a metade da sobra (line-height menos a altura da fonte) mais a subida (ascent) da fonte;
    // como no Chrome, a subida e a descida são px inteiros e a metade da sobra é arredondada para
    // baixo. Medidas em cqw; u = 1cqw em px. `x`: o centro (align 'center') ou a esquerda ('left').
    const text = (u, value, x, top, size, weight, color, align = 'center') => {
        ctx.font = `${weight} ${size * u}px ${FONT}`;
        const m = ctx.measureText(value);
        const ascent = Math.round(m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent);
        const descent = Math.round(m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent);
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(value, x * u, top * u + Math.floor((size * u - (ascent + descent)) / 2) + ascent);
        return m.width / u;
    };
    const textWidth = (u, value, size, weight) => {
        ctx.font = `${weight} ${size * u}px ${FONT}`;
        return ctx.measureText(value).width / u;
    };
    const box = (u, x, y, w, h, r, color) => {
        ctx.beginPath();
        roundRect(ctx, x * u, y * u, w * u, h * u, r * u);
        ctx.fillStyle = color;
        ctx.fill();
    };
    // Widget branco com a sombra leve (box-shadow: 0 0,8cqw 2,4cqw); a sombra do canvas é em px
    const widget = (u, { x, y, w, h }) => {
        ctx.save();
        ctx.shadowColor = 'rgba(40, 52, 80, 0.12)';
        ctx.shadowBlur = 2.4 * u * scale.y;
        ctx.shadowOffsetY = 0.8 * u * scale.y;
        box(u, x, y, w, h, RADIUS, PHONE_WHITE);
        ctx.restore();
    };

    // Começo de cada desenho: os cantos arredondados da malha (13cqw; fora deles a textura fica
    // transparente) e depois a escala da camada HTML
    const begin = (u) => {
        ctx.beginPath();
        roundRect(ctx, 0, 0, canvas.width, canvas.height, 13 * u);
        ctx.clip();
        ctx.scale(scale.x, scale.y);
    };

    // A tela inicial inteira: papel de parede, widgets, busca, dock, barra de status e a ilha
    const drawHome = (u, now) => {
        const { t, lang } = state;
        const c = t.contact;
        // o canvas inteiro, já na escala (com 1 px de folga)
        const W = canvas.width / scale.x + 1;
        const H = canvas.height / scale.y + 1;
        // Papel de parede claro: o degradê e os dois brilhos (as 3 camadas do background do .phone-display)
        const base = ctx.createLinearGradient(0, 0, 0, scale.bottom * u);
        [
            [0, '#cdd5e6'],
            [0.45, '#c4cde2'],
            [1, '#bcc5dc']
        ].forEach(([at, color]) => base.addColorStop(at, color));
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, W, H);
        const glow = (cx, cy, r, rgb, alpha) => {
            const g = ctx.createRadialGradient(cx * u, cy * u, 0, cx * u, cy * u, r * u);
            g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
            g.addColorStop(1, `rgba(${rgb}, 0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        };
        glow(12, 190, 90, '224, 198, 176', 0.55);
        glow(88, 40, 80, '214, 222, 240', 0.6);

        // Contato: foto redonda à esquerda, nome e duas linhas à direita
        widget(u, CONTACT);
        if (state.photo) {
            ctx.save();
            ctx.beginPath();
            ctx.arc((CONTACT.x + 17) * u, (CONTACT.y + 20.25) * u, 12.5 * u, 0, Math.PI * 2);
            ctx.clip();
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(state.photo, (CONTACT.x + 4.5) * u, (CONTACT.y + 7.75) * u, 25 * u, 25 * u);
            ctx.restore();
        }
        const tx = CONTACT.x + 34.8;
        text(u, profile.name, tx, CONTACT.y + 9, 5.2, 700, INK, 'left');
        text(u, c.cardLines[0], tx, CONTACT.y + 17, 3.3, 500, SOFT, 'left');
        text(u, c.cardLines[1], tx, CONTACT.y + 22.5, 3.3, 500, SOFT, 'left');

        // Calendário e relógio
        widget(u, CAL);
        text(u, phoneWeekday(now, lang), CAL.x + 4.5, CAL.y + 5, 3.2, 700, RED, 'left');
        text(u, String(now.getDate()), CAL.x + 4.5, CAL.y + 10, 15, 400, INK, 'left');
        text(u, phoneMonth(now, lang), CAL.x + 4.5, CAL.y + 32, 3.4, 500, SOFT, 'left');
        widget(u, CLOCK);
        text(u, c.clockCity, CLOCK.x + 4.5, CLOCK.y + 5, 3.2, 700, SOFT, 'left');
        text(u, phoneTime(now, lang), CLOCK.x + 4.5, CLOCK.y + 12, 12.5, 600, INK, 'left');
        text(u, c.today, CLOCK.x + 4.5, CLOCK.y + 32, 3.4, 500, SOFT, 'left');

        // Notas
        widget(u, NOTE);
        text(u, c.notesApp, NOTE.x + 4.5, NOTE.y + 4.5, 3.2, 700, NOTES, 'left');
        text(u, c.noteTitle, NOTE.x + 4.5, NOTE.y + 10.2, 4.6, 700, INK, 'left');
        c.noteLines.forEach((line, i) => text(u, line, NOTE.x + 4.5, NOTE.y + 18 + i * 5.5, 3.4, 400, NOTE_INK, 'left'));

        // Pílula de busca: a lupa e "Pesquisar", centrados juntos (flex com 1,3cqw entre eles)
        box(u, SEARCH.x, SEARCH.y, SEARCH.w, SEARCH.h, SEARCH.r, GLASS);
        const label = textWidth(u, c.search, 3.3, 500);
        const left = 50 - (3.2 + 1.3 + label) / 2;
        const k = (3.2 * u) / 24; // a lupa é um desenho de 24 x 24
        ctx.save();
        ctx.translate(left * u, (SEARCH.y + (SEARCH.h - 3.2) / 2) * u);
        ctx.scale(k, k);
        ctx.strokeStyle = SOFT;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(10.5, 10.5, 6.5, 0, Math.PI * 2);
        ctx.moveTo(15.5, 15.5);
        ctx.lineTo(20.5, 20.5);
        ctx.stroke();
        ctx.restore();
        text(u, c.search, left + 3.2 + 1.3, SEARCH.y + (SEARCH.h - 3.3) / 2, 3.3, 500, SOFT, 'left');

        // Dock de vidro com o brilho fino no contorno (box-shadow inset de 0,3cqw) e os 4 ícones
        box(u, DOCK.x, DOCK.y, DOCK.w, DOCK.h, DOCK.r, GLASS);
        const e = 0.3;
        ctx.beginPath();
        roundRect(ctx, DOCK.x * u, DOCK.y * u, DOCK.w * u, DOCK.h * u, DOCK.r * u);
        roundRect(ctx, (DOCK.x + e) * u, (DOCK.y + e) * u, (DOCK.w - 2 * e) * u, (DOCK.h - 2 * e) * u, (DOCK.r - e) * u);
        ctx.fillStyle = GLASS_EDGE;
        ctx.fill('evenodd');
        const column = DOCK.w / 4;
        APP_IDS.forEach((id, i) => {
            const center = DOCK.x + column * (i + 0.5);
            drawIcon(ctx, id, (center - ICON.size / 2) * u, ICON.top * u, ICON.size * u);
        });

        // Barra de status (hora no "ombro" esquerdo, ícones à direita), a ilha e a barrinha de início
        text(u, phoneTime(now, lang), 17.5, 4.85, 4.3, 600, INK);
        drawStatusIcons(ctx, 74.2 * u, 5.3 * u, u / 10, INK);
        box(u, 35, 2.6, 30, 8.8, 4.4, '#000');
        // a barrinha fica a 2,2cqw do pé da camada HTML
        box(u, 33, scale.bottom - 2.2 - 1.3, 34, 1.3, 0.65, INK);
    };

    // Converte o canvas inteiro e entrega para a textura
    const publish = () => {
        const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoToneMapping(image.data, PHONE_SCREEN_DAY);
        const current = texture.image;
        if (current.width === canvas.width && current.height === canvas.height) {
            current.data.set(image.data);
        } else {
            // tamanho novo (primeiro desenho ou fit): a textura antiga sai da placa de vídeo e é criada de novo
            texture.image = image;
            texture.dispose();
        }
        texture.needsUpdate = true;
    };

    // Desenho completo: ao abrir, quando muda o idioma ou o tamanho, quando a foto chega e a cada
    // minuto (a hora aparece na barra de status e nos widgets, então a tela toda é refeita)
    const draw = () => {
        const u = canvas.width / 100;
        measure();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        begin(u);
        drawHome(u, new Date());
        ctx.restore();
        publish();
    };

    // Pedido de desenho completo. Ao abrir o site, o Phone.jsx (idioma) e o Scene.jsx (tamanho)
    // pedem um desenho cada um, no mesmo instante: o microtask junta os dois pedidos num desenho só,
    // feito antes do próximo quadro (cada desenho converte centenas de milhares de pixels).
    let queued = false;
    const requestDraw = () => {
        if (queued) return;
        queued = true;
        queueMicrotask(() => {
            queued = false;
            if (state.t) draw();
        });
    };

    // Phone.jsx chama ao montar e quando o idioma muda, e a cada minuto (tick)
    texture.userData.redraw = (t, lang) => {
        state.t = t;
        state.lang = lang;
        requestDraw();
    };
    texture.userData.tick = requestDraw;
    // Chamado pelo Scene.jsx com a largura (px) que a tela vai ter na página com a câmera parada
    texture.userData.fit = (width) => {
        if (!(width > 0)) return;
        const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);
        const size = THREE.MathUtils.clamp(Math.round(width * dpr), 128, 1024);
        if (size === canvas.width && Math.abs(width - pageW) < 0.5) return;
        pageW = width;
        if (size !== canvas.width) resize(size);
        requestDraw();
    };
    return texture;
}

// Ícone de um app (AppIcons.jsx): o contorno contínuo com o fundo em degradê e o logo por cima.
// Os desenhos são os mesmos do SVG (caixa de 100 x 100), com Path2D.
function drawIcon(ctx, id, x, y, size) {
    const { background: bg, logo } = APP_ART[id];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);
    const fill =
        bg.type === 'linear'
            ? ctx.createLinearGradient(0, 0, 0, 100)
            : ctx.createRadialGradient(bg.center[0] * 100, bg.center[1] * 100, 0, bg.center[0] * 100, bg.center[1] * 100, bg.radius * 100);
    bg.stops.forEach(([at, c]) => fill.addColorStop(at, c));
    ctx.fillStyle = fill;
    ctx.fill(new Path2D(SQUIRCLE));
    if (logo.scale) {
        ctx.translate(logo.offset[0], logo.offset[1]);
        ctx.scale(logo.scale, logo.scale);
    }
    if (logo.fill) {
        ctx.fillStyle = logo.fill;
        logo.paths?.forEach((d) => ctx.fill(new Path2D(d)));
        logo.circles?.forEach(({ cx, cy, r }) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    if (logo.stroke) {
        ctx.strokeStyle = logo.stroke;
        ctx.lineWidth = logo.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        logo.strokes.forEach((d) => ctx.stroke(new Path2D(d)));
    }
    ctx.restore();
}

// Sinal, Wi-Fi e bateria (StatusIcons, em PhoneScreen.jsx): caixa de 166 x 34, 10 unidades = 1cqw
function drawStatusIcons(ctx, x, y, scale, color) {
    const rect = (rx, ry, w, h, r) => {
        ctx.beginPath();
        roundRect(ctx, rx, ry, w, h, r);
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    // sinal: 4 barras crescendo
    [10.5, 15.5, 21, 26.5].forEach((h, i) => {
        rect(2 + i * 13.4, 30 - h, 9, h, 2.5);
        ctx.fill();
    });
    // Wi-Fi: 3 faixas de um setor de 90° apontando para cima, com centro em (76; 30,5)
    const deg = Math.PI / 180;
    [
        [0, 8.5],
        [11.5, 18],
        [21, 27.5]
    ].forEach(([r1, r2]) => {
        ctx.beginPath();
        ctx.arc(76, 30.5, r2, 225 * deg, 315 * deg);
        if (r1 > 0) ctx.arc(76, 30.5, r1, 315 * deg, 225 * deg, true);
        else ctx.lineTo(76, 30.5);
        ctx.closePath();
        ctx.fill();
    });
    // bateria: contorno e ponta apagados, nível cheio
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2.4;
    rect(107.2, 6.7, 49.6, 21.6, 6.6);
    ctx.stroke();
    rect(160.4, 13.5, 3.8, 7.6, 1.9);
    ctx.fill();
    ctx.globalAlpha = 1;
    rect(110.6, 10.1, 36, 14.8, 3.8);
    ctx.fill();
    ctx.restore();
}
