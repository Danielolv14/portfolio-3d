// Créditos dos modelos e texturas de terceiros. Aparece no painel (botão "Créditos" no quarto) e no
// fim do modo 2D. A CC BY pede título, autor, link, licença e se houve alteração: está tudo aqui.
import { LICENCAS, MODELOS_CC_BY, POLY_HAVEN } from '../content/creditos';
import { IconInfo } from '../app/Icons';

export default function Credits({ t, lang, headingRef, headingId, as: Heading = 'h2' }) {
    const c = t.credits;
    return (
        <div className="credits">
            <header className="section-head">
                <span className="section-icon">
                    <IconInfo />
                </span>
                <Heading ref={headingRef} id={headingId} tabIndex={-1}>
                    {c.title}
                </Heading>
            </header>

            <p className="credits-intro">{c.intro}</p>

            <h3 className="mini-title">
                {c.ccByTitle} ·{' '}
                <a href={LICENCAS.ccBy.url} target="_blank" rel="noreferrer">
                    {LICENCAS.ccBy.nome}
                </a>
            </h3>
            <ul className="credits-list">
                {MODELOS_CC_BY.map((m) => (
                    <li key={m.url}>
                        <a href={m.url} target="_blank" rel="noreferrer">
                            {m.titulo}
                        </a>
                        <span>
                            {c.by} {m.autor} · {m.objeto[lang]}
                        </span>
                    </li>
                ))}
            </ul>
            <p className="credits-note">{c.changes}</p>

            <h3 className="mini-title">
                {c.cc0Title} ·{' '}
                <a href={LICENCAS.cc0.url} target="_blank" rel="noreferrer">
                    {LICENCAS.cc0.nome}
                </a>
            </h3>
            <p className="credits-note">
                <a href={POLY_HAVEN.url} target="_blank" rel="noreferrer">
                    Poly Haven
                </a>
                . {c.textures}: {POLY_HAVEN.texturas.join(', ')}. {c.models}: {POLY_HAVEN.modelos.join(', ')}.
            </p>

            <p className="credits-note">{c.trademarks}</p>
        </div>
    );
}
