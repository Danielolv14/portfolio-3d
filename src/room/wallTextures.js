// Texturas da parede, da porta e do nicho, desenhadas em <canvas> (mesmo esquema de src/textures.js).
import * as THREE from 'three';

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

// Gerador pseudoaleatório com semente, para o desenho ser sempre igual
function seeded(seed) {
    let s = seed;
    return () => {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

// Granito do rodapé e do peitoril: fundo bege-acinzentado salpicado de cinza, bege e preto.
// Um ladrilho cobre 2.4 unidades; `length` diz quantas vezes ele se repete na peça.
export function graniteTexture(length = 2.4) {
    return canvasTexture(
        768,
        64,
        (ctx, w, h) => {
            const rand = seeded(13);
            ctx.fillStyle = '#cdc4b7';
            ctx.fillRect(0, 0, w, h);
            // manchas largas e suaves
            for (let i = 0; i < 70; i++) {
                ctx.fillStyle = rand() > 0.5 ? 'rgba(150, 138, 122, 0.12)' : 'rgba(236, 230, 220, 0.18)';
                ctx.beginPath();
                ctx.ellipse(rand() * w, rand() * h, 8 + rand() * 22, 4 + rand() * 10, rand() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            const specks = [
                ['#958c80', 1400, 1.7],
                ['#ece6db', 900, 1.6],
                ['#b09c82', 700, 1.5],
                ['#4c463f', 650, 1.3],
                ['#221f1c', 380, 1.1]
            ];
            specks.forEach(([color, count, size]) => {
                ctx.fillStyle = color;
                for (let i = 0; i < count; i++) {
                    ctx.beginPath();
                    ctx.ellipse(rand() * w, rand() * h, size * (0.5 + rand()), size * (0.4 + rand() * 0.8), rand() * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        },
        { repeat: [Math.max(1, length / 2.4), 1] }
    );
}

// Madeira âmbar envernizada da porta: veio vertical com "catedrais" no meio da folha
export function doorWoodTexture() {
    return canvasTexture(256, 768, (ctx, w, h) => {
        const rand = seeded(27);
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#c27a36');
        g.addColorStop(0.5, '#d48d47');
        g.addColorStop(1, '#bf7634');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        // faixas largas de tom
        for (let i = 0; i < 16; i++) {
            ctx.fillStyle = rand() > 0.5 ? 'rgba(147, 80, 28, 0.14)' : 'rgba(236, 150, 70, 0.14)';
            ctx.fillRect(rand() * w, 0, 6 + rand() * 26, h);
        }
        // veios finos e ondulados
        for (let i = 0; i < 80; i++) {
            const x0 = rand() * w;
            const amp = 1 + rand() * 4;
            const freq = 0.004 + rand() * 0.01;
            const phase = rand() * 10;
            ctx.strokeStyle = rand() > 0.45 ? '#93501c' : '#e4934a';
            ctx.globalAlpha = 0.15 + rand() * 0.25;
            ctx.lineWidth = 0.6 + rand() * 1.4;
            ctx.beginPath();
            for (let y = 0; y <= h; y += 8) ctx.lineTo(x0 + Math.sin(y * freq + phase) * amp, y);
            ctx.stroke();
        }
        // desenho de catedral (arcos encaixados, um pouco tortos)
        ctx.strokeStyle = '#93501c';
        for (let i = 0; i < 8; i++) {
            const half = 16 + i * 11;
            const top = 230 + i * 40 + rand() * 20;
            const cx = w / 2 + (rand() - 0.5) * 16;
            ctx.globalAlpha = 0.07 + rand() * 0.07;
            ctx.lineWidth = 3 + rand() * 4;
            ctx.beginPath();
            ctx.moveTo(cx - half, h);
            ctx.bezierCurveTo(cx - half, top + 140, cx - half * 0.35, top, cx, top);
            ctx.bezierCurveTo(cx + half * 0.35, top, cx + half, top + 140, cx + half, h);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    });
}

// Listras pretas e brancas do corpo da pelúcia de caveira (anéis ao redor da cápsula)
export function stripesTexture() {
    return canvasTexture(64, 256, (ctx, w, h) => {
        const n = 10;
        for (let i = 0; i < n; i++) {
            ctx.fillStyle = i % 2 ? '#f1efea' : '#1c1c1f';
            ctx.fillRect(0, (i * h) / n, w, h / n);
        }
    });
}
