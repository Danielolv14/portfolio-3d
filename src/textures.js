// Texturas desenhadas em <canvas>: nada de imagem externa, tudo gerado no navegador.
import * as THREE from 'three';

function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
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

export function floorTexture() {
    return canvasTexture(1024, 1024, (ctx, w, h) => {
        const rand = seeded(7);
        const plank = h / 10;
        for (let row = 0; row < 10; row++) {
            let x = -rand() * 300;
            while (x < w) {
                const len = 260 + rand() * 260;
                const tone = 196 + Math.floor(rand() * 22);
                ctx.fillStyle = `rgb(${tone}, ${Math.floor(tone * 0.7)}, ${Math.floor(tone * 0.45)})`;
                ctx.fillRect(x, row * plank, len, plank);
                ctx.fillStyle = 'rgba(80, 45, 20, 0.35)';
                ctx.fillRect(x, row * plank, 3, plank);
                x += len;
            }
            ctx.fillStyle = 'rgba(80, 45, 20, 0.4)';
            ctx.fillRect(0, row * plank, w, 3);
        }
    });
}

export function codeScreenTexture() {
    return canvasTexture(640, 384, (ctx, w, h) => {
        ctx.fillStyle = '#0f151c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#18222c';
        ctx.fillRect(0, 0, w, 34);
        ['#ff6b5e', '#ffc04d', '#3fd17a'].forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.beginPath();
            ctx.arc(22 + i * 22, 17, 6, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.fillStyle = '#121b23';
        ctx.fillRect(0, 34, 120, h - 34);
        const rand = seeded(42);
        const palette = ['#7cc7ff', '#f0b44c', '#5ef2d6', '#ff8fa3', '#c3a6ff', '#9aa7b4'];
        for (let i = 0; i < 6; i++) {
            ctx.fillStyle = '#2a3846';
            ctx.fillRect(18, 56 + i * 26, 60 + rand() * 30, 9);
        }
        let indent = 0;
        for (let line = 0; line < 15; line++) {
            const y = 54 + line * 21;
            ctx.fillStyle = '#3a4a58';
            ctx.fillRect(134, y, 14, 8);
            if (rand() > 0.7) indent = Math.min(indent + 1, 3);
            else if (rand() > 0.75) indent = Math.max(indent - 1, 0);
            let x = 166 + indent * 26;
            const tokens = 1 + Math.floor(rand() * 4);
            for (let t = 0; t < tokens; t++) {
                const len = 24 + rand() * 90;
                ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
                ctx.fillRect(x, y, len, 8);
                x += len + 10;
            }
        }
    });
}

export function phoneScreenTexture() {
    return canvasTexture(300, 600, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#1d6f63');
        g.addColorStop(1, '#0d2d3a');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = '600 64px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('09:41', w / 2, 130);
        const icons = ['#f0b44c', '#5ef2d6', '#ff8fa3', '#7cc7ff', '#c3a6ff', '#3fd17a', '#ffffff', '#ff6b5e'];
        icons.forEach((c, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            ctx.fillStyle = c;
            roundRect(ctx, 26 + col * 66, 300 + row * 80, 50, 50, 14);
            ctx.fill();
        });
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(ctx, 22, h - 100, w - 44, 70, 26);
        ctx.fill();
    });
}

export function portraitTexture() {
    return canvasTexture(400, 500, (ctx, w, h) => {
        ctx.fillStyle = '#f0b44c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e7a43a';
        for (let i = -h; i < w; i += 40) {
            ctx.fillRect(i, 0, 14, h);
        }
        ctx.fillStyle = '#21323a';
        ctx.beginPath();
        ctx.ellipse(w / 2, h + 40, 170, 190, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#c98b62';
        ctx.beginPath();
        ctx.arc(w / 2, 210, 92, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2b1d16';
        ctx.beginPath();
        ctx.arc(w / 2, 185, 96, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fill();
    });
}

export function neonTexture() {
    return canvasTexture(512, 256, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.font = '700 170px ui-monospace, Menlo, Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#5ef2d6';
        ctx.shadowBlur = 28;
        ctx.fillStyle = '#c9fff4';
        ctx.fillText('</>', w / 2, h / 2 + 8);
        ctx.shadowBlur = 0;
        ctx.fillText('</>', w / 2, h / 2 + 8);
    });
}

export function globeTexture() {
    return canvasTexture(512, 256, (ctx, w, h) => {
        ctx.fillStyle = '#3d7cc9';
        ctx.fillRect(0, 0, w, h);
        const rand = seeded(11);
        ctx.fillStyle = '#7cc47a';
        for (let i = 0; i < 26; i++) {
            const x = rand() * w;
            const y = h * 0.2 + rand() * h * 0.6;
            ctx.beginPath();
            ctx.ellipse(x, y, 18 + rand() * 40, 10 + rand() * 26, rand() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = '#eef6ff';
        ctx.fillRect(0, 0, w, 14);
        ctx.fillRect(0, h - 14, w, 14);
    });
}

export function corkTexture() {
    return canvasTexture(512, 340, (ctx, w, h) => {
        ctx.fillStyle = '#c99a63';
        ctx.fillRect(0, 0, w, h);
        const rand = seeded(3);
        for (let i = 0; i < 2600; i++) {
            ctx.fillStyle = rand() > 0.5 ? 'rgba(120,80,40,0.35)' : 'rgba(255,230,190,0.3)';
            ctx.fillRect(rand() * w, rand() * h, 2, 2);
        }
    });
}
