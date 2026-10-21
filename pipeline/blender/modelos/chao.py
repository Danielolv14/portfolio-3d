"""Objetos do chão, modelados no Blender (estudo de 21/10, docs/plano/estudo-bake.md):
a mochila preta encostada na cama e o par de tênis brancos perto da porta. Formas macias de verdade
(subdivisão), no lugar dos blocos inflados do código. Medidas e posições: src/room/Floor.jsx.
"""
from modelos.base import caixa, capsula, cilindro, cor, juntar, macio, transformar

GRUPO = "props-floor"


def mochila(m, preto, preto2, ziper, metal, etiqueta):
    pecas = [
        macio(caixa("corpo", (0, 0.49, 0), (0.74, 0.98, 0.4), preto, m, chanfro=0.14, segmentos=2)),
        macio(caixa("bolso", (0, 0.32, 0.19), (0.56, 0.46, 0.13), preto2, m, chanfro=0.06, segmentos=2)),
        caixa("ziper", (0, 0.53, 0.255), (0.42, 0.012, 0.016), ziper, m, chanfro=0.004, rotacao=(-0.35, 0, 0)),
        caixa("puxador", (0.17, 0.5, 0.262), (0.03, 0.07, 0.01), metal, m, chanfro=0.003),
        caixa("etiqueta", (0, 0.71, 0.205), (0.15, 0.05, 0.012), etiqueta, m, chanfro=0.004, rotacao=(-0.18, 0, 0)),
        capsula("alca", (0, 0.985, 0), 0.02, 0.18, preto2, m, eixo="x"),
    ]
    return transformar(juntar(pecas, "mochila"), (0.35, 0.04, -1.72), (-0.12, 0.25, 0))


def tenis(m, posicao, giro, sola, linha, cabedal, forro, friso):
    pecas = [
        caixa("sola", (0, 0.04, 0), (0.64, 0.08, 0.25), sola, m, chanfro=0.035),
        caixa("entressola", (0, 0.03, 0), (0.6, 0.012, 0.256), linha, m, chanfro=0.004),
        macio(caixa("calcanhar", (-0.09, 0.165, 0), (0.42, 0.2, 0.23), cabedal, m, chanfro=0.07, segmentos=2)),
        macio(caixa("biqueira", (0.13, 0.12, 0), (0.34, 0.13, 0.22), cabedal, m, chanfro=0.05, segmentos=2)),
        cilindro("boca", (-0.17, 0.262, 0), 0.07, 0.012, forro, m, segmentos=24, chanfro=0.004),
        caixa("friso", (-0.06, 0.12, 0), (0.2, 0.045, 0.236), friso, m, chanfro=0.01),
        caixa("lingueta", (-0.29, 0.21, 0), (0.06, 0.12, 0.12), cabedal, m, chanfro=0.025),
    ]
    for x in (-0.02, 0.035, 0.09):
        pecas.append(caixa("cadarco", (x, 0.27 - (x + 0.02) * 0.4, 0), (0.022, 0.014, 0.12), friso, m, chanfro=0.005, rotacao=(0, 0, -0.4)))
    return transformar(juntar(pecas, "tenis"), posicao, (0, giro, 0))


def criar():
    m = {"group": GRUPO, "area": "floor"}
    preto = cor("mochila", "#1e1f23", rugosidade=0.8)
    preto2 = cor("mochila_bolso", "#25262b", rugosidade=0.8)
    ziper = cor("ziper", "#3b3c42", rugosidade=0.5)
    metal = cor("metal_ziper", "#c9ccd1", rugosidade=0.3, metal=0.8)
    etiqueta = cor("etiqueta", "#2e3a33", rugosidade=0.6)
    sola = cor("sola", "#ebe7e0", rugosidade=0.85)
    linha = cor("linha_sola", "#cdc6bc", rugosidade=0.9)
    cabedal = cor("cabedal", "#f7f6f2", rugosidade=0.7)
    forro = cor("forro", "#4a4b4f", rugosidade=0.9)
    friso = cor("friso", "#d3d5d9", rugosidade=0.7)
    pecas = [
        mochila(m, preto, preto2, ziper, metal, etiqueta),
        tenis(m, (-3.78, 0, 1.8), 0.62, sola, linha, cabedal, forro, friso),
        tenis(m, (-3.48, 0, 2.1), 0.22, sola, linha, cabedal, forro, friso),
    ]
    return [juntar(pecas, f"{GRUPO}_fixo")]
