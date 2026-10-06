// As quatro seções do portfólio. São usadas tanto no painel do modo 3D quanto no modo 2D.
import { useState } from 'react';

import { channels } from './content';
import { channelIcon, IconArrow, IconCheck, IconCopy, IconPlay } from './Icons';

function initials(name) {
    return name
        .split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export function About({ t, lang, setLang }) {
    const a = t.about;
    return (
        <div className="about">
            <div className="about-hero">
                <span className="avatar" aria-hidden="true">
                    {initials(a.name)}
                </span>
                <div>
                    <p className="about-name">{a.name}</p>
                    <p className="muted">{a.role}</p>
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

            <h3 className="mini-title">{a.interestsTitle}</h3>
            <ul className="chips">
                {a.interests.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>

            <h3 className="mini-title">{a.goalTitle}</h3>
            <p>{a.goal}</p>
        </div>
    );
}

export function Projects({ t }) {
    const p = t.projects;
    return (
        <div>
            <p className="muted">{p.intro}</p>
            <ol className="timeline">
                {p.items.map((item) => (
                    <li key={item.name} className="timeline-item">
                        <time className="timeline-date">{item.date}</time>
                        <article className="project">
                            <div className="project-media" aria-hidden="true">
                                <IconPlay />
                                <span>{p.gif}</span>
                            </div>
                            <h3>{item.name}</h3>
                            <p>{item.description}</p>
                            <ul className="chips chips-mono">
                                {item.tech.map((tech) => (
                                    <li key={tech}>{tech}</li>
                                ))}
                            </ul>
                            <a
                                className="text-link"
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {p.repo} <IconArrow />
                            </a>
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
                    <li key={item.org + item.period} className="job">
                        <span className="job-period">{item.period}</span>
                        <h3>{item.role}</h3>
                        <p className="job-org">{item.org}</p>
                        <p>{item.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Contact({ t, idPrefix }) {
    const c = t.contact;
    const f = c.form;
    const [values, setValues] = useState({ name: '', email: '', message: '' });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle');
    const [copied, setCopied] = useState(false);

    const update = (field) => (event) => {
        setValues((v) => ({ ...v, [field]: event.target.value }));
        setErrors((err) => ({ ...err, [field]: undefined }));
        setStatus('idle');
    };

    const validate = () => {
        const next = {};
        if (!values.name.trim()) next.name = f.errName;
        if (!EMAIL_RE.test(values.email.trim())) next.email = f.errEmail;
        if (values.message.trim().length < 10) next.message = f.errMessage;
        return next;
    };

    const onSubmit = (event) => {
        event.preventDefault();
        const next = validate();
        setErrors(next);
        // Aqui entra o envio real (EmailJS ou rota de API) no projeto final
        setStatus(Object.keys(next).length ? 'invalid' : 'ok');
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

    const field = (name) => `${idPrefix}-${name}`;

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
                                <span className="channel-value">{ch.value}</span>
                            </span>
                            {ch.copy ? (
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={() => copy(ch.value)}
                                    aria-label={copied ? c.copied : c.copy}
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
                                    aria-label={ch.label}
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
                <button type="submit" className="btn-primary">
                    {f.send}
                </button>
                {status === 'ok' && (
                    <p className="form-note" role="status">
                        {f.ok}
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
