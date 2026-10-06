// Envio do formulário de contato pelo EmailJS (sem servidor próprio).
// As chaves vêm do .env.local (desenvolvimento) ou das variáveis de ambiente da Vercel.
import emailjs from '@emailjs/browser';

const config = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID,
    templateForMe: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FOR_ME,
    templateForSender: import.meta.env.VITE_EMAILJS_TEMPLATE_ID_FOR_SENDER,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY
};

export const emailConfigured = Boolean(config.serviceId && config.templateForMe && config.publicKey);

// Envia a mensagem para o Daniel e, se houver o segundo modelo, a confirmação para quem escreveu
export async function sendMessage({ name, email, message, lang }) {
    const params = {
        from_name: name,
        from_email: email,
        reply_to: email,
        message,
        lang
    };
    await emailjs.send(config.serviceId, config.templateForMe, params, { publicKey: config.publicKey });
    if (config.templateForSender) {
        try {
            await emailjs.send(config.serviceId, config.templateForSender, params, { publicKey: config.publicKey });
        } catch {
            // A mensagem principal já chegou; a confirmação é um extra
        }
    }
}
