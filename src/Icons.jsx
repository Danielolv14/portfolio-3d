// Ícones em SVG inline (traço único, herdam a cor do texto)
const base = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
};

export const IconUser = () => (
    <svg {...base}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
);

export const IconMonitor = () => (
    <svg {...base}>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M9 20h6M12 16v4" />
    </svg>
);

export const IconBoard = () => (
    <svg {...base}>
        <rect x="3" y="4" width="18" height="15" rx="2" />
        <path d="M7 9h4M7 13h7M15 8l2 2" />
    </svg>
);

export const IconPhone = () => (
    <svg {...base}>
        <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
    </svg>
);

export const IconSun = () => (
    <svg {...base}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
);

export const IconMoon = () => (
    <svg {...base}>
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
    </svg>
);

export const IconCube = () => (
    <svg {...base}>
        <path d="M12 2.5l8.5 4.75v9.5L12 21.5l-8.5-4.75v-9.5z" />
        <path d="M3.5 7.25L12 12l8.5-4.75M12 12v9.5" />
    </svg>
);

export const IconList = () => (
    <svg {...base}>
        <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
);

export const IconClose = () => (
    <svg {...base}>
        <path d="M6 6l12 12M18 6L6 18" />
    </svg>
);

export const IconMail = () => (
    <svg {...base}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3.5 6.5L12 13l8.5-6.5" />
    </svg>
);

export const IconChat = () => (
    <svg {...base}>
        <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.2A8 8 0 1 1 20 12z" />
    </svg>
);

export const IconBriefcase = () => (
    <svg {...base}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18" />
    </svg>
);

export const IconCode = () => (
    <svg {...base}>
        <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />
    </svg>
);

export const IconPlay = () => (
    <svg {...base} width={28} height={28}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M10 8.5v7l5.5-3.5z" fill="currentColor" />
    </svg>
);

export const IconArrow = () => (
    <svg {...base} width={16} height={16}>
        <path d="M7 17L17 7M9 7h8v8" />
    </svg>
);

export const IconCopy = () => (
    <svg {...base} width={18} height={18}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15V6a2 2 0 0 1 2-2h8" />
    </svg>
);

export const IconCheck = () => (
    <svg {...base} width={18} height={18}>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
);

export const IconCamera = () => (
    <svg {...base}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17 7h.01" />
    </svg>
);

export const IconLock = () => (
    <svg {...base} width={15} height={15}>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
);

export const IconUsers = () => (
    <svg {...base} width={15} height={15}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c1-3.5 3.5-5 6.5-5s5.5 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .6 3.2 2.2 3.8 5" />
    </svg>
);

export const IconPin = () => (
    <svg {...base} width={15} height={15}>
        <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.3" />
    </svg>
);

export const channelIcon = {
    email: IconMail,
    whatsapp: IconChat,
    linkedin: IconBriefcase,
    github: IconCode,
    instagram: IconCamera
};

export const sectionIcon = {
    about: IconUser,
    projects: IconMonitor,
    experience: IconBoard,
    contact: IconPhone
};
