import './app/styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import { baixarQuarto } from './baked/carregamento';

// O quarto assado começa a baixar já, junto com o JavaScript do 3D (antes esperava o three.js e o React
// montarem a cena). Fica de fora no modo `?render=...` (quarto em código) e sem WebGL (modo 2D).
// 760 px: a mesma largura em que o App passa para o modo celular (MOBILE_MAX)
const temWebGL = (() => {
    try {
        return !!document.createElement('canvas').getContext('webgl2');
    } catch {
        return false;
    }
})();
if (temWebGL && !new URLSearchParams(location.search).has('render')) baixarQuarto(window.innerWidth < 760).catch(() => {});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>
);
