// As quatro seções do portfólio. São usadas no painel do modo 3D, nas telas do quarto e no modo 2D.
import { useRef } from 'react';

import { monthLabel, profile } from './content';
import { IconArrow, IconLock, IconPin, IconPlay, IconUsers, sectionIcon } from './Icons';
import { ContactApps } from './screens/AppIcons';
import MailCompose from './screens/MailCompose';

// Ícone + título da seção. O título recebe o foco quando a seção abre (headingRef).
export function SectionHeader({ id, t, headingRef, headingId }) {
    const Icon = sectionIcon[id];
    return (
        <header className="section-head">
            <span className="section-icon">
                <Icon />
            </span>
            <h2 ref={headingRef} id={headingId} tabIndex={-1}>
                {t.ui.nav[id]}
            </h2>
        </header>
    );
}

function Avatar() {
    if (profile.photo) {
        return <img className="avatar" src={profile.photo} alt={profile.name} />;
    }
    return (
        <span className="avatar" aria-hidden="true">
            {profile.initials}
        </span>
    );
}

export function About({ t, lang, setLang }) {
    const a = t.about;
    return (
        <div className="about">
            <div className="about-hero">
                <Avatar />
                <div className="about-id">
                    <p className="about-name">{profile.name}</p>
                    <p className="muted">{a.role}</p>
                    <p className="about-place">
                        <IconPin /> {a.location}
                    </p>
                </div>
            </div>

            <div className="lang-switch" role="group" aria-label={a.readIn}>
                <span className="lang-switch-label">{a.readIn}</span>
                {['pt', 'en'].map((code) => (
                    <button
                        key={code}
                        type="button"
                        aria-pressed={lang === code}
                        onClick={() => setLang(code)}
                    >
                        {code === 'pt' ? 'Português' : 'English'}
                    </button>
                ))}
            </div>

            {a.bio.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
            ))}

            <h3 className="mini-title">{a.educationTitle}</h3>
            <ul className="edu">
                {a.education.map((e) => (
                    <li key={e.course}>
                        <span className="edu-course">
                            {e.course} · {e.school}
                        </span>
                        <span className="muted">{e.detail}</span>
                    </li>
                ))}
            </ul>

            <h3 className="mini-title">{a.stackTitle}</h3>
            <ul className="chips chips-mono">
                {a.stack.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>

            <h3 className="mini-title">{a.interestsTitle}</h3>
            <ul className="chips">
                {a.interests.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>

            <h3 className="mini-title">{a.goalTitle}</h3>
            <p>{a.goal}</p>

            <dl className="facts">
                <div>
                    <dt className="mini-title">{a.languagesTitle}</dt>
                    <dd>{a.languages}</dd>
                </div>
                <div>
                    <dt className="mini-title">{a.offTitle}</dt>
                    <dd>{a.off}</dd>
                </div>
            </dl>
        </div>
    );
}

export function Projects({ t }) {
    const p = t.projects;
    // A linha do tempo vai do mais antigo ao mais recente
    const items = [...p.items].sort((a, b) => a.date.localeCompare(b.date));
    return (
        <div>
            <p className="muted">{p.intro}</p>
            <ol className="timeline">
                {items.map((item) => (
                    <li key={item.id} className="timeline-item">
                        <time className="timeline-date" dateTime={item.date}>
                            {monthLabel(item.date, t)}
                        </time>
                        <article className="project">
                            {item.media ? (
                                <img className="project-media" src={item.media} alt="" loading="lazy" />
                            ) : (
                                <div className="project-media project-media-empty" aria-hidden="true">
                                    <IconPlay />
                                    <span>{p.gif}</span>
                                </div>
                            )}
                            {/* o texto fica num bloco só: no monitor largo ele vai para a coluna ao lado da mídia */}
                            <div className="project-body">
                                <div className="project-head">
                                    <h3>{item.name}</h3>
                                    {item.team && (
                                        <span className="badge">
                                            <IconUsers /> {p.team}
                                        </span>
                                    )}
                                </div>
                                <p>{item.description}</p>
                                {item.role && <p className="project-role">{item.role}</p>}
                                <ul className="chips chips-mono">
                                    {item.tech.map((tech) => (
                                        <li key={tech}>{tech}</li>
                                    ))}
                                </ul>
                                <div className="project-links">
                                    {item.links.map((link) => (
                                        <a
                                            key={link.url}
                                            className="text-link"
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            {p.links[link.kind]} <IconArrow />
                                        </a>
                                    ))}
                                    {item.privateRepo && (
                                        <span className="badge badge-quiet">
                                            <IconLock /> {p.privateRepo}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </article>
                    </li>
                ))}
            </ol>
        </div>
    );
}

export function Experience({ t }) {
    const e = t.experience;
    return (
        <div>
            <p className="muted">{e.intro}</p>
            <ul className="jobs">
                {e.items.map((item) => (
                    <li key={item.id} className="job">
                        <span className="job-period">
                            {monthLabel(item.start, t)} – {item.end ? monthLabel(item.end, t) : t.ui.present}
                        </span>
                        <h3>{item.role}</h3>
                        {item.url ? (
                            <a className="job-org" href={item.url} target="_blank" rel="noreferrer">
                                {item.org} <IconArrow />
                            </a>
                        ) : (
                            <p className="job-org">{item.org}</p>
                        )}
                        <p>{item.description}</p>
                        {item.highlights?.length > 0 && (
                            <ul className="job-highlights">
                                {item.highlights.map((h) => (
                                    <li key={h}>{h}</li>
                                ))}
                            </ul>
                        )}
                        {item.tech?.length > 0 && (
                            <ul className="chips chips-mono">
                                {item.tech.map((tech) => (
                                    <li key={tech}>{tech}</li>
                                ))}
                            </ul>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

// Contato no painel, na folha do celular de verdade e no modo 2D. Tem o mesmo visual do celular 3D
// (screens/PhoneScreen): os apps em linha e, embaixo, o formulário no estilo do app de e-mail.
export function Contact({ t, lang, idPrefix }) {
    const nameRef = useRef(null);

    // Aqui o formulário já está na página: o ícone do E-mail rola até ele e põe o cursor no "De:"
    const goToForm = () => {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        nameRef.current?.closest('.mail')?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
        nameRef.current?.focus({ preventScroll: true });
    };

    return (
        <div>
            <p className="muted">{t.contact.intro}</p>
            <ContactApps t={t} onMail={goToForm} />
            <MailCompose t={t} lang={lang} idPrefix={idPrefix} nameRef={nameRef} />
        </div>
    );
}

export const sectionComponents = {
    about: About,
    projects: Projects,
    experience: Experience,
    contact: Contact
};
