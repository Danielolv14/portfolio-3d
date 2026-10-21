// Lógica do formulário de contato, num lugar só. Quem usa: o app E-mail do celular 3D
// (screens/PhoneScreen) e o Contato no painel, na folha do celular e no modo 2D (Sections.jsx).
// Cuida da validação, do campo-isca contra robôs, do envio pelo EmailJS e dos avisos.
import { useEffect, useRef, useState } from 'react';

import { emailConfigured, sendMessage } from './email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMPTY = { name: '', email: '', message: '' };

// Rascunho guardado fora do componente: fechar o app (ou o celular) e abrir de novo não apaga o que
// a pessoa já escreveu. Fica só na memória da aba; recarregar a página começa do zero.
let draft = EMPTY;

export function useContactForm({ t, lang, idPrefix }) {
    const f = t.contact.form;
    const [values, setValues] = useState(draft);
    const [errors, setErrors] = useState({});
    // idle | sending | sent | offline | error
    const [status, setStatus] = useState('idle');
    const [copied, setCopied] = useState(false);
    // Aviso depois do envio (enviando, enviado, sem configuração ou erro)
    const noteRef = useRef(null);
    const copyTimer = useRef(null);

    // ids únicos por lugar (o painel e o modo 2D podem ter o formulário ao mesmo tempo)
    const field = (name) => `${idPrefix}-${name}`;

    // O aviso aparece embaixo da mensagem, quase sempre fora da parte visível: rola até ele
    useEffect(() => {
        noteRef.current?.scrollIntoView({ block: 'nearest' });
    }, [status]);

    useEffect(() => () => clearTimeout(copyTimer.current), []);

    const update = (name) => (event) => {
        const next = { ...values, [name]: event.target.value };
        draft = next;
        setValues(next);
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
            // enviado: o rascunho some (mesmo se o app já tiver fechado no meio do envio)
            draft = EMPTY;
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
            clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
            setCopied(false);
        }
    };

    // role="status" é lido sem interromper; "alert" interrompe (só no erro)
    const note = {
        sending: { text: f.sending, role: 'status' },
        sent: { text: f.sent, role: 'status' },
        offline: { text: f.offline, role: 'status' },
        error: { text: f.failed, role: 'alert' }
    }[status];

    return { values, errors, status, note, noteRef, field, update, onSubmit, copied, copy };
}
