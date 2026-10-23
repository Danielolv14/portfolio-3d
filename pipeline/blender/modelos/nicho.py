"""Estante "Sobre mim", modelada no Blender (decisão 14: moderno, minimalista e futurista).

Estante aberta de metal preto com prateleiras de carvalho claro (alvo: docs/plano/alvo/). Substitui do
código a estrutura do nicho (`furniture-niche`). As prateleiras ficam nas mesmas alturas do código
(LEVELS), porque os objetos em cima delas ainda vêm de lá; eles vão ser trocados pelos objetos do
"Sobre mim" (docs/plano/09-estante-sobre-mim.md).
Medidas e posições: src/room/Niche.jsx (coordenadas do site).
"""
import math

from modelos.base import (ESCALA_MODELOS, anel, caixa, cor, felpudo, importar_modelo, importar_terceiro, juntar, pbr, texto,
                          torno, transformar, vidro)

FONTE = "C:/Windows/Fonts/arialbd.ttf"

GRUPO = "furniture-niche"
X0, X1, Z0, Z1 = -4.98, -4.24, 2.3, 4.95
LEVELS = (0.25, 1.6, 2.85, 4.1)
TOPO = 4.805  # topo da prateleira de cima (o tampo do nicho antigo)
TABUA = 0.06
TUBO = 0.04


def criar():
    m = {"group": GRUPO, "area": "niche"}
    carvalho = pbr("carvalho_estante", "oak_veneer_01", 4.0, tinta="#ddc29c", forca_tinta=0.75)
    metal = cor("metal_preto", "#1c1d20", rugosidade=0.4, metal=0.5)

    cx, cz = (X0 + X1) / 2, (Z0 + Z1) / 2
    prof, larg = X1 - X0, Z1 - Z0
    altura = TOPO + 0.02
    pecas = []

    # Quatro colunas de tubo quadrado, com sapatas
    for x in (X0 + TUBO / 2, X1 - TUBO / 2):
        for z in (Z0 + TUBO / 2, Z1 - TUBO / 2):
            pecas.append(caixa("coluna", (x, altura / 2, z), (TUBO, altura, TUBO), metal, m, chanfro=0.006))
            pecas.append(caixa("sapata", (x, 0.008, z), (TUBO + 0.02, 0.016, TUBO + 0.02), metal, m, chanfro=0.005))

    # Prateleiras de carvalho apoiadas num quadro de metal (travessas na frente, atrás e nos lados)
    for topo in (*LEVELS, TOPO):
        y = topo - TABUA / 2
        pecas.append(caixa("prateleira", (cx, y, cz), (prof - 0.01, TABUA, larg - 0.01), carvalho, m, chanfro=0.01))
        for x in (X0 + TUBO / 2, X1 - TUBO / 2):
            pecas.append(caixa("travessa", (x, y - TABUA / 2 - 0.015, cz), (TUBO, 0.03, larg - TUBO * 2), metal, m, chanfro=0.005))
        for z in (Z0 + TUBO / 2, Z1 - TUBO / 2):
            pecas.append(caixa("travessa", (cx, y - TABUA / 2 - 0.015, z), (prof - TUBO * 2, 0.03, TUBO), metal, m, chanfro=0.005))

    moveis = juntar(pecas, f"{GRUPO}_fixo")

    # Objetos do "Sobre mim" que já são modelos prontos (Poly Haven, CC0), em tamanho real
    o = {"group": "props-niche", "area": "niche"}
    real = (ESCALA_MODELOS, ESCALA_MODELOS)
    objetos = [
        # Enciclopédias na prateleira de cima, ao longo da estante
        importar_modelo("book_encyclopedia_set_01", o, (-4.64, TOPO, 3.35), (0, 1.5708, 0), escala=real, faces=12000),
        # Patinho de borracha (o "rubber duck debugging"), no lugar do patinho do código
        importar_modelo("rubber_duck_toy", o, (-4.55, LEVELS[3], 4.4), (0, 0.9, 0), escala=(real[0] * 0.35, real[1] * 0.35)),
        # Óculos redondos (Harry Potter), abertos e virados para o quarto
        importar_modelo("round_spectacles", o, (-4.5, LEVELS[3], 3.75), (0, 1.9, 0), escala=real, faces=4000),
    ]
    # Modelos do Sketchfab (CC BY), virados para o quarto (+x) e um pouco para a câmera
    terceiros = [
        # JBL deitada na prateleira do meio, no lugar da JBL do código
        ("jbl", (-4.62, LEVELS[2], 3.62), (0, 1.62, 0)),
        # Na base, onde ficavam as pelúcias: Funkos do Harry Potter e do Deadpool e o trailer do Breaking Bad
        ("funko_hp", (-4.6, LEVELS[0], 3.55), (0, 1.15, 0)),
        ("deadpool", (-4.6, LEVELS[0], 4.3), (0, 1.25, 0)),
        ("trailer_bb", (-4.62, LEVELS[0], 2.85), (0, 0.25, 0)),
    ]
    # Fator por objeto, só quando o tamanho real fica estranho na cena (padrão 1)
    fatores = {}
    for pasta, posicao, rotacao in terceiros:
        try:
            fator = fatores.get(pasta, 1.0)
            objetos.append(importar_terceiro(pasta, o, posicao, rotacao, escala=(real[0] * fator, real[1] * fator)))
        except RuntimeError:
            pass
    objetos += objetos_novos(o)
    return [moveis, juntar(objetos, "props-niche_modelos")]


def objetos_novos(o):
    """Prateleira do porta-retrato (y = 1,6), refeita em 23/10: os objetos do código (troféu, chaves,
    suporte verde, Stormtrooper) saíram. Entram, feitos por script e em tamanho real (escala 2,6):
    Breaking Bad (chapéu pork pie e frasco com líquido azul) à esquerda da foto; Game of Thrones (ovo
    de dragão no suporte), Harry Potter (varinha) e a caneca à direita; e, pendurados na prateleira de
    cima, o crachá do estágio e a credencial de show."""
    y = LEVELS[1]
    feltro = pbr("feltro_chapeu", "cotton_jersey", 0.5, tinta="#18181b", contraste=0.6, relevo=0.6)
    fita = cor("fita_chapeu", "#0d0d0f", rugosidade=0.35)
    vidro_frasco = vidro("vidro_frasco", "#d6ecf5", opacidade=0.22)
    liquido = cor("liquido_azul", "#2aa4ff", rugosidade=0.1, emissao="#1d8cff", forca=0.4)
    ovo = cor("ovo_dragao", "#4a1a17", rugosidade=0.35, metal=0.55)
    suporte = cor("suporte_ovo", "#1a1a1d", rugosidade=0.4, metal=0.6)
    madeira = pbr("madeira_varinha", "oak_veneer_01", 0.6, tinta="#4a3423", forca_tinta=0.85)
    ceramica = cor("caneca", "#1e1f22", rugosidade=0.45)
    branco = cor("branco_impresso", "#f1f1ee", rugosidade=0.6)
    cracha_branco = cor("cracha_branco", "#f4f4f2", rugosidade=0.5)
    cracha_preto = cor("cracha_preto", "#121214", rugosidade=0.4)
    cordao_azul = cor("cordao_azul", "#22314f", rugosidade=0.7)
    cordao_vermelho = cor("cordao_vermelho", "#8c1f2a", rugosidade=0.7)
    p = []

    # Chapéu pork pie (copa baixa com o topo afundado, fita e aba reta), atrás à esquerda
    chapeu = [
        torno("aba", [(0.0, 0.0), (0.3, 0.0), (0.31, 0.012), (0.3, 0.024), (0.0, 0.024)], feltro, o),
        torno("copa", [(0.0, 0.0), (0.18, 0.0), (0.178, 0.19), (0.17, 0.205), (0.14, 0.2), (0.0, 0.185)], feltro, o),
        torno("fita", [(0.0, 0.02), (0.184, 0.02), (0.184, 0.07), (0.0, 0.07)], fita, o),
    ]
    p.append(transformar(juntar(chapeu, "chapeu"), (-4.66, y, 2.78), (0, 0.3, 0.05)))
    # Frasco de Erlenmeyer com o líquido azul, na frente do chapéu
    p.append(torno("frasco", [(0.0, 0.0), (0.11, 0.0), (0.115, 0.01), (0.04, 0.27), (0.035, 0.36), (0.04, 0.37), (0.0, 0.37)],
                   vidro_frasco, o, posicao=(-4.38, y, 2.45)))
    p.append(torno("liquido", [(0.0, 0.004), (0.104, 0.004), (0.07, 0.12), (0.0, 0.12)], liquido, o, posicao=(-4.38, y, 2.45)))

    # Ovo de dragão no suporte (anel preto), à direita da foto
    perfil_ovo = [(0.0, 0.0)] + [(0.13 * math.sin(math.pi * t / 20) * (1.0 - 0.18 * t / 20), 0.44 * (1 - math.cos(math.pi * t / 20)) / 2) for t in range(1, 20)] + [(0.0, 0.44)]
    p.append(torno("suporte_ovo", [(0.0, 0.0), (0.12, 0.0), (0.12, 0.03), (0.08, 0.06), (0.0, 0.06)], suporte, o, posicao=(-4.64, y, 4.05)))
    p.append(felpudo(torno("ovo", perfil_ovo, ovo, o, posicao=(-4.64, y + 0.04, 4.05), segmentos=32), forca=0.008, escala=0.025, niveis=1))

    # Varinha (como a do Harry Potter): madeira escura afinando até a ponta, com nós, deitada na frente
    perfil_varinha = [(0.0, 0.0)]
    for i in range(1, 25):
        t = i / 24
        no = 0.004 * max(0.0, math.cos(t * 36)) if t < 0.45 else 0.0
        perfil_varinha.append((0.02 - 0.012 * t + no, 0.95 * t))
    perfil_varinha.append((0.0, 0.95))
    p.append(torno("varinha", perfil_varinha, madeira, o, posicao=(-4.33, y + 0.02, 3.92), rotacao=(math.pi / 2, 0, -0.08), segmentos=12))

    # Caneca preta com "</>" em branco
    p.append(torno("caneca", [(0.0, 0.0), (0.1, 0.0), (0.102, 0.25), (0.092, 0.25), (0.09, 0.015), (0.0, 0.015)], ceramica, o, posicao=(-4.62, y, 4.62)))
    p.append(anel("alca", (-4.62, y + 0.13, 4.62 + 0.13), 0.075, 0.05, 0.03, ceramica, o, rotacao=(math.pi / 2, 0, 0)))
    p.append(texto("caneca_logo", "</>", FONTE, 0.06, 0.003, branco, o, posicao=(-4.519, y + 0.13, 4.62), rotacao=(0, math.pi / 2, 0)))

    # Crachá do estágio e credencial de show pendurados na frente da prateleira de cima (esquerda)
    for z, cor_cordao, cor_cartao, linhas in (
        (2.36, cordao_azul, cracha_branco, ("DANIEL OLIVEIRA", "Estágio · Full Stack")),
        (2.66, cordao_vermelho, cracha_preto, ("BACKSTAGE", "DRUDS · BRAICHI")),
    ):
        topo = LEVELS[2] - 0.08
        p.append(caixa("cordao", (-4.235, topo - 0.2, z), (0.006, 0.4, 0.03), cor_cordao, o, chanfro=0.0))
        p.append(caixa("cartao", (-4.232, topo - 0.47, z), (0.008, 0.22, 0.14), cor_cartao, o, chanfro=0.006))
        cor_texto = cracha_preto if cor_cartao is cracha_branco else branco
        for k, linha in enumerate(linhas):
            p.append(texto("cartao_texto", linha, FONTE, 0.018 if k else 0.022, 0.001, cor_texto, o,
                           posicao=(-4.227, topo - 0.43 - k * 0.04, z), rotacao=(0, math.pi / 2, 0)))
    return p
