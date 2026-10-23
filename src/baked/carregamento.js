// Download do quarto assado: o manifesto, o GLB (contando os bytes, para a barra de progresso) e as texturas
// de luz leves, todos em paralelo. Começa na abertura da página (main.jsx), junto com o JavaScript do 3D:
// antes, o download só começava depois que o three.js e o React montavam a cena (~3 s perdidos). Fica fora
// do pedaço do three.js (não importa nada dele), para estar no JavaScript inicial, que é pequeno.
import { atualizarProgresso } from './progresso';

export const BASE = '/room/';
// Texturas de luz com metade do tamanho (4x menos bytes e memória): o celular fica com elas; o computador
// começa com elas e troca pelas inteiras depois (BakedRoom)
export const leve = (name) => name.replace(/\.webp$/, '-mobile.webp');
// `?v=`: a versão do bake na URL. Com ela, a Vercel manda o navegador guardar os arquivos por um ano
// (vercel.json): quem volta ao site carrega na hora, e um bake novo muda a URL sozinho
export const urlDe = (name, manifest) => `${BASE}${name}?v=${manifest.versao}`;
export const texturasDeLuz = (manifest) => Object.values(manifest.grupos).flatMap((g) => [g.luz_dia, g.luz_noite, g.leds]);

const pedidos = new Map();

// `compact` (celular): o GLB com texturas menores. Pedir de novo devolve o mesmo download
export function baixarQuarto(compact) {
    if (!pedidos.has(compact)) pedidos.set(compact, baixar(compact));
    return pedidos.get(compact);
}

async function baixar(compact) {
    // O manifesto nunca vem do cache: é ele que diz qual é a versão atual
    const r = await fetch(BASE + 'manifest.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const manifest = await r.json();
    // Texturas de luz leves: já vão para o cache do navegador; o useTexture pega de lá depois
    const luz = texturasDeLuz(manifest).map((f) => urlDe(leve(f), manifest));
    let prontas = 0;
    luz.forEach((url) =>
        fetch(url)
            .catch(() => null)
            .finally(() => atualizarProgresso({ luz: ++prontas / luz.length }))
    );
    // O GLB vem em pedaços, para a barra andar com os bytes. No celular, o GLB com texturas menores
    // (com as de 1024 px o navegador do celular estourava a memória)
    const glb = await fetch(urlDe((compact && manifest.glb_mobile) || manifest.glb, manifest));
    if (!glb.ok) throw new Error(`HTTP ${glb.status}`);
    const total = Number(glb.headers.get('content-length')) || 0;
    const leitor = glb.body.getReader();
    const partes = [];
    let lidos = 0;
    for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        partes.push(value);
        lidos += value.length;
        if (total) atualizarProgresso({ glb: Math.min(1, lidos / total) });
    }
    atualizarProgresso({ glb: 1 });
    return { manifest, glbUrl: URL.createObjectURL(new Blob(partes, { type: 'model/gltf-binary' })) };
}
