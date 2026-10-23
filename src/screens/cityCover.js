// Capa do perfil na TV: prédios de uma cidade à noite com janelas acesas, lembrando a capa que o
// Daniel usa no LinkedIn (a foto original pode ter direitos autorais, então a arte é nossa).
// Os mesmos números servem ao SVG da camada HTML (TvScreen) e ao canvas da textura (room/textures.js):
// tudo numa caixa de COVER_W x COVER_H, alinhada por baixo.
export const COVER_W = 400;
export const COVER_H = 40;
export const COVER_SKY = ['#0a1120', '#1b2740'];
export const COVER_BUILDINGS = ['#0c1424', '#111b2e', '#162238'];
export const COVER_LIGHT = '#ffc56e';

// Números pseudoaleatórios repetíveis (a mesma cidade em todo desenho)
function random(seed) {
    let a = seed;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// { buildings: [{ x, y, w, h, shade }], windows: [{ x, y, w, h, alpha }] }
export function cityCover() {
    const rand = random(14);
    const buildings = [];
    const windows = [];
    // duas fileiras: a de trás mais alta e escura, a da frente mais baixa
    for (const [row, minH, maxH] of [
        [0, 18, 36],
        [1, 8, 22]
    ]) {
        let x = -4 + rand() * 4;
        while (x < COVER_W) {
            const w = 9 + rand() * 16;
            const h = minH + rand() * (maxH - minH);
            const y = COVER_H - h;
            buildings.push({ x, y, w, h, shade: row === 0 ? 0 : 1 + (rand() < 0.5 ? 0 : 1) });
            // janelas em grade, umas acesas
            for (let wy = y + 2; wy < COVER_H - 2; wy += 3.2) {
                for (let wx = x + 1.6; wx < x + w - 2; wx += 3) {
                    if (rand() < (row === 0 ? 0.22 : 0.32)) windows.push({ x: wx, y: wy, w: 1.3, h: 1.6, alpha: 0.45 + rand() * 0.55 });
                }
            }
            x += w + (row === 0 ? rand() * 3 : 1 + rand() * 6);
        }
    }
    return { buildings, windows };
}
