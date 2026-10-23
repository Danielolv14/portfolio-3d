// Hora e data da tela do celular (barra de status e widgets de calendário e relógio). Ficam aqui para a camada HTML
// (PhoneScreen) e a textura do celular (room/phoneTexture.js) escreverem exatamente o mesmo texto.
import { useEffect, useState } from 'react';

// '19:42' em português; '7:42' em inglês (relógio de 12 horas, sem AM/PM, como no celular)
export function phoneTime(date, lang) {
    const h = date.getHours();
    const hour = lang === 'pt' ? h : h % 12 || 12;
    return `${hour}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Partes da data para o widget de calendário: 'SEXTA-FEIRA' / 'FRIDAY' e 'outubro' / 'October'
export function phoneWeekday(date, lang) {
    return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long' }).format(date).toUpperCase();
}

export function phoneMonth(date, lang) {
    return new Intl.DateTimeFormat(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long' }).format(date);
}

// Milissegundos até o próximo minuto cheio (e não 60 s a partir de agora)
export function msToNextMinute(date = new Date()) {
    return 60000 - (date.getSeconds() * 1000 + date.getMilliseconds()) + 50;
}

// Data e hora atuais, atualizadas na virada de cada minuto
export function useNow() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        let timer;
        const schedule = () => {
            timer = setTimeout(() => {
                setNow(new Date());
                schedule();
            }, msToNextMinute());
        };
        schedule();
        return () => clearTimeout(timer);
    }, []);
    return now;
}
