// Formulário de contato no estilo do app de e-mail do celular: "Para:" com o meu e-mail, os campos
// "De:", e-mail e a mensagem separados por linhas finas e o botão redondo de enviar no topo.
// É o mesmo no app E-mail do celular 3D (PhoneScreen) e no Contato do painel e do modo 2D.
// A lógica (validação, envio, avisos) fica no hook useContactForm.
import { profile } from '../content';
import { IconArrow, IconArrowUp, IconCheck, IconCopy } from '../Icons';
import { useContactForm } from '../useContactForm';

// O e-mail não cabe numa linha no celular: o <wbr> deixa a quebra cair antes do @
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

// `onCancel`: só no celular 3D (o "Cancelar" fecha o app e volta para a tela inicial).
// `nameRef`: o campo "De:", que recebe o foco quando o app abre.
export default function MailCompose({ t, lang, idPrefix, onCancel, nameRef }) {
    const c = t.contact;
    const f = c.form;
    const { values, errors, status, note, noteRef, field, update, onSubmit, copied, copy } = useContactForm({
        t,
        lang,
        idPrefix
    });
    const sending = status === 'sending';
    const titleId = field('mail-title');

    // Linha de um campo: rótulo curto à vista ("De:") e o nome completo para o leitor de tela ("Nome").
    // O erro fica logo embaixo, ligado ao campo pelo aria-describedby.
    const describedBy = (name) => (errors[name] ? field(`${name}-err`) : undefined);
    const error = (name) =>
        errors[name] && (
            <p className="mail-error" id={field(`${name}-err`)}>
                {errors[name]}
            </p>
        );

    return (
        <form className="mail" onSubmit={onSubmit} noValidate aria-labelledby={titleId}>
            <div className="mail-bar">
                {onCancel ? (
                    <button type="button" className="mail-cancel" onClick={onCancel}>
                        {f.cancel}
                    </button>
                ) : (
                    <span className="mail-bar-side" aria-hidden="true" />
                )}
                <h3 className="mail-title" id={titleId}>
                    {f.title}
                </h3>
                <button
                    type="submit"
                    className="mail-send"
                    disabled={sending}
                    aria-label={sending ? f.sending : f.send}
                    title={f.send}
                >
                    <IconArrowUp />
                </button>
            </div>

            <div className="mail-row mail-to">
                <span className="mail-label">{f.to}</span>
                <span className="mail-address">{breakBeforeAt(profile.email)}</span>
                <span className="mail-actions">
                    <button
                        type="button"
                        className="mail-icon"
                        onClick={() => copy(profile.email)}
                        aria-label={c.copyEmail}
                        title={copied ? c.emailCopied : c.copyEmail}
                    >
                        {copied ? <IconCheck /> : <IconCopy />}
                    </button>
                    <a className="mail-icon" href={`mailto:${profile.email}`} aria-label={c.openMailApp} title={c.openMailApp}>
                        <IconArrow />
                    </a>
                </span>
                {/* avisa o leitor de tela que copiou (a região existe sempre, só o texto muda) */}
                <span className="sr-only" role="status">
                    {copied ? c.emailCopied : ''}
                </span>
            </div>

            <div className="mail-row">
                <label className="mail-label" htmlFor={field('name')}>
                    <span aria-hidden="true">{f.from}</span>
                    <span className="sr-only">{f.name}</span>
                </label>
                <input
                    ref={nameRef}
                    id={field('name')}
                    className="mail-input"
                    name="name"
                    autoComplete="name"
                    placeholder={f.name}
                    value={values.name}
                    onChange={update('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={describedBy('name')}
                />
            </div>
            {error('name')}

            <div className="mail-row">
                <label className="mail-label" htmlFor={field('email')}>
                    <span aria-hidden="true">{f.emailLabel}</span>
                    <span className="sr-only">{f.email}</span>
                </label>
                <input
                    id={field('email')}
                    className="mail-input"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder={f.emailPlaceholder}
                    value={values.email}
                    onChange={update('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={describedBy('email')}
                />
            </div>
            {error('email')}

            <div className="mail-row mail-body">
                <label className="sr-only" htmlFor={field('message')}>
                    {f.message}
                </label>
                <textarea
                    id={field('message')}
                    className="mail-input mail-text"
                    name="message"
                    rows={6}
                    placeholder={f.messagePlaceholder}
                    value={values.message}
                    onChange={update('message')}
                    aria-invalid={!!errors.message}
                    aria-describedby={describedBy('message')}
                />
            </div>
            {error('message')}

            {/* Campo-isca: só robôs preenchem (fora da tela e fora da ordem do teclado) */}
            <div className="hp" aria-hidden="true">
                <label>
                    Company
                    <input name="company" tabIndex={-1} autoComplete="off" />
                </label>
            </div>

            {/* Avisos do envio. As regiões existem sempre (vazias): assim o leitor de tela lê o texto
                quando ele aparece. "status" espera a pessoa; "alert" (erro) interrompe. */}
            <div role="status">
                {note?.role === 'status' && (
                    <p ref={noteRef} className="form-note">
                        {note.text}
                    </p>
                )}
            </div>
            <div role="alert">
                {note?.role === 'alert' && (
                    <p ref={noteRef} className="form-note is-error">
                        {note.text}
                    </p>
                )}
            </div>
        </form>
    );
}
