// Perfil do LinkedIn do Daniel, do jeito que estava em 23/10/2026 (linkedin.com/in/daniel-oliveira14),
// para a TV (src/screens/TvScreen.jsx e a textura em repouso, room/textures.js). O LinkedIn não tem
// API pública para isso: quando o perfil mudar, atualize aqui. Em PT o texto é o do perfil; em EN,
// a tradução (o título já é em inglês no perfil e fica igual nos dois).
import photo from './linkedin-foto.jpg';

const HEADLINE =
    'Software Engineering student at PUC Minas and Full Stack Developer at Teknisa, working on the Retail module. Mainly interested in back-end development, errors fix and new features.';
const TEKNISA_URL = 'https://www.teknisa.com/';
const udemy = (id) => `https://www.udemy.com/certificate/${id}/`;

const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const linkedinPt = {
    photo,
    name: 'Daniel Oliveira',
    pronouns: 'Ele',
    verified: 'Perfil verificado',
    headline: HEADLINE,
    location: 'Belo Horizonte e Região',
    connections: 'Mais de 500 conexões',
    connect: 'Conectar',
    tabs: {
        experience: 'Experiência',
        education: 'Formação acadêmica',
        certifications: 'Licenças e certificados',
        skills: 'Competências'
    },
    aboutTitle: 'Sobre',
    about: [
        'Sempre fui uma pessoa que prefere resolver problemas em vez de apenas reclamar deles. Minha força de vontade, aliada ao contato com a tecnologia desde os 4 anos de idade, despertou em mim o interesse pela programação.',
        'Foi nessa área que encontrei uma grande paixão pelos desafios e pela constante evolução, o que me motiva diariamente a aprender mais e superar novas etapas.',
        'Atualmente estou no 4º período do curso de Engenharia de Software, onde tenho contato frequente com tecnologias como Java, JavaScript, C, C++, SQL, CSS e HTML. Sou uma pessoa responsável, dedicada e com grande facilidade de aprendizagem, sempre buscando evoluir e contribuir com soluções eficientes.',
        'Já participei de projetos reais com versionamento no GitHub, integração front-end e uso de metodologias ágeis. Busco oportunidades de estágio que me desafiem a crescer como desenvolvedor, contribuir com projetos significativos e aprender com profissionais experientes.'
    ],
    topSkillsTitle: 'Principais competências',
    topSkills: ['C#', 'Java', 'Desenvolvimento de software', 'UML (Linguagem de modelagem unificada)', 'C (linguagem de programação)'],
    seeMore: '… mais',
    seeLess: 'Ver menos',
    present: 'o momento',
    // 'jun. de 2026'; só o ano quando a data não tem mês
    date: (iso) => {
        const [y, m] = iso.split('-');
        return m ? `${MONTHS_PT[Number(m) - 1]}. de ${y}` : y;
    },
    // "5 meses", "1 ano e 2 meses"
    duration: (months) => {
        const y = Math.floor(months / 12);
        const m = months % 12;
        const ys = y ? `${y} ${y === 1 ? 'ano' : 'anos'}` : '';
        const ms = m ? `${m} ${m === 1 ? 'mês' : 'meses'}` : '';
        return [ys, ms].filter(Boolean).join(' e ') || '1 mês';
    },
    // "Desenvolvimento full stack, Desenvolvimento web e mais 6 competências"
    skillsLine: (names, more) => `${names.join(', ')}${more ? ` e mais ${more} ${more === 1 ? 'competência' : 'competências'}` : ''}`,
    skillsLabel: 'Competências',
    gradeLabel: 'Nível de formação',
    activitiesLabel: 'Atividades e grupos',
    issued: (date) => `Emitido em ${date}`,
    credentialId: 'Código da credencial',
    showCredential: 'Exibir credencial',
    experience: [
        {
            org: 'Teknisa',
            url: TEKNISA_URL,
            role: 'Desenvolvedor full stack',
            type: 'Estágio',
            start: '2026-06',
            end: null,
            place: 'Belo Horizonte, Minas Gerais, Brasil · Híbrido',
            description:
                'Atuo no módulo de Retail, na Frente de Caixa (PDV), desenvolvendo e mantendo sistemas em produção usados por operações de varejo e food service.',
            bullets: [
                'Desenvolvimento full stack com PHP, JavaScript e os frameworks Zeedhi e Zeedhi Next (Vue.js + TypeScript);',
                'Implementação de novas funcionalidades e regras de negócio para o PDV, do back-end à interface;',
                'Análise, investigação e correção de bugs em ambiente de produção;',
                'Consultas e manipulação de dados em SQL Server para diagnóstico e sustentação;',
                'Testes de sistemas e documentação técnica das entregas;',
                'Aplicação dos padrões de código da Teknisa: Fail Fast, reutilização de código, tratamento de exceções e nomenclatura padronizada;',
                'Participação em treinamentos, reuniões e ritos do time de desenvolvimento.'
            ],
            skills: ['Desenvolvimento full stack', 'Desenvolvimento web'],
            moreSkills: 6
        }
    ],
    education: [
        {
            school: 'PUC Minas',
            degree: 'Computer Science',
            start: '2024',
            end: '2026',
            grade: 'Cursei até o 4º período.',
            activities: 'Hackathons, projetos e monitoria.',
            description: 'Me transferi para Engenharia de Software, por me identificar com o que é proposto pelo curso.',
            skills: ['Java', 'C#'],
            moreSkills: 3
        },
        {
            school: 'PUC Minas',
            degree: 'Bacharelado, Engenharia de Software',
            start: '2026-02',
            end: '2028-11',
            skills: ['Java', 'Desenvolvimento de software'],
            moreSkills: 1
        }
    ],
    certifications: [
        {
            name: 'Banco de Dados SQL do Zero ao Avançado',
            org: 'Udemy',
            issued: '2026-05',
            id: 'UC-c15e4563-0287-4710-b730-1f2601ce6736',
            url: udemy('UC-c15e4563-0287-4710-b730-1f2601ce6736'),
            skills: ['SQL', 'MySQL'],
            moreSkills: 4
        },
        {
            name: 'HTML CSS JavaScript Essencial - Front End Completo',
            org: 'Udemy',
            issued: '2026-04',
            id: 'UC-7084279b-429f-44c0-8bdb-1a4eeeacc9b2',
            url: udemy('UC-7084279b-429f-44c0-8bdb-1a4eeeacc9b2'),
            skills: ['CSS', 'HTML'],
            moreSkills: 2
        }
    ],
    // na ordem do perfil
    skills: [
        'Programação lógica',
        'Documentação de software',
        'Gerenciamento de bugs',
        'Teste de software',
        'Metodologias ágeis no desenvolvimento de aplicações',
        'Desenvolvimento full stack',
        'Workbench',
        'Desenvolvimento web',
        'Consultas a banco de dados',
        'MySQL',
        'Manipulação de dados',
        'DDL',
        'SQL',
        'Banco de dados',
        'Inteligência artificial',
        'CSS',
        'JavaScript',
        'UML (Linguagem de modelagem unificada)',
        'Análise de requisitos',
        'C (linguagem de programação)',
        'HTML',
        'C#',
        'Java',
        'Desenvolvimento de software'
    ]
};

export const linkedinEn = {
    ...linkedinPt,
    pronouns: 'He/Him',
    verified: 'Verified profile',
    location: 'Greater Belo Horizonte',
    connections: '500+ connections',
    connect: 'Connect',
    tabs: {
        experience: 'Experience',
        education: 'Education',
        certifications: 'Licenses & certifications',
        skills: 'Skills'
    },
    aboutTitle: 'About',
    about: [
        "I've always been someone who prefers solving problems to just complaining about them. My willpower, together with being around technology since I was 4 years old, sparked my interest in programming.",
        "That's where I found a great passion for challenges and constant growth, which motivates me every day to learn more and move on to new stages.",
        "I'm currently in the 4th semester of Software Engineering, where I regularly work with technologies such as Java, JavaScript, C, C++, SQL, CSS and HTML. I'm responsible, dedicated and a fast learner, always looking to grow and contribute efficient solutions.",
        "I've taken part in real projects with version control on GitHub, front-end integration and agile methods. I'm looking for internship opportunities that challenge me to grow as a developer, contribute to meaningful projects and learn from experienced professionals."
    ],
    topSkillsTitle: 'Top skills',
    topSkills: ['C#', 'Java', 'Software Development', 'Unified Modeling Language (UML)', 'C (Programming Language)'],
    seeMore: '…see more',
    seeLess: 'See less',
    present: 'Present',
    date: (iso) => {
        const [y, m] = iso.split('-');
        return m ? `${MONTHS_EN[Number(m) - 1]} ${y}` : y;
    },
    duration: (months) => {
        const y = Math.floor(months / 12);
        const m = months % 12;
        const ys = y ? `${y} ${y === 1 ? 'yr' : 'yrs'}` : '';
        const ms = m ? `${m} ${m === 1 ? 'mo' : 'mos'}` : '';
        return [ys, ms].filter(Boolean).join(' ') || '1 mo';
    },
    skillsLine: (names, more) => `${names.join(', ')}${more ? ` and +${more} ${more === 1 ? 'skill' : 'skills'}` : ''}`,
    skillsLabel: 'Skills',
    gradeLabel: 'Grade',
    activitiesLabel: 'Activities and societies',
    issued: (date) => `Issued ${date}`,
    credentialId: 'Credential ID',
    showCredential: 'Show credential',
    experience: [
        {
            ...linkedinPt.experience[0],
            role: 'Full Stack Developer',
            type: 'Internship',
            place: 'Belo Horizonte, Minas Gerais, Brazil · Hybrid',
            description:
                'I work on the Retail module, on the point of sale (POS), building and maintaining production systems used by retail and food service operations.',
            bullets: [
                'Full stack development with PHP, JavaScript and the Zeedhi and Zeedhi Next frameworks (Vue.js + TypeScript);',
                'New features and business rules for the POS, from back end to interface;',
                'Analyzing, investigating and fixing bugs in production;',
                'SQL Server queries and data handling for diagnostics and support;',
                'System testing and technical documentation of each delivery;',
                "Applying Teknisa's coding standards: fail fast, code reuse, exception handling and consistent naming;",
                "Taking part in trainings, meetings and the development team's rituals."
            ],
            skills: ['Full-Stack Development', 'Web Development']
        }
    ],
    education: [
        {
            ...linkedinPt.education[0],
            grade: 'Completed up to the 4th semester.',
            activities: 'Hackathons, projects and tutoring.',
            description: 'I transferred to Software Engineering because I identify with what the program offers.'
        },
        {
            ...linkedinPt.education[1],
            degree: "Bachelor's degree, Software Engineering",
            skills: ['Java', 'Software Development']
        }
    ],
    skills: [
        'Logic Programming',
        'Software Documentation',
        'Bug Tracking',
        'Software Testing',
        'Agile Application Development',
        'Full-Stack Development',
        'Workbench',
        'Web Development',
        'Database Queries',
        'MySQL',
        'Data Manipulation',
        'DDL',
        'SQL',
        'Databases',
        'Artificial Intelligence (AI)',
        'CSS',
        'JavaScript',
        'Unified Modeling Language (UML)',
        'Requirements Analysis',
        'C (Programming Language)',
        'HTML',
        'C#',
        'Java',
        'Software Development'
    ]
};
