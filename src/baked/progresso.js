// Progresso do carregamento do quarto, para a barra "Montando o quarto… 63%" (App). O BakedRoom escreve
// aqui (bytes do GLB e texturas de luz baixadas) e avisa quando o quarto já está na tela; o Scene avisa
// quando usa o quarto em código (que aparece na hora). Fica fora do React para o Canvas e o HTML
// (que são árvores separadas) conversarem sem passar props.
import { useEffect, useState } from 'react';

let estado = { glb: 0, luz: 0, pronto: false };
const ouvintes = new Set();

export function atualizarProgresso(parcial) {
    estado = { ...estado, ...parcial };
    ouvintes.forEach((f) => f(estado));
}

// O GLB pesa a maior parte (geometria + texturas dos objetos); as texturas de luz vêm junto, em paralelo
export const porcentagem = (s) => Math.round(100 * Math.min(1, 0.7 * s.glb + 0.3 * s.luz));

export function useProgressoQuarto() {
    const [s, setS] = useState(estado);
    useEffect(() => {
        ouvintes.add(setS);
        setS(estado);
        return () => ouvintes.delete(setS);
    }, []);
    return s;
}
