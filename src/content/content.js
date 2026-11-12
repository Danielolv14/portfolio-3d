import foto from './foto.jpg';
import { linkedinEn, linkedinPt } from './linkedin';
import printDjfinance from './projetos/djfinance.jpg';
import printEstudos from './projetos/app-de-estudos.jpg';
import printLoginPuc from './projetos/login-puc.jpg';
import printMinhaReceita from './projetos/minhareceita.jpg';
import printPortfolio from './projetos/portfolio-3d.jpg';
import printRota from './projetos/rota.jpg';
import printTse from './projetos/candidatos-tse.jpg';

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
        tech: ['Java', 'Spring Boot', 'PostgreSQL', 'React', 'Google Calendar API', 'Railway', 'Vercel'],
        media: printDjfinance,
        links: [
            { kind: 'back', url: 'https://github.com/Danielolv14/DJFinance-Back-End' },
            { kind: 'front', url: 'https://github.com/Danielolv14/DJFinance-Front-End' },
            { kind: 'demo', url: 'https://dj-finance-front-end.vercel.app' }
        ],
        pt: {
            name: 'DJFinance',
            description:
                'O sistema que uso de verdade como produtor dos DJs DRUDS e Braichi: shows, agenda, itinerários, cadastro de contratantes, sincronização com o Google Agenda e o fechamento financeiro mensal em PDF e Excel.',
            role: 'Projeto pessoal, feito sozinho e em produção. As regras de pagamento ficam na API e são cobertas por testes. Numa refatoração em fases, tirei cerca de 1.300 linhas de código morto, conferindo que os fechamentos saíam idênticos antes e depois.'
        },
        en: {
            name: 'DJFinance',
            description:
                'The system I actually use as the producer of DJs DRUDS and Braichi: shows, schedule, itineraries, a client directory, Google Calendar sync and the monthly financial closing in PDF and Excel.',
            role: 'Personal project, built on my own and running in production. Payment rules live in the API and are covered by tests. In a phased refactor I removed about 1,300 lines of dead code, checking that every closing came out identical before and after.'
        }
    },
    {
        id: 'loginpuc',
        date: '2026-08',
        tech: ['Java', 'Spring Boot', 'Spring Security', 'Thymeleaf', 'H2'],
        // prints em 16:9, o formato da mídia do card
        media: printLoginPuc,
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/Tela-de-Login-da-PUC-com-Spring-Boot-Thymeleaf' }],
        // outro repositório do mesmo projeto (é o que está fixado no perfil do GitHub); no monitor, abre esta página
        otherRepos: ['https://github.com/Danielolv14/Login-PUC-Minas-with-Thymeleaf-and-Springboot'],
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
        tech: ['React', 'Vite', 'Next.js', 'MongoDB'],
        media: printMinhaReceita,
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/MinhaReceita' }],
        team: true,
        pt: {
            name: 'MinhaReceita',
            description:
                'Receita médica digital para o SUS, com assinatura digital e um código único por receita. O médico emite, o paciente apresenta e o farmacêutico confere o código na hora de entregar o remédio.',
            role: 'Trabalho Interdisciplinar do 4º período, em equipe de quatro pessoas. Minha parte: o login e as telas do paciente (receitas, detalhe, código e QR Code) e da farmácia.'
        },
        en: {
            name: 'MinhaReceita',
            description:
                "A digital medical prescription for Brazil's public health system (SUS), with a digital signature and a unique code per prescription. The doctor issues it, the patient presents it and the pharmacist checks the code before handing over the medicine.",
            role: 'Interdisciplinary project of the 4th semester, in a team of four. My part: login and the patient screens (prescriptions, details, code and QR Code) and the pharmacy screens.'
        }
    },
    {
        id: 'tse',
        date: '2026-09',
        tech: ['Java', 'Spring Boot', 'Thymeleaf', 'OpenCSV'],
        media: printTse,
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
        tech: ['React', 'Three.js', 'React Three Fiber', 'Vite', 'Blender', 'Python'],
        media: printPortfolio,
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/portfolio-3d' }],
        pt: {
            name: 'Portfólio 3D',
            description:
                'Este site: o meu quarto recriado em 3D, em que cada objeto abre uma seção (projetos no monitor, experiências na TV, contato no celular), em português e inglês.',
            role: 'Feito sozinho. A luz é calculada no Blender por um pipeline em Python, e o JavaScript inicial caiu de 477 para 93 KB.'
        },
        en: {
            name: '3D Portfolio',
            description:
                'This website: my bedroom recreated in 3D, where each object opens a section (projects on the monitor, experience on the TV, contact on the phone), in Portuguese and English.',
            role: 'Built on my own. The lighting is baked in Blender by a Python pipeline, and the initial JavaScript went from 477 KB down to 93 KB.'
        }
    },
    {
        id: 'rota',
        date: '2026-10',
        tech: ['Java 25', 'Spring Boot 4', 'Spring Security', 'JWT', 'React', 'Supabase'],
        media: printRota,
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/CarRentalApp' }],
        pt: {
            name: 'Rota: aluguel de carros',
            description:
                'Sistema web de aluguel de carros para clientes, locadoras e bancos: pedidos com acompanhamento de status, parecer financeiro, crédito bancário e contratos.',
            role: 'Trabalho individual da PUC Minas. API REST em MVC com acesso por perfil (BCrypt e JWT), modelagem UML e 64 testes automatizados no back-end.'
        },
        en: {
            name: 'Rota: car rental',
            description:
                'A car rental web system for customers, rental companies and banks: orders with status tracking, financial review, bank credit and contracts.',
            role: 'Individual project at PUC Minas. An MVC REST API with role-based access (BCrypt and JWT), UML modeling and 64 automated back-end tests.'
        }
    },
    {
        id: 'estudos',
        date: '2026-11',
        tech: ['Electron', 'React', 'TypeScript', 'SQLite', 'Vitest', 'Canvas API'],
        media: printEstudos,
        links: [{ kind: 'repo', url: 'https://github.com/Danielolv14/app-de-estudos' }],
        pt: {
            name: 'App de Estudos',
            description:
                'App de desktop que organiza a minha rotina de estudos (plano do dia, provas e timer de foco) e bloqueia sites e jogos durante a sessão. Puxa matérias, prazos, notas e PDFs do Canvas da PUC, e uma IA monta aulas e simulados.',
            role: 'Projeto pessoal, feito porque eu não conseguia focar. O bloqueio roda num serviço do Windows que falha fechado: se algo der errado, continua bloqueando. 111 testes.'
        },
        en: {
            name: 'Study App',
            description:
                "A desktop app that organizes my study routine (daily plan, exams and a focus timer) and blocks websites and games during the session. It pulls courses, deadlines, grades and PDFs from PUC's Canvas, and an AI builds lessons and practice tests.",
            role: "Personal project, built because I couldn't focus. Blocking runs in a Windows service that fails closed: if anything goes wrong, it keeps blocking. 111 tests."
        }
    }
];

// Ordem da vitrine do monitor (aba Projetos): a mesma do currículo, os principais primeiro
const SHOWCASE = ['djfinance', 'estudos', 'rota', 'portfolio', 'minhareceita', 'tse', 'loginpuc'];

const EXPERIENCES = [
    {
        id: 'teknisa',
        org: 'Teknisa',
        url: 'https://www.teknisa.com/',
        start: '2026-06',
        end: null,
        tech: ['PHP', 'JavaScript', 'Vue.js', 'TypeScript', 'Zeedhi', 'SQL Server', 'PostgreSQL'],
        pt: {
            role: 'Desenvolvedor Full Stack (estágio)',
            description:
                'Desenvolvo do back-end à interface na Frente de Caixa (PDV) do módulo de Retail, um sistema em produção usado por operações de varejo e food service: mesa, comanda, balcão e delivery, com emissão de NFC-e e NF-e.',
            highlights: [
                'Troca de produto em mesa e comanda, com liberação por supervisor e log de auditoria',
                'Desconto manual por produto na venda balcão',
                'Escolha entre NF-e e NFC-e em vendas com CNPJ',
                'XML da NFC-e adequado à NT 2026.008 da reforma tributária (IBS/CBS e valores líquidos), com vendas autorizadas na SEFAZ-SP',
                'Investigação de bugs em produção com SQL, como um fuso horário errado na impressão de pedidos',
                'PHP, JavaScript e os frameworks Zeedhi e Zeedhi Next (Vue.js + TypeScript), seguindo os padrões da Teknisa: Fail Fast, reutilização de código e tratamento de exceções',
                'Documentação de cada entrega para o QA'
            ]
        },
        en: {
            role: 'Full Stack Developer (intern)',
            description:
                'I work from back end to interface on the Retail module point of sale (POS), a production system used by retail and food service operations: tables, tabs, counter and delivery, issuing NFC-e and NF-e electronic invoices.',
            highlights: [
                'Product swap on tables and tabs, with supervisor approval and an audit log',
                'Manual per-item discount on counter sales',
                'Choosing between NF-e and NFC-e on sales to companies (CNPJ)',
                "Updated the NFC-e XML to technical note 2026.008 of Brazil's tax reform (IBS/CBS and net values), with sales authorized by SEFAZ-SP",
                'Investigating production bugs with SQL, such as a wrong time zone on printed orders',
                "PHP, JavaScript and the Zeedhi and Zeedhi Next frameworks (Vue.js + TypeScript), following Teknisa's standards: fail fast, code reuse and exception handling",
                'Documenting each delivery for QA'
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
                path: { projects: 'github.com/Danielolv14', experience: 'linkedin.com/in/danielolvz' },
                closeWindow: 'Fechar janela',
                read2d: 'Ler em 2D',
                escHint: 'Esc volta ao quarto',
                escHome: 'Esc volta à tela inicial'
            }
        },
        // Créditos dos modelos de terceiros (src/sections/Credits.jsx; a lista fica em creditos.js)
        credits: {
            button: 'Créditos',
            title: 'Créditos',
            intro: 'O quarto, o código e as artes próprias são de Daniel Oliveira de Menezes. Os modelos e texturas abaixo são de terceiros, usados conforme a licença de cada um.',
            ccByTitle: 'Modelos 3D (Sketchfab)',
            by: 'de',
            changes: 'Alterações feitas em todos: escala, redução de polígonos e conversão para glTF; na JBL, também a cor.',
            cc0Title: 'Texturas e modelos',
            textures: 'Texturas',
            models: 'Modelos',
            trademarks: 'As marcas que aparecem nos modelos pertencem aos seus donos e só retratam objetos do quarto.'
        },
        about: {
            role: 'Desenvolvedor Full Stack · Estudante de Engenharia de Software',
            readIn: 'Ler em',
            bio: [
                'Sou estagiário Full Stack na Teknisa, no PDV de varejo e food service (um sistema em produção, com NFC-e e NF-e), e estudante de Engenharia de Software na PUC Minas, no 4º período.',
                'Fora do estágio, construo projetos completos com Java, Spring Boot, React e TypeScript, do banco ao deploy: um sistema financeiro que uso de verdade, um app que bloqueia as distrações enquanto eu estudo e este quarto em 3D. É no back-end que me sinto em casa, e quero crescer em arquitetura e integração entre sistemas.'
            ],
            educationTitle: 'Formação e certificados',
            education: [
                {
                    course: 'Engenharia de Software',
                    school: 'PUC Minas',
                    detail: '4º período · fev 2026 – nov 2028 (previsão)'
                },
                {
                    course: 'Ciência da Computação',
                    school: 'PUC Minas',
                    detail: '2024 – 2026 · hackathons, maratonas de programação, projetos e monitoria. Me transferi para Engenharia de Software.'
                },
                {
                    course: 'Banco de Dados SQL do Zero ao Avançado',
                    school: 'Udemy',
                    detail: 'Certificado · mai 2026'
                },
                {
                    course: 'HTML, CSS e JavaScript Essencial',
                    school: 'Udemy',
                    detail: 'Certificado · abr 2026'
                }
            ],
            stackTitle: 'Tecnologias',
            stack: [
                'Java',
                'Spring Boot',
                'Spring Security',
                'APIs REST',
                'PHP',
                'JavaScript',
                'TypeScript',
                'React',
                'Vue.js',
                'Electron',
                'Three.js',
                'HTML e CSS',
                'PostgreSQL',
                'SQL Server',
                'MySQL',
                'MongoDB',
                'SQLite',
                'JUnit',
                'Vitest',
                'Git',
                'Python',
                'C e C++'
            ],
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
            // Tela do monitor, no estilo de um perfil do GitHub (src/screens/MonitorScreen.jsx)
            gh: {
                overview: 'Visão geral',
                repositories: 'Repositórios',
                pinned: 'Projetos fixados',
                public: 'Público',
                private: 'Privado',
                followers: (n) => (n === 1 ? 'seguidor' : 'seguidores'),
                following: 'seguindo',
                updated: 'Atualizado em',
                started: 'Começou em',
                back: 'Repositórios',
                readme: 'README',
                whatIDid: 'O que eu fiz',
                built: 'Feito com',
                profile: 'Ver perfil no GitHub',
                // Aba Projetos (a vitrine com o print de cada um), a que abre primeiro
                projects: 'Projetos',
                showcaseIntro: 'Os principais primeiro. Clique num projeto para ver os detalhes.',
                details: 'Ver detalhes de',
                // "57 contribuições no último ano"
                contributions: (n) => `${n} ${n === 1 ? 'contribuição' : 'contribuições'} no último ano`,
                activity: (n) => `${n} ${n === 1 ? 'atividade pública' : 'atividades públicas'} no último ano`,
                less: 'Menos',
                more: 'Mais',
                day: (n, date) => `${n} em ${date}`
            },
            items: localize(PROJECTS, 'pt'),
            showcase: SHOWCASE
        },
        experience: {
            intro: 'Do mais recente ao mais antigo.',
            // Tela da TV: o perfil do LinkedIn (src/content/linkedin.js, mostrado em src/screens/TvScreen.jsx)
            li: linkedinPt,
            items: localize(EXPERIENCES, 'pt')
        },
        contact: {
            intro: 'Escolha o canal que preferir ou me mande uma mensagem por aqui.',
            // Apps (ícones) e o cartão da tela inicial do celular
            mailApp: 'E-mail',
            mailAppHint: 'escrever uma mensagem',
            newTab: 'abre em nova aba',
            // Tela inicial do celular (PhoneScreen e a textura dele): o widget de contato, os widgets de
            // calendário e relógio, o de Notas e a pílula de busca
            cardLines: ['Engenharia de Software', 'PUC Minas · Belo Horizonte'],
            clockCity: 'Belo Horizonte',
            today: 'Hoje',
            notesApp: 'Notas',
            noteTitle: 'Sobre mim',
            // linhas já quebradas: a textura do celular escreve exatamente as mesmas
            noteLines: [
                'Estudante de Engenharia de Software na',
                'PUC Minas e estagiário Full Stack na',
                'Teknisa. Me sinto em casa no back-end.'
            ],
            search: 'Pesquisar',
            copyEmail: 'Copiar e-mail',
            emailCopied: 'E-mail copiado',
            openMailApp: 'Abrir no seu app de e-mail',
            // Formulário no estilo do app de e-mail (os rótulos curtos aparecem; os longos são lidos)
            form: {
                title: 'Nova mensagem',
                cancel: 'Cancelar',
                to: 'Para:',
                from: 'De:',
                emailLabel: 'E-mail:',
                name: 'Seu nome',
                email: 'Seu e-mail',
                message: 'Mensagem',
                emailPlaceholder: 'voce@exemplo.com',
                messagePlaceholder: 'Escreva sua mensagem…',
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
                path: { projects: 'github.com/Danielolv14', experience: 'linkedin.com/in/danielolvz' },
                closeWindow: 'Close window',
                read2d: 'Read in 2D',
                escHint: 'Esc goes back to the room',
                escHome: 'Esc goes back to the home screen'
            }
        },
        // Créditos dos modelos de terceiros (src/sections/Credits.jsx; a lista fica em creditos.js)
        credits: {
            button: 'Credits',
            title: 'Credits',
            intro: 'The room, the code and the original art are by Daniel Oliveira de Menezes. The models and textures below are third-party works, used under their licenses.',
            ccByTitle: '3D models (Sketchfab)',
            by: 'by',
            changes: 'Changes made to all of them: scale, polygon reduction and conversion to glTF; on the JBL, also the color.',
            cc0Title: 'Textures and models',
            textures: 'Textures',
            models: 'Models',
            trademarks: 'Brands shown on the models belong to their owners and only portray objects in the room.'
        },
        about: {
            role: 'Full Stack Developer · Software Engineering student',
            readIn: 'Read in',
            bio: [
                "I'm a Full Stack intern at Teknisa, working on a retail and food service point of sale (a production system that issues NFC-e and NF-e invoices), and a Software Engineering student at PUC Minas, in my 4th semester.",
                'Outside the internship I build complete projects with Java, Spring Boot, React and TypeScript, from database to deploy: a financial system I actually use, an app that blocks distractions while I study and this 3D room. Back end is where I feel at home, and I want to grow in architecture and system integration.'
            ],
            educationTitle: 'Education & certificates',
            education: [
                {
                    course: 'Software Engineering',
                    school: 'PUC Minas',
                    detail: '4th semester · Feb 2026 – Nov 2028 (expected)'
                },
                {
                    course: 'Computer Science',
                    school: 'PUC Minas',
                    detail: '2024 – 2026 · hackathons, programming contests, projects and teaching assistance. I transferred to Software Engineering.'
                },
                {
                    course: 'SQL Databases from Zero to Advanced',
                    school: 'Udemy',
                    detail: 'Certificate · May 2026'
                },
                {
                    course: 'HTML, CSS and JavaScript Essentials',
                    school: 'Udemy',
                    detail: 'Certificate · Apr 2026'
                }
            ],
            stackTitle: 'Tech stack',
            stack: [
                'Java',
                'Spring Boot',
                'Spring Security',
                'REST APIs',
                'PHP',
                'JavaScript',
                'TypeScript',
                'React',
                'Vue.js',
                'Electron',
                'Three.js',
                'HTML & CSS',
                'PostgreSQL',
                'SQL Server',
                'MySQL',
                'MongoDB',
                'SQLite',
                'JUnit',
                'Vitest',
                'Git',
                'Python',
                'C & C++'
            ],
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
            gh: {
                overview: 'Overview',
                repositories: 'Repositories',
                pinned: 'Pinned projects',
                public: 'Public',
                private: 'Private',
                followers: (n) => (n === 1 ? 'follower' : 'followers'),
                following: 'following',
                updated: 'Updated',
                started: 'Started',
                back: 'Repositories',
                readme: 'README',
                whatIDid: 'What I did',
                built: 'Built with',
                profile: 'View profile on GitHub',
                projects: 'Projects',
                showcaseIntro: 'Main ones first. Click a project to see the details.',
                details: 'See details of',
                contributions: (n) => `${n} ${n === 1 ? 'contribution' : 'contributions'} in the last year`,
                activity: (n) => `${n} public ${n === 1 ? 'activity' : 'activities'} in the last year`,
                less: 'Less',
                more: 'More',
                day: (n, date) => `${n} on ${date}`
            },
            items: localize(PROJECTS, 'en'),
            showcase: SHOWCASE
        },
        experience: {
            intro: 'Newest first.',
            li: linkedinEn,
            items: localize(EXPERIENCES, 'en')
        },
        contact: {
            intro: 'Pick the channel you prefer or send me a message right here.',
            mailApp: 'Email',
            mailAppHint: 'write a message',
            newTab: 'opens in a new tab',
            cardLines: ['Software Engineering', 'PUC Minas · Belo Horizonte'],
            clockCity: 'Belo Horizonte',
            today: 'Today',
            notesApp: 'Notes',
            noteTitle: 'About me',
            noteLines: [
                'Software Engineering student at PUC',
                'Minas and Full Stack intern at Teknisa.',
                'Back end is where I feel at home.'
            ],
            search: 'Search',
            copyEmail: 'Copy email',
            emailCopied: 'Email copied',
            openMailApp: 'Open in your email app',
            form: {
                title: 'New Message',
                cancel: 'Cancel',
                to: 'To:',
                from: 'From:',
                emailLabel: 'Email:',
                name: 'Your name',
                email: 'Your email',
                message: 'Message',
                emailPlaceholder: 'you@example.com',
                messagePlaceholder: 'Write your message…',
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
    {
        id: 'linkedin',
        label: 'LinkedIn',
        value: 'linkedin.com/in/danielolvz',
        href: 'https://www.linkedin.com/in/danielolvz/'
    },
    { id: 'github', label: 'GitHub', value: 'github.com/Danielolv14', href: 'https://github.com/Danielolv14' },
    { id: 'instagram', label: 'Instagram', value: '@danielolvz', href: 'https://www.instagram.com/danielolvz/' }
];

export const SECTIONS = ['about', 'projects', 'experience', 'contact'];
