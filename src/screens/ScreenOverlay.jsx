// Camada HTML de uma tela do quarto. Fica dentro do .stage, por cima do Canvas, exatamente sobre
// a tela 3D: quem acerta a posição e o tamanho a cada quadro é o ScreenTracker (dentro do Canvas).
// O App só monta esta camada quando a câmera já parou de frente para a tela.
// Como fica fora do Canvas, clique, rolagem e toque aqui dentro não chegam à cena 3D.
import { useCallback } from 'react';

import { placeScreen, SCREEN_COMPONENTS, SCREEN_OF } from './screens';

export default function ScreenOverlay({ section, box, ...screenProps }) {
    const kind = SCREEN_OF[section];
    const Screen = SCREEN_COMPONENTS[kind];

    // Ao aparecer, já entra no lugar certo (a última posição calculada), sem esperar o próximo quadro
    const attach = useCallback(
        (el) => {
            box.el = el;
            placeScreen(el, box.rect);
        },
        [box]
    );

    return (
        <section ref={attach} className={`screen screen--${kind}`} role="dialog" aria-labelledby="screen-title">
            <Screen {...screenProps} />
        </section>
    );
}
