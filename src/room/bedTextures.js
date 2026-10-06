// Texturas da área da cama, desenhadas em <canvas> como as de src/textures.js:
// madeiras da cabeceira e do criado-mudo, matelassê, travesseiros, almofada, tapete, creatina e o cordão.
import * as THREE from 'three';

// `data`: textura que não é cor (máscara do pelo), então fica sem conversão sRGB
function canvasTexture(width, height, draw, { repeat, data = false } = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    if (repeat) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(...repeat);
    }
    return texture;
}

// Gerador pseudoaleatório com semente, para o desenho ser sempre igual
function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// Fios curtos espalhados em direções aleatórias (pelúcia, tapete)
function fibers(ctx, w, h, rand, { count, length, colors, width = 1 }) {
    ctx.lineWidth = width;
    for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const a = rand() * Math.PI * 2;
        const l = length * (0.5 + rand());
        ctx.strokeStyle = colors[Math.floor(rand() * colors.length)];
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
        ctx.stroke();
    }
}

// Madeira com veios horizontais que se repetem sem emenda; `vertical` gira a textura
function woodTexture({ base, dark, light, seed, repeat = [1, 1], vertical = false }) {
    const texture = canvasTexture(
        512,
        512,
        (ctx, w, h) => {
            const rand = seeded(seed);
            ctx.fillStyle = base;
            ctx.fillRect(0, 0, w, h);
            // faixas largas de tom (a "figura" da madeira)
            for (let i = 0; i < 16; i++) {
                const y = rand() * h;
                const band = 12 + rand() * 46;
                ctx.globalAlpha = 0.07 + rand() * 0.1;
                ctx.fillStyle = rand() > 0.5 ? dark : light;
                ctx.fillRect(0, y, w, band);
            }
            // veios finos e ondulados
            for (let i = 0; i < 120; i++) {
                const pos = rand() * h;
                const amp = 1.5 + rand() * 5;
                const freq = ((Math.PI * 2) / w) * (1 + Math.floor(rand() * 4));
                const phase = rand() * 10;
                ctx.strokeStyle = rand() > 0.45 ? dark : light;
                ctx.globalAlpha = 0.14 + rand() * 0.3;
                ctx.lineWidth = 0.5 + rand() * 1.6;
                ctx.beginPath();
                for (let x = 0; x <= w; x += 8) ctx.lineTo(x, pos + Math.sin(x * freq + phase) * amp);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        },
        { repeat }
    );
    if (vertical) {
        texture.center.set(0.5, 0.5);
        texture.rotation = Math.PI / 2;
    }
    return texture;
}

// Mogno da cabeceira e da cama: marrom nogueira médio, só um pouco avermelhado
export function mahoganyTexture(options) {
    return woodTexture({ base: '#765340', dark: '#4a3024', light: '#9c765e', seed: 23, ...options });
}

// Teca alaranjada das gavetas e da base do criado-mudo
export function teakTexture(options) {
    return woodTexture({ base: '#b8692c', dark: '#7f3f16', light: '#dc9550', seed: 41, ...options });
}

// Um gomo do matelassê: a malha da cama usa uv em diagonal, então cada repetição vira um losango
export function quiltTexture() {
    return canvasTexture(
        256,
        256,
        (ctx, w, h) => {
            const rand = seeded(5);
            const g = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w * 0.72);
            // cinza-claro frio, puxando de leve para o lilás (a luz do quarto é quente, então o azul
            // da textura compensa e o pano aparece cinza frio na tela)
            g.addColorStop(0, '#d4d5e4');
            g.addColorStop(0.7, '#cacada');
            g.addColorStop(1, '#b5b2c3');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            // trama do tecido
            for (let i = 0; i < 3000; i++) {
                ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(84,80,86,0.06)';
                ctx.fillRect(rand() * w, rand() * h, 2 + rand() * 3, 1);
            }
            // pesponto tracejado na costura
            ctx.strokeStyle = 'rgba(120,116,112,0.7)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 7]);
            ctx.strokeRect(0, 0, w, h);
        },
        { repeat: [1, 1] }
    );
}

// Fronha lisa com vincos leves e o vivo claro na costura (fica na borda do travesseiro)
export function pillowTexture(color, seed = 3) {
    return canvasTexture(256, 256, (ctx, w, h) => {
        const rand = seeded(seed);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, w, h);
        ctx.lineCap = 'round';
        for (let i = 0; i < 10; i++) {
            const x = rand() * w;
            const y = rand() * h;
            const a = rand() * Math.PI;
            const l = 30 + rand() * 90;
            ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(60,45,40,0.04)';
            ctx.lineWidth = 10 + rand() * 16;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(250,248,244,0.95)';
        ctx.lineWidth = 7;
        ctx.strokeRect(4, 4, w - 8, h - 8);
    });
}

// Almofada cinza felpuda com um escudo genérico: círculo branco com listras pretas e brancas
export function cushionTexture() {
    return canvasTexture(512, 512, (ctx, w, h) => {
        const rand = seeded(29);
        ctx.fillStyle = '#6c6e72';
        ctx.fillRect(0, 0, w, h);
        fibers(ctx, w, h, rand, { count: 9000, length: 7, colors: ['rgba(160,162,166,0.4)', 'rgba(52,54,58,0.4)'] });

        // estrelinhas de quatro pontas espalhadas no tecido
        ctx.strokeStyle = 'rgba(205,207,210,0.7)';
        ctx.lineWidth = 3;
        [
            [90, 92, 26],
            [420, 110, 22],
            [70, 400, 22],
            [430, 420, 28],
            [256, 452, 16]
        ].forEach(([x, y, s]) => {
            ctx.beginPath();
            ctx.moveTo(x, y - s);
            ctx.quadraticCurveTo(x, y, x + s, y);
            ctx.quadraticCurveTo(x, y, x, y + s);
            ctx.quadraticCurveTo(x, y, x - s, y);
            ctx.quadraticCurveTo(x, y, x, y - s);
            ctx.stroke();
        });

        // escudo: listras dentro do círculo e o aro branco
        const cx = w / 2;
        const cy = h / 2 - 6;
        const r = 150;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i * 26 < 2 * r; i++) {
            ctx.fillStyle = i % 2 ? '#dcdbd8' : '#3a3b3f';
            ctx.fillRect(cx - r, cy - r + i * 26, 2 * r, 26);
        }
        fibers(ctx, w, h, rand, { count: 6000, length: 7, colors: ['rgba(120,122,126,0.45)', 'rgba(200,200,200,0.3)'] });
        ctx.restore();
        ctx.strokeStyle = '#f1f0ed';
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
    });
}

// Pacote de creatina em pé: saco escuro com a faixa turquesa e o nome na vertical
export function creatineTexture() {
    return canvasTexture(256, 384, (ctx, w, h) => {
        const rand = seeded(13);
        ctx.fillStyle = '#26292c';
        ctx.fillRect(0, 0, w, h);
        // vincos do plástico
        for (let i = 0; i < 40; i++) {
            ctx.strokeStyle = `rgba(255,255,255,${0.03 + rand() * 0.06})`;
            ctx.lineWidth = 1 + rand() * 3;
            const x = rand() * w;
            ctx.beginPath();
            ctx.moveTo(x, rand() * h);
            ctx.lineTo(x + (rand() - 0.5) * 60, rand() * h);
            ctx.stroke();
        }
        // faixa turquesa com o nome lido de baixo para cima
        ctx.fillStyle = '#18a5a6';
        ctx.fillRect(132, 44, 76, h - 44);
        ctx.save();
        ctx.translate(176, h - 22);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 50px system-ui, sans-serif';
        ctx.fillText('CREATINA', 0, 0);
        ctx.restore();
        // letras miúdas e o selo, só como manchas brancas
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 6; i++) ctx.fillRect(220, 70 + i * 16, 22 - (i % 3) * 5, 6);
        ctx.fillRect(220, h - 46, 24, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 5; i++) ctx.fillRect(26, 150 + i * 14, 70 - i * 6, 5);
        // solda do topo
        ctx.fillStyle = '#1b1d20';
        ctx.fillRect(0, 0, w, 30);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        for (let x = 4; x < w; x += 8) ctx.fillRect(x, 4, 3, 22);
    });
}

// Cordão azul de crachá com marcas brancas
export function lanyardTexture() {
    return canvasTexture(32, 256, (ctx, w, h) => {
        ctx.fillStyle = '#2343c4';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f4f6ff';
        for (let y = 10; y < h; y += 64) {
            ctx.fillRect(8, y, 16, 10);
            ctx.beginPath();
            ctx.arc(16, y + 26, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(10, y + 40, 12, 3);
        }
    });
}

// Tapete felpudo: os mesmos tufos e fios desenhados na cor e na altura do pelo
// (`pile`: quanto mais claro, mais alto o fio). As duas repetem sem emenda.
export function rugTextures() {
    const size = 512;
    const rand = seeded(17);
    const clumps = Array.from({ length: 150 }, () => ({ x: rand() * size, y: rand() * size, r: 18 + rand() * 34, v: rand() }));
    const strands = Array.from({ length: 1900 }, () => ({
        x: rand() * size,
        y: rand() * size,
        a: rand() * Math.PI * 2,
        l: 26 + rand() * 40,
        bend: (rand() - 0.5) * 1.1,
        w: 3 + rand() * 5,
        v: rand()
    }));
    // repete o desenho nas bordas vizinhas para a textura não ter emenda
    const wrapped = (x, y, reach, paint) => {
        for (const ox of [-size, 0, size]) {
            for (const oy of [-size, 0, size]) {
                const sx = x + ox;
                const sy = y + oy;
                if (sx > -reach && sy > -reach && sx < size + reach && sy < size + reach) paint(sx, sy);
            }
        }
    };
    // cinza-bege das fotos, com tufos e fios um pouco mais claros ou mais escuros
    const tone = (v, alpha) => `hsla(22, ${6 + v * 6}%, ${64 + v * 24}%, ${alpha})`;
    const color = canvasTexture(
        size,
        size,
        (ctx) => {
            ctx.fillStyle = '#c4bcb3';
            ctx.fillRect(0, 0, size, size);
            clumps.forEach(({ x, y, r, v }) =>
                wrapped(x, y, r, (sx, sy) => {
                    const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
                    g.addColorStop(0, tone(v, 0.5));
                    g.addColorStop(1, tone(v, 0));
                    ctx.fillStyle = g;
                    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
                })
            );
            ctx.lineCap = 'round';
            strands.forEach(({ x, y, a, l, bend, w, v }) => {
                ctx.strokeStyle = tone(v, 0.55);
                ctx.lineWidth = w;
                wrapped(x, y, 70, (sx, sy) => {
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.quadraticCurveTo(
                        sx + Math.cos(a + bend) * l * 0.5,
                        sy + Math.sin(a + bend) * l * 0.5,
                        sx + Math.cos(a) * l,
                        sy + Math.sin(a) * l
                    );
                    ctx.stroke();
                });
            });
        },
        { repeat: [3, 2.5] }
    );
    // pontas dos fios em pé: os tufos têm fios mais altos no meio e mais baixos na beira
    const tips = Array.from({ length: 16000 }, () => ({ x: rand() * size, y: rand() * size, r: 1.3 + rand() * 1.7, v: rand() }));
    const pile = canvasTexture(
        size,
        size,
        (ctx) => {
            // fundo baixo: as primeiras camadas cobrem tudo, sem buracos até a base
            ctx.fillStyle = '#383838';
            ctx.fillRect(0, 0, size, size);
            ctx.lineCap = 'round';
            strands.forEach(({ x, y, a, l, w, v }) => {
                const g = Math.round(70 + 60 * v);
                ctx.strokeStyle = `rgb(${g},${g},${g})`;
                ctx.lineWidth = w * 0.6;
                wrapped(x, y, 70, (sx, sy) => {
                    ctx.beginPath();
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + Math.cos(a) * l * 0.6, sy + Math.sin(a) * l * 0.6);
                    ctx.stroke();
                });
            });
            tips.forEach(({ x, y, r, v }) => {
                const near = clumps.reduce((best, c) => {
                    const dx = Math.abs(x - c.x);
                    const dy = Math.abs(y - c.y);
                    return Math.max(best, 1 - Math.hypot(Math.min(dx, size - dx), Math.min(dy, size - dy)) / (c.r * 1.6));
                }, 0);
                const g = Math.round(255 * (0.3 + 0.35 * v + 0.35 * near));
                ctx.fillStyle = `rgb(${g},${g},${g})`;
                wrapped(x, y, 4, (sx, sy) => {
                    ctx.beginPath();
                    ctx.arc(sx, sy, r, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        },
        { repeat: [3, 2.5], data: true }
    );
    return { color, pile };
}
