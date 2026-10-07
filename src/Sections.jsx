// As quatro seções do portfólio. São usadas no painel do modo 3D, nas telas do quarto e no modo 2D.
import { useEffect, useRef, useState } from 'react';

import { channels, monthLabel, profile } from './content';
import { emailConfigured, sendMessage } from './email';
import {
    channelIcon,
    IconArrow,
    IconCheck,
    IconCopy,
    IconLock,
    IconPin,
    IconPlay,
    IconUsers,
    sectionIcon
} from './Icons';

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// No celular o e-mail não cabe numa linha: o <wbr> deixa a quebra cair antes do @
// (e não no meio de uma palavra). Ele não entra no texto quando a pessoa copia.
function breakBeforeAt(value) {
    const at = value.indexOf('@');
    if (at <= 0) return value;
    return (
        <>
            {value.slice(0, at)}
            <wbr />
            {value.slice(at)}
        </>
    );
}
const EMPTY = { name: '', email: '', message: '' };

export function Contact({ t, lang, idPrefix }) {
    const c = t.contact;
    const f = c.form;
    const [values, setValues] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle');
    const [copied, setCopied] = useState(false);
    // Aviso depois do envio (enviado, sem configuração ou erro)
    const noteRef = useRef(null);

    const field = (name) => `${idPrefix}-${name}`;

    // O aviso aparece embaixo do botão, quase sempre fora da parte visível do painel: rola até ele
    useEffect(() => {
        noteRef.current?.scrollIntoView({ block: 'nearest' });
    }, [status]);

    const update = (name) => (event) => {
        setValues((v) => ({ ...v, [name]: event.target.value }));
        setErrors((err) => ({ ...err, [name]: undefined }));
        if (status !== 'sending') setStatus('idle');
    };

    const validate = () => {
        const next = {};
        if (!values.name.trim()) next.name = f.errName;
        if (!EMAIL_RE.test(values.email.trim())) next.email = f.errEmail;
        if (values.message.trim().length < 10) next.message = f.errMessage;
        return next;
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        if (status === 'sending') return;
        const next = validate();
        setErrors(next);
        const firstInvalid = Object.keys(next)[0];
        if (firstInvalid) {
            document.getElementById(field(firstInvalid))?.focus();
            return;
        }
        // Campo escondido: só robôs preenchem
        if (event.currentTarget.elements.company?.value) {
            setStatus('sent');
            return;
        }
        if (!emailConfigured) {
            setStatus('offline');
            return;
        }
        setStatus('sending');
        try {
            await sendMessage({
                name: values.name.trim(),
                email: values.email.trim(),
                message: values.message.trim(),
                lang
            });
            setValues(EMPTY);
            setStatus('sent');
        } catch {
            setStatus('error');
        }
    };

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    const note = {
        sent: { text: f.sent, role: 'status' },
        offline: { text: f.offline, role: 'status' },
        error: { text: f.failed, role: 'alert' }
    }[status];

    return (
        <div>
            <p className="muted">{c.intro}</p>
            <ul className="channels">
                {channels.map((ch) => {
                    const Icon = channelIcon[ch.id];
                    return (
                        <li key={ch.id} className="channel">
                            <span className="channel-icon">
                                <Icon />
                            </span>
                            <span className="channel-text">
                                <span className="channel-label">{ch.label}</span>
                                <span className="channel-value">{breakBeforeAt(ch.value)}</span>
                            </span>
                            {ch.copy ? (
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={() => copy(ch.value)}
                                    aria-label={`${copied ? c.copied : c.copy}: ${ch.label}`}
                                    title={copied ? c.copied : c.copy}
                                >
                                    {copied ? <IconCheck /> : <IconCopy />}
                                </button>
                            ) : (
                                <a
                                    className="btn-ghost"
                                    href={ch.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`${c.open}: ${ch.label}`}
                                    title={c.open}
                                >
                                    <IconArrow />
                                </a>
                            )}
                        </li>
                    );
                })}
            </ul>

            <form className="form" onSubmit={onSubmit} noValidate>
                <div className="field">
                    <label htmlFor={field('name')}>{f.name}</label>
                    <input
                        id={field('name')}
                        name="name"
                        autoComplete="name"
                        value={values.name}
                        onChange={update('name')}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? field('name-err') : undefined}
                    />
                    {errors.name && (
                        <p className="field-error" id={field('name-err')}>
                            {errors.name}
                        </p>
                    )}
                </div>
                <div className="field">
                    <label htmlFor={field('email')}>{f.email}</label>
                    <input
                        id={field('email')}
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={values.email}
                        onChange={update('email')}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? field('email-err') : undefined}
                    />
                    {errors.email && (
                        <p className="field-error" id={field('email-err')}>
                            {errors.email}
                        </p>
                    )}
                </div>
                <div className="field">
                    <label htmlFor={field('message')}>{f.message}</label>
                    <textarea
                        id={field('message')}
                        name="message"
                        rows={4}
                        value={values.message}
                        onChange={update('message')}
                        aria-invalid={!!errors.message}
                        aria-describedby={errors.message ? field('message-err') : undefined}
                    />
                    {errors.message && (
                        <p className="field-error" id={field('message-err')}>
                            {errors.message}
                        </p>
                    )}
                </div>
                <div className="hp" aria-hidden="true">
                    <label>
                        Company
                        <input name="company" tabIndex={-1} autoComplete="off" />
                    </label>
                </div>
                <button type="submit" className="btn-primary" disabled={status === 'sending'}>
                    {status === 'sending' ? f.sending : f.send}
                </button>
                {note && (
                    <p ref={noteRef} className={`form-note${status === 'error' ? ' is-error' : ''}`} role={note.role}>
                        {note.text}
                    </p>
                )}
            </form>
        </div>
    );
}

export const sectionComponents = {
    about: About,
    projects: Projects,
    experience: Experience,
    contact: Contact
};
