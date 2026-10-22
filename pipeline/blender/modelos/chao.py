"""Objetos do chão, modelados no Blender (decisão 15: realismo).

A mochila preta da Nike (como a foto do Daniel: bolso grande na frente com o "NIKE" e o swoosh
brancos), perto da porta, e o par de tênis Dunk (modelo pronto do Sketchfab, CC BY; sem ele, os
tênis feitos por script). Medidas e posições: src/room/Floor.jsx.
"""
from modelos.base import caixa, capsula, cilindro, cor, importar_terceiro, juntar, macio, pbr, perfil, texto, transformar

GRUPO = "props-floor"
FONTE = "C:/Windows/Fonts/impact.ttf"

# Swoosh desenhado em unidades (largura 1): a ponta fina à direita, a curva do "check" à esquerda
SWOOSH = [(0.0, 0.16), (0.03, 0.06), (0.1, 0.0), (0.22, -0.01), (0.4, 0.03), (1.0, 0.3), (0.42, 0.13), (0.27, 0.1),
          (0.17, 0.11), (0.11, 0.16), (0.1, 0.24), (0.12, 0.33), (0.05, 0.27)]


def mochila(m, tecido, tecido2, ziper, branco, metal):
    """Mochila escolar preta: corpo macio, bolso frontal grande com zíper em arco, bolsos laterais,
    alça de mão, e o logo branco em relevo de impressão no bolso. Frente para +z, centro em 0."""
    pecas = [
        macio(caixa("corpo", (0, 0.5, 0), (0.86, 1.0, 0.38), tecido, m, chanfro=0.15, segmentos=2)),
        macio(caixa("bolso", (0, 0.33, 0.2), (0.74, 0.58, 0.12), tecido2, m, chanfro=0.07, segmentos=2)),
        caixa("ziper_bolso", (0, 0.625, 0.255), (0.62, 0.014, 0.018), ziper, m, chanfro=0.004),
        caixa("ziper_topo", (0, 0.985, 0.0), (0.6, 0.016, 0.03), ziper, m, chanfro=0.005),
        caixa("puxador", (0.24, 0.6, 0.27), (0.03, 0.08, 0.012), metal, m, chanfro=0.004),
        capsula("alca_mao", (0, 1.02, -0.05), 0.022, 0.2, tecido2, m, eixo="x"),
    ]
    for x in (-0.44, 0.44):
        pecas.append(macio(caixa("bolso_lado", (x, 0.3, 0.02), (0.1, 0.42, 0.26), tecido2, m, chanfro=0.04, segmentos=2)))
    # Logo: o nome em letras condensadas inclinadas e o swoosh embaixo, tudo branco
    pecas.append(texto("logo_nome", "NIKE", FONTE, 0.21, 0.004, branco, m, posicao=(0.02, 0.44, 0.262), inclinacao=0.18))
    swoosh = [(-0.27 + a * 0.54, 0.2 + b * 0.54) for a, b in SWOOSH]
    pecas.append(perfil("logo_swoosh", swoosh, 0.004, branco, m, plano="xy", centro=0.262, chanfro=0.0))
    return juntar(pecas, "mochila")


def tenis(m, posicao, giro, sola, linha, cabedal, forro, friso):
    """Tênis feito por script (só quando o modelo pronto não está baixado)."""
    pecas = [
        caixa("sola", (0, 0.04, 0), (0.64, 0.08, 0.25), sola, m, chanfro=0.035),
        caixa("entressola", (0, 0.03, 0), (0.6, 0.012, 0.256), linha, m, chanfro=0.004),
        macio(caixa("calcanhar", (-0.09, 0.165, 0), (0.42, 0.2, 0.23), cabedal, m, chanfro=0.07, segmentos=2)),
        macio(caixa("biqueira", (0.13, 0.12, 0), (0.34, 0.13, 0.22), cabedal, m, chanfro=0.05, segmentos=2)),
        cilindro("boca", (-0.17, 0.262, 0), 0.07, 0.012, forro, m, segmentos=24, chanfro=0.004),
        caixa("friso", (-0.06, 0.12, 0), (0.2, 0.045, 0.236), friso, m, chanfro=0.01),
        caixa("lingueta", (-0.29, 0.21, 0), (0.06, 0.12, 0.12), cabedal, m, chanfro=0.025),
    ]
    return transformar(juntar(pecas, "tenis"), posicao, (0, giro, 0))


def criar():
    m = {"group": GRUPO, "area": "floor"}
    tecido = pbr("mochila", "poly_wool_herringbone", 0.8, tinta="#1d1e21", contraste=0.6, relevo=0.6)
    tecido2 = pbr("mochila_bolso", "poly_wool_herringbone", 0.8, tinta="#232428", contraste=0.6, relevo=0.6)
    ziper = cor("ziper", "#2f3034", rugosidade=0.5)
    branco = cor("logo_branco", "#f2f2ef", rugosidade=0.6)
    metal = cor("metal_ziper", "#c9ccd1", rugosidade=0.3, metal=0.8)
    pecas = [transformar(mochila(m, tecido, tecido2, ziper, branco, metal), (-3.7, 0.0, 0.9), (0, 1.25, 0))]

    # Par de Dunk perto da porta (o mesmo pé duas vezes, girado: na visão geral não se nota)
    for posicao, giro in (((-3.78, 0, 1.8), 0.62), ((-3.45, 0, 2.15), 0.22)):
        try:
            pecas.append(importar_terceiro("dunk", m, posicao, (0, giro, 0)))
        except RuntimeError:
            sola = cor("sola", "#ebe7e0", rugosidade=0.85)
            cabedal = cor("cabedal", "#f7f6f2", rugosidade=0.7)
            pecas.append(tenis(m, posicao, giro, sola, cor("linha_sola", "#cdc6bc"), cabedal, cor("forro", "#4a4b4f"), cor("friso", "#d3d5d9")))
    return [juntar(pecas, f"{GRUPO}_fixo")]
