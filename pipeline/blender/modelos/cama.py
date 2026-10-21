"""Área da cama, modelada no Blender (estudo de 21/10, docs/plano/estudo-bake.md).

Substitui do código: estrutura da cama, cabeceira, criado-mudo, luminária de cobre, pôsteres e o
tapete (que era feito de camadas finas empilhadas e assava com a beirada preta). Continuam vindo do
código: a roupa de cama (colchão, edredom matelassê, travesseiros, boné, cordão), o celular (objeto
clicável, com a tela ao vivo), a bola e os objetos em cima do criado-mudo.
Medidas e posições: src/room/Bed.jsx (coordenadas do site).
"""
from modelos.base import caixa, cilindro, cor, curva, felpudo, juntar, perfil, placa, textura, transformar

GRUPO = "furniture-bed"
GRUPO_OBJETOS = "props-bed"
RAD90 = 1.5708


def luminaria(preto_metal, cobre, luz, marca):
    """Luminária de cobre do criado-mudo: base, haste, braço e cúpula inclinada com a lâmpada acesa
    (material emit-R: acende à noite com a luz da cabeceira). Montada nas coordenadas dela."""
    cupula = juntar(
        [
            cilindro("cupula", (0, 0, 0), 0.086, 0.18, cobre, marca, segmentos=36, chanfro=0.006),
            cilindro("cupula_topo", (0, 0.14, 0), 0.052, 0.1, cobre, marca, segmentos=28),
            cilindro("lampada", (0, -0.091, 0), 0.078, 0.004, luz, marca, segmentos=36, chanfro=0.0),
        ],
        "cupula",
    )
    transformar(cupula, (-0.13, 0.7, 0), (0, 0, -0.28))
    pecas = [
        cilindro("base", (0, 0.015, 0), 0.135, 0.03, preto_metal, marca, segmentos=40, chanfro=0.008),
        cilindro("haste", (0, 0.4, 0), 0.012, 0.74, preto_metal, marca, segmentos=12),
        cilindro("braco", (-0.06, 0.76, 0), 0.01, 0.12, preto_metal, marca, segmentos=12, rotacao=(0, 0, RAD90)),
        cupula,
    ]
    lamp = juntar(pecas, "luminaria")
    return transformar(lamp, (4.96, 1.3, -1.68), (0, -0.8, 0))


def criar():
    m = {"group": GRUPO, "area": "bed"}
    p = {"group": GRUPO_OBJETOS, "area": "bed"}

    mogno = cor("mogno", "#5b2e1c", rugosidade=0.45)
    mogno_escuro = cor("mogno_escuro", "#2a160e", rugosidade=0.7)
    cromado = cor("cromado", "#dfe3e8", rugosidade=0.15, metal=1.0)
    grafite = cor("grafite_criado", "#3b3d42", rugosidade=0.6)
    teca = cor("teca", "#a86d3c", rugosidade=0.5)
    preto_metal = cor("preto_metal", "#1b1c1f", rugosidade=0.35, metal=0.4)
    cobre = cor("cobre", "#c27a46", rugosidade=0.28, metal=1.0)
    luz_cobre = cor("emit-R-luminaria", "#fff1d6", emissao="#ffb15e", forca=6.0)
    tapete = cor("tapete", "#c7b9a6", rugosidade=1.0)
    moldura = cor("moldura_poster", "#17181b", rugosidade=0.45)

    pecas = []

    # ── Estrutura da cama: base escura recuada e estrado de mogno ──
    pecas.append(caixa("cama_base", (1.96, 0.05, -3.5), (5.8, 0.1, 2.75), mogno_escuro, m, chanfro=0.01))
    pecas.append(caixa("cama_estrado", (1.96, 0.3, -3.5), (6.02, 0.4, 2.95), mogno, m, chanfro=0.03))

    # ── Cabeceira: painel com o topo curvo, duas colunas inclinadas e as barras cromadas ──
    contorno = [(-4.6, 0.3), (-2.4, 0.3), (-2.4, 2.3)] + curva((-2.4, 2.3), (-3.5, 2.02), (-4.6, 2.3))[:-1] + [(-4.6, 2.3)]
    pecas.append(perfil("cabeceira", contorno, 0.07, mogno, m, centro=5.08, chanfro=0.02))
    for zc, lado in ((-4.85, -1), (-2.15, 1)):
        coluna = [(zc - 0.08, 0.0), (zc + 0.08, 0.0), (zc + 0.125, 2.5 + 0.045 * lado), (zc - 0.125, 2.5 - 0.045 * lado)]
        pecas.append(perfil("coluna", coluna, 0.12, mogno, m, centro=5.19, chanfro=0.018))
    for z in (-4.665, -2.335):
        for y in (1.92, 2.12):
            pecas.append(cilindro("barra", (5.1, y, z), 0.021, 0.2, cromado, m, segmentos=16, rotacao=(RAD90, 0, 0)))

    # ── Criado-mudo: base de teca, corpo e tampo grafite, 3 gavetas com filete de teca ──
    for x in (4.2, 5.16):
        for z in (-1.89, -0.91):
            pecas.append(caixa("pe_criado", (x, 0.11, z), (0.1, 0.22, 0.1), teca, m, chanfro=0.012))
    pecas.append(caixa("trilho_frente", (4.185, 0.26, -1.4), (0.07, 0.12, 1.08), teca, m, chanfro=0.01))
    for z in (-0.885, -1.915):
        pecas.append(caixa("trilho_lado", (4.69, 0.26, z), (1.06, 0.12, 0.07), teca, m, chanfro=0.01))
    pecas.append(caixa("criado_corpo", (4.72, 0.81, -1.4), (1.06, 0.98, 1.1), grafite, m, chanfro=0.015))
    pecas.append(caixa("criado_tampo", (4.685, 1.275, -1.4), (1.13, 0.05, 1.1), grafite, m, chanfro=0.012))
    for k in range(3):
        y = 0.335 + k * 0.305
        pecas.append(caixa("gaveta_criado", (4.155, y + 0.108, -1.4), (0.05, 0.215, 1.04), grafite, m, chanfro=0.01))
        pecas.append(caixa("filete", (4.165, y + 0.253, -1.4), (0.04, 0.072, 1.04), teca, m, chanfro=0.008))
    pecas.append(luminaria(preto_metal, cobre, luz_cobre, m))

    # ── Pôsteres dos filmes: moldura preta e a arte (própria, minimalista) em alta resolução ──
    for nome, x, y in (("pulp", 3.0, 4.15), ("fight", 4.25, 4.15), ("beauty", 3.0, 2.7), ("basterds", 4.25, 2.7)):
        pecas.append(caixa("moldura", (x, y, -4.97), (1.08, 1.44, 0.04), moldura, m, chanfro=0.012))
        arte = textura(f"poster_{nome}", f"poster_{nome}.png", rugosidade=0.55)
        pecas.append(placa(f"poster_{nome}", (x, y, -4.948), 1.0, 1.36, 0.004, arte, m, normal="+z", chanfro=0.001))

    # ── Tapete felpudo: uma peça só, macia nas bordas (antes eram camadas finas empilhadas) ──
    # Mais quente que o piso, para se destacar dele, e com o pelo em relevo (ruído na geometria)
    pecas.append(felpudo(caixa("tapete", (1.6, 0.045, -0.025), (4.6, 0.09, 3.85), tapete, p, chanfro=0.045, segmentos=4), forca=0.022))

    moveis = [o for o in pecas if o["bk_group"] == GRUPO]
    objetos = [o for o in pecas if o["bk_group"] == GRUPO_OBJETOS]
    return [juntar(moveis, f"{GRUPO}_fixo"), juntar(objetos, f"{GRUPO_OBJETOS}_fixo")]
