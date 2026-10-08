// Tela do celular em repouso (Contato): desenha no canvas a MESMA tela inicial da camada HTML
// (src/screens/PhoneScreen.jsx e phone.css), com as mesmas medidas em cqw (% da largura da tela),
// para a troca textura -> HTML não aparecer quando a câmera para em cima do celular.
//
// As cores: o desenho usa as cores do próprio HTML e, no fim, `undoToneMapping` faz a conta do
// tone mapping (ACES) ao contrário, pixel a pixel. Assim o papel de parede, o vidro, a foto e os
// ícones saem na tela 3D iguais ao HTML, sem calibrar cor por cor.
import * as THREE from 'three';

import { channels, profile } from '../content';
import { APP_ART, APP_IDS, PHONE_WHITE, SQUIRCLE } from '../screens/AppIcons';
import { phoneDate, phoneTime } from '../screens/phoneClock';

// Brilho da tela de dia (Phone.jsx). A textura é calibrada para ele.
export const PHONE_SCREEN_DAY = 0.85;

// Altura da tela em cqw: a malha tem 0,27 x 0,57
const HEIGHT = (0.57 / 0.27) * 100;
// Mesma fonte do .phone-display
const FONT = "-apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
// Texto suave (--ph-soft)
const SOFT = '#c9c1c6';
// Cartão de vidro (.phone-card): esquerda, topo, largura, altura e raio, em cqw
const CARD = { x: 9, y: 76, w: 82, h: 52, r: 8 };

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
// Cores que a tela não alcança (mais claras que ~#ddd) ficam no máximo possível.
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

// saturate() do CSS (o backdrop-filter do cartão de vidro), nas cores sRGB
function saturate(image, amount) {
    const d = image.data;
    const s = amount;
    const m = [
        0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
        0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
        0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s
    ];
    for (let p = 0; p < d.length; p += 4) {
        const r = d[p];
        const g = d[p + 1];
        const b = d[p + 2];
        d[p] = m[0] * r + m[1] * g + m[2] * b;
        d[p + 1] = m[3] * r + m[4] * g + m[5] * b;
        d[p + 2] = m[6] * r + m[7] * g + m[8] * b;
    }
    return image;
}

// ---------- A tela inicial ----------

// Faixa de cima (barra de status, data e hora), em cqw: é a única parte que muda a cada minuto
const CLOCK_BAND = 50;

export function phoneScreenTexture() {
    // O desenho é feito num canvas de trabalho, com as cores do HTML. A textura recebe os pixels já
    // convertidos (ImageData): o canvas nunca vai para a placa de vídeo e ler os pixels dele é rápido.
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // pedaço do cartão para o "vidro" (fundo saturado); também na memória do processador, senão
    // desenhá-lo no canvas de trabalho faria o navegador esperar a placa de vídeo
    const glass = document.createElement('canvas');
    const glassCtx = glass.getContext('2d', { willReadFrequently: true });
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
    // Largura da tela na página, em px. Quase tudo é em cqw, mas os apps herdam do .apps
    // (styles.css) o espaço de 8px entre eles e a sombra em px: a textura faz igual.
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
    // baixo. Medidas em cqw; u = 1cqw em px.
    const text = (u, value, x, top, size, weight, color) => {
        ctx.font = `${weight} ${size * u}px ${FONT}`;
        const m = ctx.measureText(value);
        const ascent = Math.round(m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent);
        const descent = Math.round(m.fontBoundingBoxDescent ?? m.actualBoundingBoxDescent);
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(value, x * u, top * u + Math.floor((size * u - (ascent + descent)) / 2) + ascent);
    };
    const box = (u, x, y, w, h, r, color) => {
        ctx.beginPath();
        roundRect(ctx, x * u, y * u, w * u, h * u, r * u);
        ctx.fillStyle = color;
        ctx.fill();
    };

    // Começo de cada desenho: os cantos arredondados da malha (13cqw; fora deles a textura fica
    // transparente) e depois a escala da camada HTML
    const begin = (u) => {
        ctx.beginPath();
        roundRect(ctx, 0, 0, canvas.width, canvas.height, 13 * u);
        ctx.clip();
        ctx.scale(scale.x, scale.y);
    };

    // Papel de parede, data, hora, barra de status e a ilha: tudo o que fica na faixa de cima
    const drawTop = (u, now) => {
        // o canvas inteiro, já na escala (com 1 px de folga)
        const W = canvas.width / scale.x + 1;
        const H = canvas.height / scale.y + 1;
        // Papel de parede: degradê de ameixa para marrom, o tom da madeira embaixo à esquerda e o
        // rosa do RGB em cima à direita (as 3 camadas do background do .phone-display)
        const base = ctx.createLinearGradient(0, 0, 0, scale.bottom * u);
        [[0, '#2a1230'], [0.4, '#4b1d4a'], [0.72, '#6a3346'], [1, '#6e4630']].forEach(([at, c]) => base.addColorStop(at, c));
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, W, H);
        const glow = (cx, cy, r, rgb, alpha) => {
            const g = ctx.createRadialGradient(cx * u, cy * u, 0, cx * u, cy * u, r * u);
            g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
            g.addColorStop(1, `rgba(${rgb}, 0)`);
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        };
        glow(4, 196, 96, '201, 150, 100', 0.7);
        glow(92, 62, 78, '231, 117, 204', 0.62);

        // data e hora grande, como na tela bloqueada
        text(u, phoneDate(now, state.lang), 50, 18, 4.6, 600, PHONE_WHITE);
        text(u, phoneTime(now, state.lang), 50, 24, 24, 700, PHONE_WHITE);
        // barra de status: hora no "ombro" esquerdo e os ícones à direita; e a Dynamic Island
        text(u, phoneTime(now, state.lang), 17.5, 4.85, 4.3, 600, PHONE_WHITE);
        drawStatusIcons(ctx, 74.2 * u, 5.3 * u, u / 10);
        box(u, 35, 2.6, 30, 8.8, 4.4, '#000');
    };

    // Cartão de vidro com a foto, os apps e a barrinha de início
    const drawRest = (u) => {
        const { t } = state;
        // 1) o fundo do cartão é o papel de parede mais saturado (backdrop-filter; o desfoque quase
        // não muda um degradê suave, então fica de fora). É pego antes da sombra, em px do canvas.
        const gx = Math.floor(CARD.x * u * scale.x);
        const gy = Math.floor(CARD.y * u * scale.y);
        glass.width = Math.ceil((CARD.x + CARD.w) * u * scale.x) - gx;
        glass.height = Math.ceil((CARD.y + CARD.h) * u * scale.y) - gy;
        glassCtx.putImageData(saturate(ctx.getImageData(gx, gy, glass.width, glass.height), 1.4), 0, 0);
        // 2) a sombra (box-shadow: 0 2cqw 6cqw). O cartão é desenhado longe, fora do canvas, e só a
        // sombra é deslocada para o lugar; a parte de dentro é coberta pelo vidro em seguida.
        // (A sombra do canvas é medida em px do canvas: não segue a escala.)
        ctx.save();
        ctx.shadowColor = 'rgba(24, 6, 22, 0.3)';
        ctx.shadowBlur = 6 * u * scale.y;
        ctx.shadowOffsetX = 200 * u * scale.x;
        ctx.shadowOffsetY = 2 * u * scale.y;
        box(u, CARD.x - 200, CARD.y, CARD.w, CARD.h, CARD.r, '#000');
        ctx.restore();
        // 3) o vidro: fundo saturado, branco a 12% por cima e o brilho fino da borda
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, CARD.x * u, CARD.y * u, CARD.w * u, CARD.h * u, CARD.r * u);
        ctx.clip();
        // o pedaço volta para os mesmos px do canvas de onde saiu (sem a escala)
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(glass, gx, gy);
        ctx.restore();
        box(u, CARD.x, CARD.y, CARD.w, CARD.h, CARD.r, 'rgba(255, 255, 255, 0.12)');
        const edge = ctx.createLinearGradient(0, CARD.y * u, 0, (CARD.y + CARD.h) * u);
        edge.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        edge.addColorStop(0.45, 'rgba(255, 255, 255, 0.07)');
        edge.addColorStop(1, 'rgba(255, 255, 255, 0.22)');
        const e = 0.45; // espessura do brilho (padding do ::before)
        ctx.beginPath();
        roundRect(ctx, CARD.x * u, CARD.y * u, CARD.w * u, CARD.h * u, CARD.r * u);
        roundRect(ctx, (CARD.x + e) * u, (CARD.y + e) * u, (CARD.w - 2 * e) * u, (CARD.h - 2 * e) * u, (CARD.r - e) * u);
        ctx.fillStyle = edge;
        ctx.fill('evenodd');

        // Foto redonda (diâmetro 24cqw, centro em 50, 94) com um anel fino por fora
        const ring = (r) => {
            ctx.moveTo((50 + r) * u, 94 * u);
            ctx.arc(50 * u, 94 * u, r * u, 0, Math.PI * 2);
        };
        ctx.beginPath();
        ring(12.6);
        ring(12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fill('evenodd');
        if (state.photo) {
            ctx.save();
            ctx.beginPath();
            ring(12);
            ctx.clip();
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(state.photo, 38 * u, 82 * u, 24 * u, 24 * u);
            ctx.restore();
        }
        text(u, profile.name, 50, 110, 5.6, 700, PHONE_WHITE);
        text(u, t.contact.cardRole, 50, 118, 3.6, 500, SOFT);

        // Apps: 4 colunas iguais de 6,333cqw a 93,667cqw, com 8px entre elas, e o ícone (16,5cqw)
        // no meio de cada uma. A sombra do ícone (drop-shadow: 0 6px 10px) também é em px.
        const px = canvas.width / pageW; // 1px da página em px do canvas
        const gap = 800 / Math.round(pageW); // 8px em cqw da camada HTML
        const column = (87.333 - 3 * gap) / 4;
        APP_IDS.forEach((id, i) => {
            const center = 6.333 + i * (column + gap) + column / 2;
            drawIcon(ctx, id, (center - 8.25) * u, 158 * u, 16.5 * u, { blur: 10 * px, y: 6 * px });
            const name = id === 'email' ? t.contact.mailApp : channels.find((c) => c.id === id).label;
            text(u, name, center, 176.5, 3.2, 500, PHONE_WHITE);
        });
        // a barrinha fica a 2,2cqw do pé da camada HTML
        box(u, 33, scale.bottom - 2.2 - 1.3, 34, 1.3, 0.65, PHONE_WHITE);
    };

    // Lê os pixels de uma faixa do canvas (do topo até `rows`), converte e entrega para a textura
    const publish = (rows) => {
        const band = ctx.getImageData(0, 0, canvas.width, rows);
        undoToneMapping(band.data, PHONE_SCREEN_DAY);
        const image = texture.image;
        if (image.width === canvas.width && image.height === canvas.height) {
            image.data.set(band.data);
        } else {
            // tamanho novo (primeiro desenho ou fit): a textura antiga sai da placa de vídeo e é criada de novo
            texture.image = band;
            texture.dispose();
        }
        texture.needsUpdate = true;
    };

    // Desenho completo: ao abrir, quando muda o idioma ou o tamanho e quando a foto chega
    const draw = () => {
        const u = canvas.width / 100;
        measure();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        begin(u);
        drawTop(u, new Date());
        drawRest(u);
        ctx.restore();
        publish(canvas.height);
    };

    // A cada minuto: só a faixa de cima é desenhada e convertida de novo
    const tick = () => {
        const u = canvas.width / 100;
        const rows = Math.min(Math.ceil(CLOCK_BAND * u), canvas.height);
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, rows);
        ctx.clip();
        ctx.clearRect(0, 0, canvas.width, rows);
        begin(u);
        drawTop(u, new Date());
        ctx.restore();
        publish(rows);
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

    // Phone.jsx chama ao montar e quando o idioma muda (desenho completo) e a cada minuto (tick)
    texture.userData.redraw = (t, lang) => {
        state.t = t;
        state.lang = lang;
        requestDraw();
    };
    texture.userData.tick = () => {
        if (!state.t) return;
        // a textura ainda não tem o desenho completo neste tamanho: desenha tudo, não só a faixa
        const { image } = texture;
        if (image.width !== canvas.width || image.height !== canvas.height) draw();
        else tick();
    };
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
// Os desenhos são os mesmos do SVG (caixa de 100 x 100), com Path2D. `shadow`: a sombra embaixo
// do contorno (blur e deslocamento em px da textura; a sombra do canvas não segue o scale).
function drawIcon(ctx, id, x, y, size, shadow) {
    const { background: bg, logo } = APP_ART[id];
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size / 100, size / 100);
    ctx.save();
    ctx.shadowColor = 'rgba(40, 20, 30, 0.18)';
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetY = shadow.y;
    const fill =
        bg.type === 'linear'
            ? ctx.createLinearGradient(0, 0, 0, 100)
            : ctx.createRadialGradient(bg.center[0] * 100, bg.center[1] * 100, 0, bg.center[0] * 100, bg.center[1] * 100, bg.radius * 100);
    bg.stops.forEach(([at, c]) => fill.addColorStop(at, c));
    ctx.fillStyle = fill;
    ctx.fill(new Path2D(SQUIRCLE));
    ctx.restore();
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
function drawStatusIcons(ctx, x, y, scale) {
    const rect = (rx, ry, w, h, r) => {
        ctx.beginPath();
        roundRect(ctx, rx, ry, w, h, r);
    };
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = PHONE_WHITE;
    ctx.strokeStyle = PHONE_WHITE;
    // sinal: 4 barras crescendo
    [10.5, 15.5, 21, 26.5].forEach((h, i) => {
        rect(2 + i * 13.4, 30 - h, 9, h, 2.5);
        ctx.fill();
    });
    // Wi-Fi: 3 faixas de um setor de 90° apontando para cima, com centro em (76; 30,5)
    const deg = Math.PI / 180;
    [[0, 8.5], [11.5, 18], [21, 27.5]].forEach(([r1, r2]) => {
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
