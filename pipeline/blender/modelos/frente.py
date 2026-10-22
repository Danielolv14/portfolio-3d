"""Frente do quarto (o chão que ficava vazio), modelada no Blender (decisão 14).

Alvo: docs/plano/alvo/. Cantinho DJ (aparador baixo com a XDJ-RX3, dois monitores de áudio, fone e
pen drives) e a poltrona com a mesinha. Tudo novo: não substitui nada do código. Sem logos: a forma
lembra os aparelhos, mas a marca não aparece.
Escala do quarto: ~3,2 unidades por metro na horizontal e ~2,15 na vertical (CLAUDE.md).
"""
import math

from modelos.base import caixa, cilindro, cor, importar_modelo, importar_terceiro, juntar, macio, pbr, perfil, transformar

GRUPO = "furniture-front"
RAD90 = math.pi / 2


def xdj(m, c):
    """Controladora tudo-em-um (lembra a XDJ-RX3): 72,7 x 46,6 x 11,7 cm. Frente para +z, centro em 0."""
    larg, prof, alt = 2.33, 1.49, 0.2
    topo = alt
    p = [
        caixa("xdj_corpo", (0, alt / 2, 0), (larg, alt, prof), c["preto"], m, chanfro=0.03),
        caixa("xdj_painel", (0, topo + 0.004, 0), (larg - 0.08, 0.008, prof - 0.08), c["grafite"], m, chanfro=0.004),
    ]
    # Tela de 10" no meio, atrás, levemente inclinada para quem toca
    p.append(caixa("xdj_tela_moldura", (0, topo + 0.05, -0.4), (0.78, 0.09, 0.5), c["preto"], m, chanfro=0.02, rotacao=(0.18, 0, 0)))
    p.append(caixa("xdj_tela", (0, topo + 0.097, -0.39), (0.7, 0.006, 0.42), c["tela"], m, chanfro=0.0, rotacao=(0.18, 0, 0)))
    for lado in (-1, 1):
        x = lado * 0.74
        # Prato (jog): aro metálico, disco preto e o centro com visor
        p.append(cilindro("jog_aro", (x, topo + 0.02, 0.05), 0.27, 0.035, c["aluminio"], m, segmentos=48, chanfro=0.008))
        p.append(cilindro("jog_disco", (x, topo + 0.04, 0.05), 0.235, 0.02, c["preto_brilho"], m, segmentos=48, chanfro=0.006))
        p.append(cilindro("jog_visor", (x, topo + 0.052, 0.05), 0.075, 0.008, c["tela"], m, segmentos=32, chanfro=0.002))
        # 8 pads coloridos na frente do deck
        cores = ("pad_rosa", "pad_azul", "pad_verde", "pad_laranja")
        for i in range(4):
            for k in range(2):
                px = x + (i - 1.5) * 0.12
                pz = 0.47 + k * 0.11
                p.append(caixa("pad", (px, topo + 0.012, pz), (0.095, 0.016, 0.085), c[cores[(i + k) % 4]], m, chanfro=0.008))
        # Play e Cue na frente, do lado de fora
        p.append(cilindro("cue", (x + lado * 0.3, topo + 0.012, 0.47), 0.045, 0.016, c["cue"], m, segmentos=24, chanfro=0.004))
        p.append(cilindro("play", (x + lado * 0.3, topo + 0.012, 0.6), 0.045, 0.016, c["play"], m, segmentos=24, chanfro=0.004))
        # Pitch: trilho comprido na borda de fora, com o cursor
        p.append(caixa("pitch_trilho", (x + lado * 0.43, topo + 0.003, -0.05), (0.03, 0.006, 0.6), c["preto"], m, chanfro=0.002))
        p.append(caixa("pitch_cursor", (x + lado * 0.43, topo + 0.02, -0.08), (0.07, 0.03, 0.05), c["aluminio"], m, chanfro=0.008))
        # Mixer: 3 botões de EQ e o fader do canal
        cx = lado * 0.16
        for j in range(3):
            p.append(cilindro("eq", (cx, topo + 0.025, -0.08 + j * 0.13), 0.028, 0.04, c["preto_brilho"], m, segmentos=20, chanfro=0.006))
        p.append(caixa("fader_trilho", (cx, topo + 0.003, 0.48), (0.02, 0.006, 0.3), c["preto"], m, chanfro=0.002))
        p.append(caixa("fader", (cx, topo + 0.025, 0.42), (0.07, 0.04, 0.045), c["aluminio"], m, chanfro=0.008))
    p.append(caixa("crossfader", (0, topo + 0.025, 0.64), (0.045, 0.04, 0.07), c["aluminio"], m, chanfro=0.008))
    return juntar(p, "xdj")


def monitor_audio(m, c):
    """Monitor de áudio de estúdio (5"): caixa preta, woofer, tweeter e a saída de ar. Frente para +z."""
    larg, alt, prof = 0.6, 0.62, 0.8
    frente = prof / 2
    p = [
        caixa("caixa_som", (0, alt / 2, 0), (larg, alt, prof), c["preto"], m, chanfro=0.04),
        cilindro("woofer_aro", (0, alt * 0.4, frente + 0.004), 0.21, 0.012, c["grafite"], m, segmentos=40, rotacao=(RAD90, 0, 0)),
        cilindro("woofer", (0, alt * 0.4, frente + 0.006), 0.175, 0.012, c["cone"], m, segmentos=40, rotacao=(RAD90, 0, 0)),
        cilindro("woofer_centro", (0, alt * 0.4, frente + 0.012), 0.05, 0.014, c["grafite"], m, segmentos=24, rotacao=(RAD90, 0, 0)),
        cilindro("tweeter", (0, alt * 0.82, frente + 0.006), 0.06, 0.012, c["cone"], m, segmentos=28, rotacao=(RAD90, 0, 0)),
        caixa("porta_ar", (0, alt * 0.1, frente + 0.002), (0.32, 0.035, 0.01), c["grafite"], m, chanfro=0.004),
    ]
    return juntar(p, "monitor_audio")


def fone(m, c):
    """Fone de DJ deitado: duas conchas e o arco (meia-volta) por cima."""
    arco = []
    for i in range(13):
        t = math.pi * i / 12
        arco.append((0.2 * math.cos(t), 0.2 * math.sin(t)))
    for i in range(12, -1, -1):
        t = math.pi * i / 12
        arco.append((0.165 * math.cos(t), 0.165 * math.sin(t)))
    p = [perfil("fone_arco", arco, 0.05, c["preto"], m, plano="xy", centro=0.0, chanfro=0.01)]
    transformar(p[0], (0, 0.06, 0), (-RAD90 + 0.25, 0, 0))
    for x in (-0.19, 0.19):
        p.append(cilindro("concha", (x, 0.045, 0), 0.085, 0.07, c["preto"], m, segmentos=28, chanfro=0.02))
        p.append(cilindro("almofada", (x, 0.085, 0), 0.075, 0.02, c["grafite"], m, segmentos=28, chanfro=0.008))
    return juntar(p, "fone")


def aparador(m, c):
    """Aparador baixo de carvalho (4,2 x 1,2 x 1,5), pés de metal preto, laterais pretas e portas lisas."""
    larg, alt, prof, pe = 4.2, 1.0, 1.5, 0.2
    y = pe + alt / 2
    p = [caixa("aparador", (0, y, 0), (larg, alt, prof), c["carvalho"], m, chanfro=0.02)]
    # Painéis pretos frisados nas pontas da frente e portas de carvalho no meio, com frestas
    for lado in (-1, 1):
        cxp = lado * (larg / 2 - 0.5)
        p.append(caixa("painel_preto", (cxp, y, prof / 2 + 0.006), (0.92, alt - 0.1, 0.012), c["preto"], m, chanfro=0.004))
        for i in range(7):
            p.append(caixa("friso", (cxp - 0.39 + i * 0.13, y, prof / 2 + 0.016), (0.05, alt - 0.16, 0.012), c["grafite"], m, chanfro=0.004))
    for cxp in (-0.53, 0.53):
        p.append(caixa("porta_aparador", (cxp, y, prof / 2 + 0.006), (1.02, alt - 0.1, 0.012), c["carvalho_porta"], m, chanfro=0.004))
    for x in (-larg / 2 + 0.15, larg / 2 - 0.15):
        for z in (-prof / 2 + 0.15, prof / 2 - 0.15):
            p.append(cilindro("pe_aparador", (x, pe / 2, z), 0.035, pe, c["metal"], m, segmentos=16, raio_topo=0.045))
    return juntar(p, "aparador")


def poltrona(m, c):
    """Poltrona moderna de couro laranja queimado com pés de carvalho. Frente para +z, centro em 0."""
    p = []
    for x in (-0.85, 0.85):
        for z in (-0.85, 0.85):
            p.append(cilindro("pe_poltrona", (x, 0.2, z), 0.05, 0.4, c["carvalho"], m, segmentos=16, raio_topo=0.07, rotacao=(z * 0.12, 0, -x * 0.12)))
    p.append(macio(caixa("base_poltrona", (0, 0.55, 0), (2.0, 0.32, 2.0), c["couro"], m, chanfro=0.1, segmentos=2)))
    p.append(macio(caixa("assento", (0, 0.82, 0.12), (1.55, 0.26, 1.6), c["couro"], m, chanfro=0.11, segmentos=2)))
    p.append(macio(caixa("encosto", (0, 1.28, -0.78), (1.95, 1.05, 0.38), c["couro"], m, chanfro=0.14, segmentos=2, rotacao=(-0.18, 0, 0))))
    for x in (-0.86, 0.86):
        p.append(macio(caixa("braco", (x, 0.98, 0.05), (0.32, 0.5, 1.85), c["couro"], m, chanfro=0.12, segmentos=2)))
    return juntar(p, "poltrona")


def mesinha(m, c):
    """Mesinha redonda: tampo cinza e três pés finos de metal preto."""
    p = [cilindro("tampo_mesinha", (0, 1.06, 0), 0.42, 0.05, c["cinza"], m, segmentos=48, chanfro=0.012)]
    for i in range(3):
        a = i * 2 * math.pi / 3
        p.append(cilindro("pe_mesinha", (0.26 * math.cos(a), 0.52, 0.26 * math.sin(a)), 0.016, 1.06, c["metal"], m, segmentos=12,
                          rotacao=(math.sin(a) * 0.12, 0, -math.cos(a) * 0.12)))
    return juntar(p, "mesinha")


def criar():
    m = {"group": GRUPO, "area": "front"}
    c = {
        "carvalho": pbr("carvalho_aparador", "oak_veneer_01", 4.0, tinta="#ddc29c", forca_tinta=0.75),
        "carvalho_porta": pbr("carvalho_porta", "oak_veneer_01", 4.0, tinta="#e2c8a3", forca_tinta=0.75),
        "preto": cor("preto_fosco", "#1d1e22", rugosidade=0.5),
        "preto_brilho": cor("preto_brilho", "#121316", rugosidade=0.22),
        "grafite": cor("grafite", "#2c2e33", rugosidade=0.45),
        "metal": cor("metal_preto", "#1c1d20", rugosidade=0.4, metal=0.5),
        "aluminio": cor("aluminio", "#b9bdc3", rugosidade=0.3, metal=0.8),
        "cone": cor("cone", "#26282d", rugosidade=0.7),
        "tela": cor("tela_xdj", "#0c1626", emissao="#2a6cff", forca=0.6),
        "pad_rosa": cor("pad_rosa", "#ff4fb8", emissao="#ff4fb8", forca=1.5),
        "pad_azul": cor("pad_azul", "#3fa0ff", emissao="#3fa0ff", forca=1.5),
        "pad_verde": cor("pad_verde", "#3fe08a", emissao="#3fe08a", forca=1.5),
        "pad_laranja": cor("pad_laranja", "#ff9a3c", emissao="#ff9a3c", forca=1.5),
        "cue": cor("botao_cue", "#ff8a1f", emissao="#ff8a1f", forca=1.2),
        "play": cor("botao_play", "#3fe08a", emissao="#3fe08a", forca=1.2),
        "couro": cor("couro", "#b5562b", rugosidade=0.55),
        "cinza": cor("cinza_mesinha", "#8d9096", rugosidade=0.5),
        "branco": cor("branco_console", "#eef0f2", rugosidade=0.35),
        "pendrive": cor("pendrive", "#ff4fb8", rugosidade=0.4),
        "pendrive2": cor("pendrive_azul", "#3fa0ff", rugosidade=0.4),
    }
    pecas = []

    # ── Cantinho DJ: aparador na beira da frente, tudo virado para quem olha o quarto ──
    cx, cz, topo = -0.1, 4.4, 1.2
    pecas.append(transformar(aparador(m, c), (cx, 0, cz)))

    def pronto(pasta, posicao, rotacao, feito_por_script):
        """Modelo pronto do Sketchfab (art/terceiros) quando baixado; senão, o feito por script."""
        try:
            return importar_terceiro(pasta, m, posicao, rotacao)
        except RuntimeError:
            return transformar(feito_por_script(m, c), posicao, rotacao)

    pecas.append(pronto("xdj", (cx - 0.15, topo, cz - 0.02), (0, 0, 0), xdj))
    for lado in (-1, 1):
        # Monitores nas pontas, virados um pouco para o meio
        pecas.append(pronto("monitor_krk", (cx + lado * 1.72, topo, cz - 0.2), (0, -lado * 0.25, 0), monitor_audio))
    pecas.append(transformar(fone(m, c), (cx + 1.18, topo, cz + 0.45), (0, 0.5, 0)))
    for i, (dx, mat) in enumerate(((0.95, "pendrive"), (1.05, "pendrive2"), (1.15, "pendrive"))):
        pecas.append(caixa("pendrive", (cx + dx, topo + 0.012, cz - 0.55), (0.05, 0.024, 0.16), c[mat], m, chanfro=0.006, rotacao=(0, 0.2 * i, 0)))

    # ── Poltrona virada para a frente-esquerda (para o cantinho DJ) e a mesinha ao lado ──
    # Poltrona: modelo pronto (Poly Haven, CC0) quando baixado; senão, a feita por script
    try:
        pecas.append(importar_modelo("mid_century_lounge_chair", m, (3.75, 0, 2.75), (0, -0.785, 0), escala=(2.5, 2.0)))
    except RuntimeError:
        pecas.append(transformar(poltrona(m, c), (3.8, 0, 2.6), (0, -0.785, 0), escala=0.85))
    pecas.append(transformar(mesinha(m, c), (2.55, 0, 3.55)))
    # Controle do PS5 (modelo pronto) em cima da mesinha; sem ele, fica a caixinha da mesinha
    try:
        pecas.append(importar_terceiro("ps5", m, (2.6, 1.085, 3.5), (0, 0.4, 0)))
    except RuntimeError:
        pecas.append(caixa("controle_ps", (2.63, 1.1, 3.49), (0.3, 0.035, 0.18), c["branco"], m, chanfro=0.03, rotacao=(0, 0.4, 0)))

    return [juntar(pecas, f"{GRUPO}_fixo")]
