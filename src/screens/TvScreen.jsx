// TV = Experiências, no estilo do perfil do Daniel no LinkedIn, do jeito que ele está hoje
// (src/content/linkedin.js): capa, foto, nome, título, local, conexões e o botão "Conectar" (leva ao
// LinkedIn de verdade), o "Sobre" com as principais competências e as abas Experiência, Formação,
// Licenças e certificados e Competências. De dia o tema é claro; à noite, escuro, acompanhando o quarto
// (tv.css). A textura da TV em repouso (tvScreenTexture, em room/textures.js) desenha o topo da página.
import { useMemo, useState } from 'react';

import { channels } from '../content/content';
import { IconArrow, IconClose, IconList } from '../app/Icons';
import { COVER_BUILDINGS, COVER_H, COVER_LIGHT, COVER_SKY, COVER_W, cityCover } from './cityCover';
import './tv.css';

const LINKEDIN_URL = channels.find((c) => c.id === 'linkedin').href;

// Meses entre o início e o fim (ou hoje), contando os dois, como no LinkedIn
function monthsBetween(start, end) {
    const [y0, m0] = start.split('-').map(Number);
    const now = new Date();
    const [y1, m1] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1];
    return Math.max(1, (y1 - y0) * 12 + (m1 - m0) + 1);
}

// Logo genérico: um quadrado com a sigla (nada de logo real de empresa)
function Monogram({ text }) {
    return (
        <span className="li-logo" aria-hidden="true">
            {text}
        </span>
    );
}

const initials = (name) => name.replace(/[^A-Z]/g, '').slice(0, 3) || name[0];

// Selo de perfil verificado (um escudo com o visto)
function IconVerified({ label }) {
    return (
        <svg className="li-verified" viewBox="0 0 16 16" role="img" aria-label={label}>
            <path d="M8 1 2.5 3v4.2c0 3.3 2.3 6.3 5.5 7.8 3.2-1.5 5.5-4.5 5.5-7.8V3z" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path
                d="m5.6 8 1.7 1.7 3.2-3.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// Capa: cidade à noite (cityCover.js; a textura desenha a mesma)
function Cover() {
    const { buildings, windows } = useMemo(cityCover, []);
    return (
        <svg className="li-cover" viewBox={`0 0 ${COVER_W} ${COVER_H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
                <linearGradient id="li-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={COVER_SKY[0]} />
                    <stop offset="1" stopColor={COVER_SKY[1]} />
                </linearGradient>
            </defs>
            <rect width={COVER_W} height={COVER_H} fill="url(#li-sky)" />
            {buildings.map((b, i) => (
                <rect key={`b${i}`} x={b.x} y={b.y} width={b.w} height={b.h} fill={COVER_BUILDINGS[b.shade]} />
            ))}
            {windows.map((w, i) => (
                <rect key={`w${i}`} x={w.x} y={w.y} width={w.w} height={w.h} fill={COVER_LIGHT} opacity={w.alpha} />
            ))}
        </svg>
    );
}

// Linha de competências de um item: "Java, C# e mais 3 competências"
function SkillsLine({ item, l }) {
    if (!item.skills?.length) return null;
    return (
        <p className="li-skills">
            <b>{l.skillsLabel}:</b> {l.skillsLine(item.skills, item.moreSkills)}
        </p>
    );
}

// "Sobre": o texto com "… mais" (como no LinkedIn, aparece o começo) e as principais competências
function About({ l }) {
    const [open, setOpen] = useState(false);
    const shown = open ? l.about : l.about.slice(0, 1);
    return (
        <section className="li-card li-about">
            <h3>{l.aboutTitle}</h3>
            {shown.map((p) => (
                <p key={p}>{p}</p>
            ))}
            <button type="button" className="li-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                {open ? l.seeLess : l.seeMore}
            </button>
            <div className="li-top-skills">
                <b>{l.topSkillsTitle}</b>
                <p>{l.topSkills.join(' • ')}</p>
            </div>
        </section>
    );
}

function Experience({ l }) {
    // tópicos abertos por experiência ("… mais")
    const [open, setOpen] = useState({});
    return (
        <ul className="li-list">
            {l.experience.map((item) => {
                const shown = open[item.org];
                return (
                    <li key={item.org + item.start} className="li-item">
                        <Monogram text={item.org[0]} />
                        <div className="li-item-body">
                            <h4>{item.role}</h4>
                            <p>
                                <a href={item.url} target="_blank" rel="noreferrer">
                                    {item.org}
                                </a>{' '}
                                · {item.type}
                            </p>
                            <p className="li-muted">
                                {l.date(item.start)} - {item.end ? l.date(item.end) : l.present} ·{' '}
                                {l.duration(monthsBetween(item.start, item.end))}
                            </p>
                            <p className="li-muted">{item.place}</p>
                            <p className="li-text">{item.description}</p>
                            {shown && (
                                <ul className="li-highlights">
                                    {item.bullets.map((b) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            )}
                            <button
                                type="button"
                                className="li-more"
                                aria-expanded={Boolean(shown)}
                                onClick={() => setOpen((o) => ({ ...o, [item.org]: !o[item.org] }))}
                            >
                                {shown ? l.seeLess : l.seeMore}
                            </button>
                            <SkillsLine item={item} l={l} />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

function Education({ l }) {
    return (
        <ul className="li-list">
            {l.education.map((e) => (
                <li key={e.degree} className="li-item">
                    <Monogram text={initials(e.school)} />
                    <div className="li-item-body">
                        <h4>{e.school}</h4>
                        <p>{e.degree}</p>
                        <p className="li-muted">
                            {l.date(e.start)} – {l.date(e.end)}
                        </p>
                        {e.grade && (
                            <p className="li-text">
                                {l.gradeLabel}: {e.grade}
                            </p>
                        )}
                        {e.activities && (
                            <p>
                                {l.activitiesLabel}: {e.activities}
                            </p>
                        )}
                        {e.description && <p className="li-text">{e.description}</p>}
                        <SkillsLine item={e} l={l} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Certifications({ l }) {
    return (
        <ul className="li-list">
            {l.certifications.map((c) => (
                <li key={c.id} className="li-item">
                    <Monogram text={c.org[0]} />
                    <div className="li-item-body">
                        <h4>{c.name}</h4>
                        <p>{c.org}</p>
                        <p className="li-muted">{l.issued(l.date(c.issued))}</p>
                        <p className="li-muted">
                            {l.credentialId} {c.id}
                        </p>
                        <a className="li-outline" href={c.url} target="_blank" rel="noreferrer">
                            {l.showCredential} <IconArrow />
                        </a>
                        <SkillsLine item={c} l={l} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function Skills({ l }) {
    return (
        <ul className="li-skill-list">
            {l.skills.map((skill) => (
                <li key={skill}>
                    <b>{skill}</b>
                </li>
            ))}
        </ul>
    );
}

export default function TvScreen({ t, headingRef, onClose, onRead2d }) {
    const s = t.ui.screen;
    const l = t.experience.li;
    const [tab, setTab] = useState('experience');
    const job = l.experience[0];
    const school = l.education[l.education.length - 1];
    return (
        <>
            <div className="win-bar">
                <span className="win-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                </span>
                <span className="win-path" aria-hidden="true">
                    {s.path.experience}
                </span>
                <button type="button" className="win-close" onClick={onClose} aria-label={s.closeWindow} title={s.closeWindow}>
                    <IconClose />
                </button>
            </div>

            <div className="win-scroll li">
                <h2 ref={headingRef} id="screen-title" tabIndex={-1} className="sr-only">
                    {t.ui.nav.experience}
                </h2>

                {/* Cartão do topo: capa, foto por cima da capa, nome, título, local, conexões e Conectar */}
                <section className="li-card li-top">
                    <Cover />
                    <img className="li-avatar" src={l.photo} alt={l.name} />
                    <div className="li-top-body">
                        <div>
                            <h3 className="li-name">
                                {l.name} <IconVerified label={l.verified} /> <span className="li-pronouns">{l.pronouns}</span>
                            </h3>
                            <p className="li-headline">{l.headline}</p>
                            <p className="li-muted">{l.location}</p>
                            <a className="li-connections" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                                {l.connections}
                            </a>
                            <a className="li-connect" href={LINKEDIN_URL} target="_blank" rel="noreferrer">
                                {l.connect} <IconArrow />
                            </a>
                        </div>
                        <ul className="li-now">
                            {job && (
                                <li>
                                    <Monogram text={job.org[0]} /> {job.org}
                                </li>
                            )}
                            {school && (
                                <li>
                                    <Monogram text={initials(school.school)} /> {school.school}
                                </li>
                            )}
                        </ul>
                    </div>
                </section>

                <About l={l} />

                <section className="li-card li-section">
                    <nav className="li-tabs" aria-label={t.ui.nav.experience}>
                        {Object.entries(l.tabs).map(([id, label]) => (
                            <button
                                key={id}
                                type="button"
                                className="li-tab"
                                aria-current={tab === id ? 'page' : undefined}
                                onClick={() => setTab(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                    {tab === 'experience' && <Experience l={l} />}
                    {tab === 'education' && <Education l={l} />}
                    {tab === 'certifications' && <Certifications l={l} />}
                    {tab === 'skills' && <Skills l={l} />}
                </section>
            </div>

            <div className="win-task">
                <span className="win-hint">{s.escHint}</span>
                <button type="button" className="win-btn" onClick={onRead2d}>
                    <IconList />
                    {s.read2d}
                </button>
                <button type="button" className="win-btn win-btn-primary" onClick={onClose}>
                    {t.ui.close}
                </button>
            </div>
        </>
    );
}
