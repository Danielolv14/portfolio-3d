// Todo o texto do site, em português e inglês.
// Os dados abaixo são de exemplo: troque pelos seus antes de publicar.

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
            globe: 'English',
            view2d: 'Ver sem 3D',
            view3d: 'Ver em 3D',
            close: 'Voltar ao quarto',
            sample: 'Conteúdo de exemplo: será trocado pelos seus dados.',
            loading: 'Montando o quarto…'
        },
        about: {
            name: 'Seu Nome',
            role: 'Estudante de Engenharia de Software · 2º período',
            bio: [
                'Sou estudante de Engenharia de Software e gosto de transformar problemas do dia a dia em sistemas simples de usar.',
                'Tenho experiência com desenvolvimento web e quero crescer como desenvolvedor full stack, trabalhando em produtos usados por muita gente.'
            ],
            interestsTitle: 'Interesses',
            interests: ['Front-end', 'APIs REST', '3D na web', 'UX'],
            goalTitle: 'Objetivo',
            goal: 'Estágio ou vaga júnior em desenvolvimento full stack.',
            readIn: 'Ler em'
        },
        projects: {
            intro: 'Do mais antigo ao mais recente.',
            gif: 'GIF do projeto',
            repo: 'Ver no GitHub',
            items: [
                {
                    date: 'Mar 2024',
                    name: 'Calculadora de Notas',
                    description:
                        'App web que calcula a média do semestre e mostra quanto falta para passar em cada disciplina.',
                    tech: ['HTML', 'CSS', 'JavaScript'],
                    url: 'https://github.com/'
                },
                {
                    date: 'Set 2024',
                    name: 'Agenda de Estudos',
                    description:
                        'Organizador de tarefas com lembretes e visão semanal, salvando os dados no navegador.',
                    tech: ['React', 'Vite', 'LocalStorage'],
                    url: 'https://github.com/'
                },
                {
                    date: 'Mai 2025',
                    name: 'API de Biblioteca',
                    description:
                        'API REST para cadastro de livros e empréstimos, com autenticação e testes automatizados.',
                    tech: ['Node.js', 'Express', 'PostgreSQL'],
                    url: 'https://github.com/'
                },
                {
                    date: 'Out 2026',
                    name: 'Portfólio 3D',
                    description:
                        'Este site: um quarto em 3D onde cada objeto abre uma seção do portfólio.',
                    tech: ['React', 'Three.js', 'React Three Fiber'],
                    url: 'https://github.com/'
                }
            ]
        },
        experience: {
            intro: 'Estágios, freelas e eventos, do mais recente ao mais antigo.',
            items: [
                {
                    org: 'Empresa Exemplo Ltda',
                    role: 'Estagiário de desenvolvimento',
                    period: 'Fev 2026 – atual',
                    description:
                        'Manutenção de um sistema web, correção de bugs e criação de novas telas junto ao time.'
                },
                {
                    org: 'Freelance',
                    role: 'Desenvolvedor web',
                    period: 'Jul 2025 – Dez 2025',
                    description:
                        'Site institucional para um comércio local, do layout à publicação.'
                },
                {
                    org: 'Hackathon Universitário',
                    role: 'Participante',
                    period: 'Out 2025',
                    description:
                        'Protótipo de app para doação de alimentos, feito em 48 horas por uma equipe de quatro pessoas.'
                }
            ]
        },
        contact: {
            intro: 'Escolha o canal que preferir ou me mande uma mensagem por aqui.',
            copy: 'Copiar',
            copied: 'Copiado',
            form: {
                name: 'Nome',
                email: 'E-mail',
                message: 'Mensagem',
                send: 'Enviar mensagem',
                errName: 'Informe seu nome.',
                errEmail: 'Digite um e-mail válido, como nome@exemplo.com.',
                errMessage: 'Escreva uma mensagem com pelo menos 10 caracteres.',
                ok: 'Formulário válido. No site final esta mensagem chega no seu e-mail pelo EmailJS; neste protótipo nada é enviado.'
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
            globe: 'Português',
            view2d: 'View without 3D',
            view3d: 'View in 3D',
            close: 'Back to the room',
            sample: 'Sample content: it will be replaced with your own.',
            loading: 'Building the room…'
        },
        about: {
            name: 'Your Name',
            role: 'Software Engineering student · 2nd semester',
            bio: [
                'I study Software Engineering and enjoy turning everyday problems into systems that are simple to use.',
                'I have experience with web development and want to grow as a full-stack developer, working on products that many people use.'
            ],
            interestsTitle: 'Interests',
            interests: ['Front-end', 'REST APIs', '3D on the web', 'UX'],
            goalTitle: 'Goal',
            goal: 'Internship or junior role in full-stack development.',
            readIn: 'Read in'
        },
        projects: {
            intro: 'From oldest to newest.',
            gif: 'Project GIF',
            repo: 'View on GitHub',
            items: [
                {
                    date: 'Mar 2024',
                    name: 'Grade Calculator',
                    description:
                        'Web app that calculates the semester average and shows what is left to pass each course.',
                    tech: ['HTML', 'CSS', 'JavaScript'],
                    url: 'https://github.com/'
                },
                {
                    date: 'Sep 2024',
                    name: 'Study Planner',
                    description:
                        'Task organizer with reminders and a weekly view, saving data in the browser.',
                    tech: ['React', 'Vite', 'LocalStorage'],
                    url: 'https://github.com/'
                },
                {
                    date: 'May 2025',
                    name: 'Library API',
                    description:
                        'REST API for books and loans, with authentication and automated tests.',
                    tech: ['Node.js', 'Express', 'PostgreSQL'],
                    url: 'https://github.com/'
                },
                {
                    date: 'Oct 2026',
                    name: '3D Portfolio',
                    description:
                        'This website: a 3D room where each object opens a section of the portfolio.',
                    tech: ['React', 'Three.js', 'React Three Fiber'],
                    url: 'https://github.com/'
                }
            ]
        },
        experience: {
            intro: 'Internships, freelance work and events, newest first.',
            items: [
                {
                    org: 'Example Company Ltd',
                    role: 'Software development intern',
                    period: 'Feb 2026 – present',
                    description:
                        'Maintaining a web system, fixing bugs and building new screens with the team.'
                },
                {
                    org: 'Freelance',
                    role: 'Web developer',
                    period: 'Jul 2025 – Dec 2025',
                    description:
                        'Business website for a local shop, from layout to deployment.'
                },
                {
                    org: 'University Hackathon',
                    role: 'Participant',
                    period: 'Oct 2025',
                    description:
                        'Food donation app prototype built in 48 hours by a team of four.'
                }
            ]
        },
        contact: {
            intro: 'Pick the channel you prefer or send me a message right here.',
            copy: 'Copy',
            copied: 'Copied',
            form: {
                name: 'Name',
                email: 'Email',
                message: 'Message',
                send: 'Send message',
                errName: 'Enter your name.',
                errEmail: 'Enter a valid email, like name@example.com.',
                errMessage: 'Write a message with at least 10 characters.',
                ok: 'The form is valid. On the final site this message reaches your inbox through EmailJS; this prototype sends nothing.'
            }
        }
    }
};

// Canais de contato (iguais nos dois idiomas)
export const channels = [
    { id: 'email', label: 'E-mail', value: 'seuemail@exemplo.com', copy: true },
    { id: 'whatsapp', label: 'WhatsApp', value: '+55 31 90000-0000', href: 'https://wa.me/5531900000000' },
    { id: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/seu-perfil', href: 'https://www.linkedin.com/' },
    { id: 'github', label: 'GitHub', value: 'github.com/seu-usuario', href: 'https://github.com/' }
];

export const SECTIONS = ['about', 'projects', 'experience', 'contact'];
