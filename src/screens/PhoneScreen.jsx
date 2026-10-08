// Celular = Contato. A tela inicial é inspirada no iOS 26 (só inspiração: nada da Apple entra aqui):
// hora e data como na tela bloqueada, um cartão de vidro com a minha foto e os apps.
// O app E-mail é o formulário de contato. "Ler em 2D" e "Voltar ao quarto" ficam fora da tela,
// ao lado do celular. A textura do celular em repouso (phoneScreenTexture, em textures.js) desenha
// a mesma tela inicial, com as mesmas medidas (phone.css, em cqw), para a troca não aparecer.
import { useEffect, useRef, useState } from 'react';

import { profile } from '../content';
import { IconList } from '../Icons';
import { ContactApps } from './AppIcons';
import MailCompose from './MailCompose';
import { phoneDate, phoneTime, useNow } from './phoneClock';
import './phone.css';

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Leque do Wi-Fi: três faixas de um setor de 90°, apontando para cima, com centro em (cx, cy)
function wifiBand(r1, r2, cx = 76, cy = 30.5) {
    const at = (r, deg) => {
        const a = (deg * Math.PI) / 180;
        return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    };
    const outer = `M${at(r2, 225)}A${r2} ${r2} 0 0 1 ${at(r2, 315)}`;
    const inner = r1 > 0 ? `L${at(r1, 315)}A${r1} ${r1} 0 0 0 ${at(r1, 225)}` : `L${cx} ${cy}`;
    return `${outer}${inner}Z`;
}

const WIFI = [wifiBand(0, 8.5), wifiBand(11.5, 18), wifiBand(21, 27.5)];

// Sinal, Wi-Fi e bateria. Caixa de 166 x 34 (10 unidades = 1cqw), na cor do texto.
function StatusIcons() {
    return (
        <svg className="phone-status-icons" viewBox="0 0 166 34" fill="currentColor" aria-hidden="true" focusable="false">
            {[10.5, 15.5, 21, 26.5].map((h, i) => (
                <rect key={h} x={2 + i * 13.4} y={30 - h} width="9" height={h} rx="2.5" />
            ))}
            {WIFI.map((d) => (
                <path key={d} d={d} />
            ))}
            <rect x="107.2" y="6.7" width="49.6" height="21.6" rx="6.6" fill="none" stroke="currentColor" strokeWidth="2.4" opacity="0.45" />
            <rect x="110.6" y="10.1" width="36" height="14.8" rx="3.8" />
            <rect x="160.4" y="13.5" width="3.8" height="7.6" rx="1.9" opacity="0.45" />
        </svg>
    );
}

export default function PhoneScreen({ t, lang, headingRef, onClose, onRead2d }) {
    const now = useNow();
    const time = phoneTime(now, lang);
    const s = t.ui.screen;
    // App E-mail: fechado (null), aberto ('open') ou voltando para o ícone ('closing')
    const [app, setApp] = useState(null);
    // De onde o app cresce: o centro do ícone do E-mail, em % do display, e o tamanho dele
    const [origin, setOrigin] = useState({ x: 50, y: 50, scale: 0.2 });
    const displayRef = useRef(null);
    const mailIconRef = useRef(null);
    const nameRef = useRef(null);
    const lastApp = useRef(app);

    // Foco: o app abre com o cursor no "De:"; ao fechar, o foco volta para o ícone do E-mail
    useEffect(() => {
        const before = lastApp.current;
        lastApp.current = app;
        if (app === 'open') nameRef.current?.focus({ preventScroll: true });
        else if (before === 'open') mailIconRef.current?.focus({ preventScroll: true });
    }, [app]);

    const openMail = () => {
        const display = displayRef.current.getBoundingClientRect();
        const icon = mailIconRef.current.querySelector('.app-art').getBoundingClientRect();
        setOrigin({
            x: ((icon.left + icon.width / 2 - display.left) / display.width) * 100,
            y: ((icon.top + icon.height / 2 - display.top) / display.height) * 100,
            scale: icon.width / display.width
        });
        setApp('open');
    };

    // Com movimento reduzido fecha na hora; senão o app encolhe até o ícone (fim da animação abaixo)
    const closeMail = () => setApp(prefersReducedMotion() ? null : 'closing');

    // Esc no app volta para a tela inicial sem fechar o Contato. O stopPropagation segura a tecla
    // antes da window, onde o App fecha a seção (o React escuta na raiz da página, antes da window).
    // Na tela inicial o Esc segue até a window e volta ao quarto.
    const onAppKeyDown = (e) => {
        if (e.key !== 'Escape') return;
        e.stopPropagation();
        closeMail();
    };

    const onAppAnimationEnd = (e) => {
        if (e.target === e.currentTarget && app === 'closing') setApp(null);
    };

    return (
        <>
            {/* O display: corta nos cantos arredondados da tela e "acende" ao aparecer */}
            <div ref={displayRef} className="phone-display">
                {/* título da seção: não aparece, mas recebe o foco quando a tela abre (App.jsx) */}
                <h2 ref={headingRef} id="screen-title" tabIndex={-1} className="sr-only">
                    {t.ui.nav.contact}
                </h2>

                {/* inert: com o app aberto, a tela inicial sai do Tab e do leitor de tela */}
                <div className="phone-home" inert={app === 'open' ? '' : undefined}>
                    <div className="phone-lock" aria-hidden="true">
                        <p className="phone-date">{phoneDate(now, lang)}</p>
                        <p className="phone-time">{time}</p>
                    </div>

                    <div className="phone-card">
                        <img className="phone-photo" src={profile.photo} alt="" />
                        <p className="phone-name">{profile.name}</p>
                        <p className="phone-role">{t.contact.cardRole}</p>
                    </div>

                    <ContactApps t={t} onMail={openMail} mailRef={mailIconRef} className="phone-apps" />
                </div>

                {app && (
                    <div
                        className={`phone-app${app === 'closing' ? ' is-closing' : ''}`}
                        style={{ '--ox': `${origin.x}%`, '--oy': `${origin.y}%`, '--os': origin.scale }}
                        // tabIndex -1: um clique no fundo do app deixa o foco aqui (e o Esc continua no app)
                        tabIndex={-1}
                        inert={app === 'closing' ? '' : undefined}
                        onKeyDown={onAppKeyDown}
                        onAnimationEnd={onAppAnimationEnd}
                    >
                        <MailCompose t={t} lang={lang} idPrefix="phone" onCancel={closeMail} nameRef={nameRef} />
                    </div>
                )}

                <div className="phone-status" aria-hidden="true">
                    <span className="phone-status-time">{time}</span>
                    <StatusIcons />
                </div>
                <div className="phone-island" aria-hidden="true" />
                <div className="phone-homebar" aria-hidden="true" />
            </div>

            {/* Saídas fora da tela, ao lado do celular */}
            <div className="phone-exits">
                <button type="button" className="phone-exit" onClick={onRead2d}>
                    <IconList />
                    {s.read2d}
                </button>
                <button type="button" className="phone-exit phone-exit-primary" onClick={onClose}>
                    {t.ui.close}
                </button>
                <p className="phone-esc">{app === 'open' ? s.escHome : s.escHint}</p>
            </div>
        </>
    );
}
