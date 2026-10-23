// Recursos de terceiros usados no quarto 3D. A licença CC BY exige crédito visível (título, autor,
// link e licença), então esta lista aparece no site (botão "Créditos" e fim do modo 2D).
// Mantenha igual a docs/creditos.md quando entrar ou sair um modelo.

export const LICENCAS = {
    ccBy: { nome: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    cc0: { nome: 'CC0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' }
};

// Modelos do Sketchfab (CC BY 4.0); `objeto` diz o que ele é no quarto
export const MODELOS_CC_BY = [
    {
        titulo: 'Pioneer DJ console',
        autor: 'twopixels.studio',
        url: 'https://sketchfab.com/3d-models/0ba527fa6b164c34aa050dcecbaa2ffb',
        objeto: { pt: 'Controladora do cantinho DJ', en: 'DJ corner controller' }
    },
    {
        titulo: 'KRK Classic 5 Studio Monitor Speaker',
        autor: 'TheGiwi',
        url: 'https://sketchfab.com/3d-models/5c03f6b1082a4decb33ae7511209271a',
        objeto: { pt: 'Monitores de áudio', en: 'Studio monitors' }
    },
    {
        titulo: 'Ps5',
        autor: 'kiarash8585',
        url: 'https://sketchfab.com/3d-models/f0b4a0131f784059b0b339d2911478f3',
        objeto: { pt: 'Controle DualSense', en: 'DualSense controller' }
    },
    {
        titulo: 'JBL Charge 3 speaker',
        autor: 'Oleksii.Rozumnyi',
        url: 'https://sketchfab.com/3d-models/661f85fe3e4048f59785b2a75ffa52f8',
        objeto: { pt: 'Caixa de som (cor alterada)', en: 'Speaker (recolored)' }
    },
    {
        titulo: 'Deadpool Funko Pop',
        autor: 'JJTale',
        url: 'https://sketchfab.com/3d-models/fc56955c30b144a2ad5eff757115633b',
        objeto: { pt: 'Funko do Deadpool', en: 'Deadpool Funko' }
    },
    {
        titulo: 'funko harry potter (I.A)',
        autor: 'deathcow',
        url: 'https://sketchfab.com/3d-models/2be3c180543545cb8ed844f47698f335',
        objeto: { pt: 'Funko do Harry Potter', en: 'Harry Potter Funko' }
    },
    {
        titulo: 'Fleetwood Bounder - Breaking Bad',
        autor: 'Zack_Hawley',
        url: 'https://sketchfab.com/3d-models/85ea7208651a47f6a3b2924dadaeb955',
        objeto: { pt: 'Trailer do Breaking Bad', en: 'Breaking Bad RV' }
    },
    {
        titulo: "Nike SB Dunk Low Ben & Jerry's Chunky Dunky",
        autor: 'ShoesPlug',
        url: 'https://sketchfab.com/3d-models/da6bb7c532a04cfaad1164d98213d60b',
        objeto: { pt: 'Tênis perto da porta', en: 'Sneakers by the door' }
    }
];

// Poly Haven (CC0): crédito opcional, mas damos
export const POLY_HAVEN = {
    url: 'https://polyhaven.com',
    texturas: [
        'Oak Veneer 01',
        'Beige Wall 001',
        'Marble 01',
        'Poly Wool Herringbone',
        'Curly Teddy Natural',
        'Brown Leather',
        'Cotton Jersey',
        'Knitted Fleece'
    ],
    modelos: ['Mid Century Lounge Chair', 'Book Encyclopedia Set 01', 'Rubber Duck Toy', 'Round Spectacles']
};
