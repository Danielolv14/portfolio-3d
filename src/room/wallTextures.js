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

// Rosto do cofrinho de Stormtrooper. A textura cobre o quadrado [0,1] do contorno do capacete:
// olhos grandes em gota, "lágrimas" cinza, nariz e a "careta" com grade.
export function trooperFaceTexture() {
    return canvasTexture(256, 256, (ctx, w) => {
        const s = w / 256;
        ctx.scale(s, s);
        ctx.fillStyle = '#f5f5f2';
        ctx.fillRect(0, 0, 256, 256);
        // linha da testa
        ctx.strokeStyle = 'rgba(120, 124, 130, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(44, 78);
        ctx.quadraticCurveTo(128, 58, 212, 78);
        ctx.stroke();
        // olhos em gota: ponta alta perto do nariz, bojo caindo para fora (o ar "triste" do capacete)
        ctx.fillStyle = '#121316';
        [-1, 1].forEach((side) => {
            ctx.save();
            ctx.translate(128 + side * 50, 112);
            ctx.scale(side, 1);
            ctx.beginPath();
            ctx.ellipse(10, 12, 34, 38, -0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-44, -28);
            ctx.lineTo(31, -18);
            ctx.lineTo(-9, 40);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        // "lágrimas" cinza descendo das bochechas
        ctx.fillStyle = '#7f848b';
        [-1, 1].forEach((side) => {
            for (let i = 0; i < 3; i++) {
                const x = 128 + side * (64 + i * 10);
                ctx.fillRect(x - 3, 166 + i * 2, 6, 34 - i * 7);
            }
        });
        // nariz
        ctx.fillStyle = '#2a2b2f';
        ctx.beginPath();
        ctx.moveTo(117, 140);
        ctx.lineTo(139, 140);
        ctx.lineTo(128, 162);
        ctx.closePath();
        ctx.fill();
        // careta: boca em arco para baixo, com a grade cinza
        ctx.fillStyle = '#1d1e22';
        ctx.beginPath();
        ctx.moveTo(84, 226);
        ctx.quadraticCurveTo(128, 156, 172, 226);
        ctx.lineTo(154, 234);
        ctx.quadraticCurveTo(128, 194, 102, 234);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#a4a8ae';
        for (let i = 0; i < 6; i++) ctx.fillRect(105 + i * 9, 196 + Math.abs(i - 2.5) * 4, 3, 18);
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

// Impressão do troféu de acrílico: faixa amarela, dois escudos e texto genérico
export function trophyPrintTexture() {
    return canvasTexture(256, 320, (ctx, w, h) => {
        ctx.fillStyle = '#17191e';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f2c318';
        ctx.fillRect(0, 0, w, 54);
        ctx.fillRect(0, h - 26, w, 26);
        ctx.fillStyle = '#17191e';
        ctx.font = '800 30px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CAMPEÃO', w / 2, 38);
        ['#3d7fd9', '#d9d9d9'].forEach((color, i) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(w * (0.3 + i * 0.4), 140, 34, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = '#f2c318';
        ctx.font = '700 22px system-ui, sans-serif';
        ctx.fillText('2025', w / 2, 236);
    });
}
