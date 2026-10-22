"""Estante "Sobre mim", modelada no Blender (decisão 14: moderno, minimalista e futurista).

Estante aberta de metal preto com prateleiras de carvalho claro (alvo: docs/plano/alvo/). Substitui do
código a estrutura do nicho (`furniture-niche`). As prateleiras ficam nas mesmas alturas do código
(LEVELS), porque os objetos em cima delas ainda vêm de lá; eles vão ser trocados pelos objetos do
"Sobre mim" (docs/plano/09-estante-sobre-mim.md).
Medidas e posições: src/room/Niche.jsx (coordenadas do site).
"""
from modelos.base import caixa, cor, importar_modelo, importar_terceiro, juntar, pbr

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
    real = (3.2, 2.15)
    objetos = [
        # Enciclopédias na prateleira de cima, ao longo da estante
        importar_modelo("book_encyclopedia_set_01", o, (-4.64, TOPO, 3.35), (0, 1.5708, 0), escala=real),
        # Patinho de borracha (o "rubber duck debugging"), no lugar do patinho do código
        importar_modelo("rubber_duck_toy", o, (-4.55, LEVELS[3], 4.4), (0, 0.9, 0), escala=(real[0] * 0.35, real[1] * 0.35)),
        # Óculos redondos (Harry Potter), abertos e virados para o quarto
        importar_modelo("round_spectacles", o, (-4.5, LEVELS[3], 3.75), (0, 1.9, 0), escala=real),
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
    for pasta, posicao, rotacao in terceiros:
        try:
            # Funkos e miniaturas maiores que o real para aparecerem na visão geral
            fator = 1.0 if pasta == "jbl" else 1.6
            objetos.append(importar_terceiro(pasta, o, posicao, rotacao, escala=(real[0] * fator, real[1] * fator)))
        except RuntimeError:
            pass
    return [moveis, juntar(objetos, "props-niche_modelos")]
