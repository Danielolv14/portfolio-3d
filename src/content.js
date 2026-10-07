import foto from './assets/foto.jpg';

// Todo o texto e os dados do site.
// O que muda com o idioma fica em `pt` / `en`; links, datas e tecnologias ficam uma vez só em cada item.

export const profile = {
    name: 'Daniel Oliveira',
    initials: 'DO',
    photo: foto,
    email: 'danieloliveiramenezes4@gmail.com'
};

// Datas no formato 'aaaa-mm' para ordenar a linha do tempo
const PROJECTS = [
    {
        id: 'djfinance',
        date: '2026-03',
        // nomes de tecnologias são os mesmos em PT e EN (por isso "Google APIs", o nome do produto)
        tech: ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'Tailwind CSS', 'Google APIs'],
        links: [
            { kind: 'back', url: 'https://github.com/Danielolv14/DJFinance-Back-End' },
            { kind: 'front', url: 'https://github.com/Danielolv14/DJFinance-Front-End' },
            { kind: 'demo', url: 'https://dj-finance-front-end.vercel.app' }
        ],
        pt: {
            name: 'DJFinance',
            description:
                'Sistema que facilita o fechamento financeiro mensal de um DJ: cadastro de shows, cálculo automático do fechamento e relatórios em PDF e Excel, com integração às APIs do Google.',
            role: 'Projeto pessoal, feito do zero: API REST em Java e interface web em React.'
        },
        en: {
            name: 'DJFinance',
            description:
                "A system that makes a DJ's monthly financial closing easier: show registration, automatic closing calculations and PDF and Excel reports, integrated with Google APIs.",
            role: 'Personal project built from scratch: a Java REST API and a React web interface.'
        }
    },
    {
        id: 'loginpuc',
        date: '2026-08',
        tech: ['Java', 'Spring Boot', 'Spring Security', 'Thymeleaf', 'H2'],
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/Tela-de-Login-da-PUC-com-Spring-Boot-Thymeleaf' }],
        pt: {
            name: 'Login PUC Minas',
            description:
                'Sistema de login, cadastro e recuperação de senha com o visual da PUC Minas. As senhas são guardadas com BCrypt e a recuperação é feita por e-mail, com um link de uso único.',
            role: 'Feito sozinho, do back-end à interface.'
        },
        en: {
            name: 'PUC Minas Login',
            description:
                'Login, sign-up and password recovery system styled after PUC Minas. Passwords are stored with BCrypt and recovery works by email, with a single-use link.',
            role: 'Built on my own, from back end to interface.'
        }
    },
    {
        id: 'minhareceita',
        date: '2026-08',
        tech: ['Java 21', 'Spring Boot', 'MongoDB', 'HTML', 'CSS', 'JavaScript'],
        links: [],
        privateRepo: true,
        team: true,
        pt: {
            name: 'MinhaReceita',
            description:
                'Receita médica digital para o SUS, com assinatura digital e um código único por receita. O médico emite, o paciente apresenta e o farmacêutico confere o código na hora de entregar o remédio.',
            role: 'Trabalho Interdisciplinar do 4º período, em equipe de quatro pessoas. Minha parte: login e a área do farmacêutico.'
        },
        en: {
            name: 'MinhaReceita',
            description:
                "A digital medical prescription for Brazil's public health system (SUS), with a digital signature and a unique code per prescription. The doctor issues it, the patient presents it and the pharmacist checks the code before handing over the medicine.",
            role: 'Interdisciplinary project of the 4th semester, in a team of four. My part: login and the pharmacist area.'
        }
    },
    {
        id: 'tse',
        date: '2026-09',
        tech: ['Java', 'Spring Boot', 'Thymeleaf', 'OpenCSV'],
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/CandidatosTse-with-Thymeleaf' }],
        pt: {
            name: 'Candidatos TSE',
            description:
                'Mostra o perfil dos candidatos das eleições de 2026 em Minas Gerais a partir do arquivo oficial do TSE, com filtros por gênero, escolaridade e faixa etária e a foto de cada candidato.',
            role: 'Feito sozinho.'
        },
        en: {
            name: 'TSE Candidates',
            description:
                "Shows the profile of the 2026 election candidates in Minas Gerais from the electoral court's official file, with filters by gender, education and age range, plus each candidate's photo.",
            role: 'Built on my own.'
        }
    },
    {
        id: 'portfolio',
        date: '2026-10',
        tech: ['React', 'Three.js', 'React Three Fiber', 'Vite'],
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/portfolio-3d' }],
        pt: {
            name: 'Portfólio 3D',
            description: 'Este site: um quarto em 3D onde cada objeto abre uma seção do portfólio.',
            role: ''
        },
        en: {
            name: '3D Portfolio',
            description: 'This website: a 3D room where each object opens a section of the portfolio.',
            role: ''
        }
    }
];

const EXPERIENCES = [
    {
        id: 'teknisa',
        org: 'Teknisa',
        url: 'https://www.teknisa.com/',
        start: '2026-06',
        end: null,
        tech: ['PHP', 'JavaScript', 'Vue.js', 'TypeScript', 'Zeedhi', 'SQL Server'],
        pt: {
            role: 'Estagiário de desenvolvimento Full Stack',
            description:
                'Atuo no módulo de Retail, na Frente de Caixa (PDV), desenvolvendo e mantendo sistemas em produção usados por operações de varejo e food service.',
            highlights: [
                'Desenvolvimento full stack com PHP, JavaScript e os frameworks Zeedhi e Zeedhi Next (Vue.js + TypeScript)',
                'Novas funcionalidades e regras de negócio para o PDV, do back-end à interface',
                'Análise, investigação e correção de bugs em ambiente de produção',
                'Consultas e manipulação de dados em SQL Server para diagnóstico e sustentação',
                'Testes de sistemas e documentação técnica das entregas',
                'Padrões de código da Teknisa: Fail Fast, reutilização de código, tratamento de exceções e nomenclatura padronizada',
                'Treinamentos, reuniões e ritos do time de desenvolvimento'
            ]
        },
        en: {
            role: 'Full Stack Development Intern',
            description:
                'I work on the Retail module, on the point of sale (POS), building and maintaining production systems used by retail and food service operations.',
            highlights: [
                'Full stack development with PHP, JavaScript and the Zeedhi and Zeedhi Next frameworks (Vue.js + TypeScript)',
                'New features and business rules for the POS, from back end to interface',
                'Analyzing, investigating and fixing bugs in production',
                'SQL Server queries and data handling for diagnostics and support',
                'System testing and technical documentation of each delivery',
                "Teknisa's coding standards: fail fast, code reuse, exception handling and consistent naming",
                "Trainings, meetings and the development team's rituals"
            ]
        }
    }
];

// '2026-03' -> 'mar 2026' (ou 'Mar 2026' em inglês). Usado nas seções e na tela 3D do monitor.
export function monthLabel(iso, t) {
    const [year, month] = iso.split('-');
    return `${t.ui.months[Number(month) - 1]} ${year}`;
}

function localize(list, lang) {
    return list.map(({ pt, en, ...shared }) => ({ ...shared, ...(lang === 'pt' ? pt : en) }));
}

export const content = {
    pt: {
        ui: {
            nav: {
                about: 'Sobre mim',
                projects: 'Projetos',
                experience: 'Experiências',
                contact: 'Contato'
            },
            hint: 'Arraste para girar · role para aproximar · clique nos objetos',
            hintTouch: 'Arraste para girar · toque nos objetos',
            day: 'Dia',
            night: 'Noite',
            toDay: 'Modo dia',
            toNight: 'Modo noite',
            langButton: 'EN',
            langLabel: 'Mudar para inglês',
            view2d: 'Ver sem 3D',
            view3d: 'Ver em 3D',
            close: 'Voltar ao quarto',
            loading: 'Montando o quarto…',
            months: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
            present: 'atual',
            // Seções que abrem dentro de uma tela do quarto (src/screens)
            screen: {
                path: { projects: '~/projetos' },
                closeWindow: 'Fechar janela',
                read2d: 'Ler em 2D',
                escHint: 'Esc volta ao quarto'
            }
        },
        about: {
            role: 'Estudante de Engenharia de Software, curioso e motivado',
            readIn: 'Ler em',
            bio: [
                'Sou estudante de Engenharia de Software na PUC Minas, no 4º período, e estagiário de desenvolvimento Full Stack na Teknisa, onde desenvolvo e mantenho a Frente de Caixa (PDV) do módulo de Retail.',
                'No dia a dia lido com regras de negócio de varejo e food service, investigo e corrijo bugs em produção e crio novas funcionalidades, do back-end à interface. Fora do trabalho, é no back-end que me sinto em casa: Java com Spring Boot, PostgreSQL e APIs REST.'
            ],
            educationTitle: 'Formação',
            education: [
                {
                    course: 'Engenharia de Software',
                    school: 'PUC Minas',
                    detail: '4º período · jan 2025 – nov 2028 (previsão)'
                }
            ],
            stackTitle: 'Tecnologias',
            stack: ['Java', 'Spring Boot', 'PHP', 'JavaScript', 'TypeScript', 'Vue.js', 'React', 'HTML e CSS', 'PostgreSQL', 'MySQL', 'SQL Server', 'MongoDB', 'C e C++', 'Git'],
            interestsTitle: 'Interesses',
            interests: ['Back-end', 'Full stack', 'Arquitetura limpa', 'Performance', 'Integrações entre sistemas'],
            goalTitle: 'Objetivo',
            goal: 'Crescer na carreira como desenvolvedor, me aprofundando em back-end, arquitetura e integrações entre sistemas.',
            languagesTitle: 'Idiomas',
            languages: 'Português (nativo) · Inglês (intermediário)',
            offTitle: 'Fora do código',
            off: 'Futevôlei, games e filmes.',
            location: 'Belo Horizonte, MG'
        },
        projects: {
            intro: 'Do mais antigo ao mais recente.',
            gif: 'GIF em breve',
            links: {
                repo: 'Ver no GitHub',
                back: 'Back-end',
                front: 'Front-end',
                demo: 'Ver online'
            },
            privateRepo: 'Repositório privado da disciplina',
            team: 'Em equipe',
            items: localize(PROJECTS, 'pt')
        },
        experience: {
            intro: 'Do mais recente ao mais antigo.',
            items: localize(EXPERIENCES, 'pt')
        },
        contact: {
            intro: 'Escolha o canal que preferir ou me mande uma mensagem por aqui.',
            copy: 'Copiar',
            copied: 'Copiado',
            open: 'Abrir',
            form: {
                name: 'Nome',
                email: 'E-mail',
                message: 'Mensagem',
                send: 'Enviar mensagem',
                sending: 'Enviando…',
                errName: 'Informe seu nome.',
                errEmail: 'Digite um e-mail válido, como nome@exemplo.com.',
                errMessage: 'Escreva uma mensagem com pelo menos 10 caracteres.',
                sent: 'Mensagem enviada! Respondo assim que puder. Você também vai receber uma confirmação no seu e-mail.',
                failed: 'Não consegui enviar agora. Tente de novo em alguns minutos ou escreva direto para o e-mail acima.',
                offline: 'O envio pelo site ainda não está configurado. Por enquanto, escreva direto para o e-mail acima.'
            }
        }
    },
    en: {
        ui: {
            nav: {
                about: 'About me',
                projects: 'Projects',
                experience: 'Experience',
                contact: 'Contact'
            },
            hint: 'Drag to rotate · scroll to zoom · click the objects',
            hintTouch: 'Drag to rotate · tap the objects',
            day: 'Day',
            night: 'Night',
            toDay: 'Day mode',
            toNight: 'Night mode',
            langButton: 'PT',
            langLabel: 'Switch to Portuguese',
            view2d: 'View without 3D',
            view3d: 'View in 3D',
            close: 'Back to the room',
            loading: 'Building the room…',
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            present: 'present',
            screen: {
                path: { projects: '~/projects' },
                closeWindow: 'Close window',
                read2d: 'Read in 2D',
                escHint: 'Esc goes back to the room'
            }
        },
        about: {
            role: 'A curious and driven Software Engineering student',
            readIn: 'Read in',
            bio: [
                "I'm a Software Engineering student at PUC Minas, in my 4th semester, and a Full Stack Development Intern at Teknisa, where I build and maintain the Retail module's point of sale (POS).",
                'Day to day I deal with retail and food service business rules, investigate and fix bugs in production and build new features, from back end to interface. Outside work, back end is where I feel at home: Java with Spring Boot, PostgreSQL and REST APIs.'
            ],
            educationTitle: 'Education',
            education: [
                {
                    course: 'Software Engineering',
                    school: 'PUC Minas',
                    detail: '4th semester · Jan 2025 – Nov 2028 (expected)'
                }
            ],
            stackTitle: 'Tech stack',
            stack: ['Java', 'Spring Boot', 'PHP', 'JavaScript', 'TypeScript', 'Vue.js', 'React', 'HTML & CSS', 'PostgreSQL', 'MySQL', 'SQL Server', 'MongoDB', 'C & C++', 'Git'],
            interestsTitle: 'Interests',
            interests: ['Back end', 'Full stack', 'Clean architecture', 'Performance', 'System integrations'],
            goalTitle: 'Goal',
            goal: 'Grow my career as a developer, going deeper into back end, architecture and system integrations.',
            languagesTitle: 'Languages',
            languages: 'Portuguese (native) · English (intermediate)',
            offTitle: 'Off the keyboard',
            off: 'Footvolley, games and movies.',
            location: 'Belo Horizonte, Brazil'
        },
        projects: {
            intro: 'From oldest to newest.',
            gif: 'GIF coming soon',
            links: {
                repo: 'View on GitHub',
                back: 'Back end',
                front: 'Front end',
                demo: 'Live demo'
            },
            privateRepo: 'Private course repository',
            team: 'Team project',
            items: localize(PROJECTS, 'en')
        },
        experience: {
            intro: 'Newest first.',
            items: localize(EXPERIENCES, 'en')
        },
        contact: {
            intro: 'Pick the channel you prefer or send me a message right here.',
            copy: 'Copy',
            copied: 'Copied',
            open: 'Open',
            form: {
                name: 'Name',
                email: 'Email',
                message: 'Message',
                send: 'Send message',
                sending: 'Sending…',
                errName: 'Enter your name.',
                errEmail: 'Enter a valid email, like name@example.com.',
                errMessage: 'Write a message with at least 10 characters.',
                sent: "Message sent! I'll reply as soon as I can. You'll also get a confirmation in your inbox.",
                failed: "I couldn't send it right now. Try again in a few minutes or write straight to the email above.",
                offline: "Sending from the site isn't set up yet. For now, write straight to the email above."
            }
        }
    }
};

// Canais de contato (iguais nos dois idiomas). O WhatsApp fica de fora por escolha do Daniel.
export const channels = [
    { id: 'email', label: 'E-mail', value: profile.email, copy: true },
    { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/daniel-oliveira14', href: 'https://www.linkedin.com/in/daniel-oliveira14/' },
    { id: 'github', label: 'GitHub', value: 'github.com/Danielolv14', href: 'https://github.com/Danielolv14' },
    { id: 'instagram', label: 'Instagram', value: '@danielolvz', href: 'https://www.instagram.com/danielolvz/' }
];

export const SECTIONS = ['about', 'projects', 'experience', 'contact'];
