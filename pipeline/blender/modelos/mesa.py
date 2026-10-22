"""Parede da mesa, modelada no Blender (decisões 14 e 15; alvo em docs/plano/alvo/).

Substitui as peças de `furniture-desk` e `props-desk` do código: painel ripado, mesa flutuante,
gabinete Pichau Gadit L (frente camuflada, lateral de vidro com os fans de luz quente), monitor (objeto
clicável "projects"), TV com a luminária (objeto clicável "experience"), PS5, relógio, mousepad,
caderninho e calculadora. Continuam vindo do código: teclado, mouse, fones, cabos e a cadeira (que se
mexe). Medidas e posições: src/room/Desk.jsx (coordenadas do site).
"""
import os

import bpy

from comum import CACHE
from modelos.base import anel, caixa, capsula, cilindro, compor, cor, curva, juntar, parede, pbr, perfil, placa, textura, transformar, vidro

GRUPO = "furniture-desk"
GRUPO_OBJETOS = "props-desk"
RAD90 = 1.5708


def camuflagem_militar():
    """A tela da frente na camuflagem militar da imagem-alvo (verde-oliva, cáqui, marrom e quase preto),
    feita a partir da camuflagem urbana do código (camo.png, cinza): cada faixa de cinza vira uma cor, e
    a trama da tela (os furinhos) fica, porque o brilho de cada pixel em relação à vizinhança é mantido."""
    import numpy as np

    nome = "camo_militar.png"
    saida = os.path.join(CACHE, "texturas", nome)
    if os.path.exists(saida):
        return nome
    src = bpy.data.images.load(os.path.join(CACHE, "texturas", "camo.png"), check_existing=True)
    w, h = src.size
    px = np.array(src.pixels[:], dtype=np.float32).reshape(h, w, 4)
    lum = px[..., :3].mean(axis=-1)
    # Média de uma janela 9x9 (ignora os furinhos da tela e acha a mancha da camuflagem)
    r = 4
    soma = np.pad(lum, r, mode="edge").cumsum(0).cumsum(1)
    soma = np.pad(soma, ((1, 0), (1, 0)))
    k = 2 * r + 1
    media = (soma[k:, k:] - soma[:-k, k:] - soma[k:, :-k] + soma[:-k, :-k]) / (k * k)
    cores = np.array([[0x2b, 0x2b, 0x22], [0x5b, 0x46, 0x30], [0x4f, 0x5a, 0x2c], [0xb0, 0xa3, 0x7c]], dtype=np.float32) / 255
    banda = np.digitize(media, [0.3, 0.5, 0.68])
    trama = np.clip(lum / np.maximum(media, 1e-3), 0.55, 1.25)[..., None]
    px[..., :3] = np.clip(cores[banda] * trama, 0, 1)
    out = bpy.data.images.new("camo_militar", w, h, alpha=False)
    out.pixels = px.ravel()
    out.filepath_raw = saida
    out.file_format = "PNG"
    out.save()
    return nome


def ventoinha(nome, centro, tamanho, c, marca, eixo="x"):
    """Fan de 120 mm com anel de LED quente (acende junto com o RGB à noite): moldura quadrada vazada, anel,
    as pás (um disco escuro, como pás girando) e o miolo."""
    rot = (0, 0, RAD90) if eixo == "x" else (RAD90, 0, 0)
    prof = tamanho * 0.22
    r = tamanho / 2
    pecas = [
        # moldura quadrada: um "anel" de 4 lados girado 45° (os cantos a r·√2 do centro)
        anel(f"{nome}_moldura", centro, r * 1.41, r * 1.3, prof, c["grade"], marca, segmentos=4, rotacao=(rot[0], 0.785, rot[2])),
        anel(f"{nome}_anel", centro, r * 0.93, r * 0.84, prof * 0.9, c["led"], marca, rotacao=rot),
        cilindro(f"{nome}_pas", centro, r * 0.83, prof * 0.25, c["pas"], marca, segmentos=40, rotacao=rot, chanfro=0.0),
        cilindro(f"{nome}_miolo", centro, r * 0.3, prof * 0.7, c["preto_brilho"], marca, segmentos=28, rotacao=rot, chanfro=0.004),
    ]
    return pecas


def gabinete(m, c):
    """Gabinete Pichau Gadit L (484 x 402 x 210 mm), na escala do quarto e como na imagem-alvo: frente em
    tela com a camuflagem militar e moldura de cantos chanfrados, lateral de vidro temperado (virada para a
    câmera) mostrando a placa-mãe, a placa de vídeo, as memórias, o cooler e os fans com anel de luz quente, a
    cobertura da fonte embaixo, o topo com o filtro de tela e os botões, e quatro pezinhos redondos.
    Montado na origem: frente para +x, vidro para +z, apoiado em y = 0."""
    D, W, H, PE = 1.29, 0.67, 1.55, 0.03
    x0, x1, z0, z1, y0, y1 = -D / 2, D / 2, -W / 2, W / 2, PE, PE + H
    p = []
    for x in (x0 + 0.12, x1 - 0.12):
        for z in (z0 + 0.1, z1 - 0.1):
            p.append(cilindro("pe", (x, PE / 2, z), 0.045, PE, c["borracha"], m, segmentos=20))

    # Chassi de aço: fundo, traseira, lateral de trás e o topo
    p.append(caixa("fundo", (0, y0 + 0.015, 0), (D, 0.03, W), c["aco"], m, chanfro=0.006))
    p.append(caixa("traseira", (x0 + 0.015, (y0 + y1) / 2, 0), (0.03, H, W), c["aco"], m, chanfro=0.006))
    p.append(caixa("lateral", (0, (y0 + y1) / 2, z0 + 0.01), (D, H, 0.02), c["aco"], m, chanfro=0.006))
    p.append(caixa("topo", (-0.04, y1 - 0.0175, 0), (D - 0.08, 0.035, W), c["aco"], m, chanfro=0.008))
    # Filtro de tela do topo, camuflado, atrás da faixa dos botões
    p.append(placa("topo_tela", (-0.13, y1 + 0.002, 0), D * 0.62, W * 0.78, 0.004, c["camo"], m, normal="+y", girar=True))
    p.append(cilindro("botao", (x1 - 0.17, y1 + 0.006, -0.12), 0.035, 0.012, c["preto_brilho"], m, segmentos=28))
    p.append(cilindro("botao_led", (x1 - 0.17, y1 + 0.002, -0.12), 0.043, 0.006, c["led_botao"], m, segmentos=28, chanfro=0.0))
    for z, largura in ((-0.02, 0.035), (0.05, 0.025), (0.11, 0.025)):
        p.append(caixa("porta_usb", (x1 - 0.17, y1 + 0.003, z), (0.05, 0.006, largura), c["grade"], m, chanfro=0.0015))

    # Frente: moldura preta brilhante de cantos chanfrados, com a tela camuflada no vão
    p.append(parede("frente_moldura", (z0, z1), (y0, y1), [(z0 + 0.07, z1 - 0.07, y0 + 0.07, y1 - 0.07)], 0.08, c["preto_brilho"], m,
                    plano="zy", centro=x1 - 0.04, chanfro=0.025))
    p.append(placa("frente_tela", (x1 - 0.03, (y0 + y1) / 2, 0), W - 0.14, H - 0.14, 0.01, c["camo"], m))

    # Vidro temperado na lateral virada para a câmera, com a borda preta serigrafada
    gx0, gx1 = x0 + 0.02, x1 - 0.08
    gc = (gx0 + gx1) / 2
    p.append(caixa("vidro", (gc, (y0 + y1) / 2, z1 - 0.008), (gx1 - gx0, H - 0.02, 0.012), c["vidro"], m, chanfro=0.004))
    for pos, tam in (((gc, y1 - 0.035, z1 - 0.0015), (gx1 - gx0, 0.05, 0.003)), ((gc, y0 + 0.035, z1 - 0.0015), (gx1 - gx0, 0.05, 0.003)),
                     ((gx0 + 0.025, (y0 + y1) / 2, z1 - 0.0015), (0.05, H - 0.02, 0.003)), ((gx1 - 0.025, (y0 + y1) / 2, z1 - 0.0015), (0.05, H - 0.02, 0.003))):
        p.append(caixa("borda_vidro", pos, tam, c["grade"], m, chanfro=0.0))

    # Por dentro: placa-mãe na parede de trás, cobertura da fonte, placa de vídeo, memórias e cooler
    p.append(caixa("placa_mae", (-0.2, 1.0, z0 + 0.03), (0.78, 0.98, 0.012), c["pcb"], m, chanfro=0.003))
    p.append(caixa("cobertura_fonte", (-0.02, y0 + 0.17, 0.0), (D - 0.14, 0.34, W - 0.06), c["aco"], m, chanfro=0.01))
    p.append(caixa("placa_video", (-0.13, 0.64, -0.1), (0.96, 0.16, 0.38), c["gpu"], m, chanfro=0.015))
    p.append(caixa("placa_video_rgb", (-0.1, 0.68, 0.092), (0.6, 0.022, 0.006), c["led"], m, chanfro=0.0))
    for dx in (0.04, 0.09):
        p.append(caixa("memoria", (dx, 1.12, -0.24), (0.022, 0.42, 0.12), c["gpu"], m, chanfro=0.003))
        p.append(caixa("memoria_rgb", (dx, 1.12, -0.172), (0.024, 0.42, 0.014), c["led"], m, chanfro=0.0))
    p.append(caixa("dissipador", (-0.27, 1.15, -0.16), (0.16, 0.5, 0.26), c["aluminio"], m, chanfro=0.008))
    p += ventoinha("fan_cooler", (-0.15, 1.15, -0.16), 0.36, c, m)
    # Três fans na frente (atrás da tela) e um atrás, todos com o anel de luz quente
    for y in (0.56, 0.94, 1.32):
        p += ventoinha("fan_frente", (x1 - 0.13, y, 0.0), 0.36, c, m)
    p += ventoinha("fan_traseiro", (x0 + 0.07, 1.25, -0.05), 0.36, c, m)
    return juntar(p, "gabinete")


def console(marca, branco, preto, led):
    """Videogame em pé no fim da mesa (inspirado no PS5, sem logo): miolo preto entre duas laterais
    brancas que abrem em asa em cima e embaixo, apoiado numa base redonda. Frente para +x."""
    h = 0.8
    lateral = [(-0.34, 0.0), (0.3, 0.0)] + curva((0.3, 0.0), (0.18, h * 0.5), (0.36, h)) + [(-0.3, h)]
    lateral += curva((-0.3, h), (-0.22, h * 0.5), (-0.34, 0.0))[:-1]
    pecas = [
        cilindro("console_base", (0, 0.015, 0), 0.17, 0.03, preto, marca, segmentos=32, chanfro=0.008),
        caixa("console_miolo", (0, 0.03 + h * 0.48, 0), (0.58, h * 0.94, 0.14), preto, marca, chanfro=0.02),
        # Filete de luz azul na frente do miolo
        caixa("console_led", (0.29, 0.03 + h * 0.5, 0), (0.006, h * 0.7, 0.012), led, marca, chanfro=0.0),
    ]
    for zc in (-0.095, 0.095):
        lado = perfil("console_lateral", [(a, b + 0.03) for a, b in lateral], 0.05, branco, marca, plano="xy", centro=zc, chanfro=0.015)
        pecas.append(lado)
    return transformar(juntar(pecas, "console"), (-4.47, 1.56, -4.6))


def criar():
    m = {"group": GRUPO, "area": "desk"}
    p = {"group": GRUPO_OBJETOS, "area": "desk"}
    monitor = {**m, "kind": "hotspot", "id": "projects"}
    tv = {**m, "kind": "hotspot", "id": "experience"}

    # Paleta (sRGB, como no CSS): carvalho claro e preto fosco (decisão 14)
    # Madeiras com textura de foto (carvalho, CC0) levada para o tom do alvo
    carvalho = pbr("carvalho", "oak_veneer_01", 4.0, tinta="#d9bb93", forca_tinta=0.75)
    carvalho_fundo = pbr("carvalho_fundo", "oak_veneer_01", 4.0, tinta="#a3825e", forca_tinta=0.75)
    carvalho_tampo = pbr("carvalho_tampo", "oak_veneer_01", 4.0, tinta="#dfc49e", forca_tinta=0.75)
    metal_preto = cor("metal_preto", "#1c1d20", rugosidade=0.4, metal=0.5)
    preto = cor("preto_fosco", "#1d1e22", rugosidade=0.5)
    branco_console = cor("branco_console", "#eef0f2", rugosidade=0.35)
    feltro = cor("feltro", "#2b2d32", rugosidade=0.95)
    feltro_borda = cor("feltro_borda", "#35383e", rugosidade=0.9)
    led_console = cor("led_console", "#a9d2ff", emissao="#7fb8ff", forca=3.0)
    preto_brilho = cor("preto_brilho", "#121316", rugosidade=0.22)
    preto_tela = cor("preto_moldura", "#131418", rugosidade=0.3)
    grafite = cor("grafite", "#2c2e33", rugosidade=0.45)
    grade = cor("grade", "#0b0c0e", rugosidade=0.85)
    vidro_lente = cor("vidro_lente", "#05060a", rugosidade=0.05)
    relogio = textura("relogio", compor("relogio.png", "#1f2a24", "visor_relogio"), rugosidade=0.2)
    calculadora = textura("calculadora", "calculadora.png", rugosidade=0.5)
    led_rgb = cor("emit-B-rgb", "#2a1a0a", emissao="#ffb36b", forca=6.0)
    led_botao = cor("emit-B-botao", "#2a1a0a", emissao="#ffb36b", forca=4.0)
    led_tv = cor("emit-G-barra", "#ffffff", emissao="#f4f7ff", forca=8.0)

    pecas = []

    # ── Painel ripado de carvalho: fundo + réguas verticais com frestas (z = -4,85 a -0,75) ──
    pecas.append(caixa("painel_fundo", (-4.97, 2.5, -2.8), (0.06, 4.9, 4.1), carvalho_fundo, m, chanfro=0.006))
    largura, fresta = 0.185, 0.03
    z = -4.85 + fresta / 2
    while z + largura <= -0.75 + 1e-6:
        pecas.append(caixa("ripa", (-4.9, 2.5, z + largura / 2), (0.08, 4.9, largura), carvalho, m, chanfro=0.01))
        z += largura + fresta

    # ── Mesa flutuante (decisão 14): tampo de carvalho claro de ponta a ponta e pés de metal preto ──
    pecas.append(caixa("tampo", (-4.105, 1.51, -2.65), (1.51, 0.1, 4.4), carvalho_tampo, m, chanfro=0.015))
    for zc in (-4.66, -0.64):
        # Pé em quadro: duas colunas, barra de baixo e barra de cima, em tubo quadrado
        for x in (-4.74, -3.47):
            pecas.append(caixa("pe_mesa", (x, 0.73, zc), (0.06, 1.46, 0.06), metal_preto, m, chanfro=0.008))
        pecas.append(caixa("pe_base", (-4.105, 0.03, zc), (1.33, 0.06, 0.06), metal_preto, m, chanfro=0.008))
        pecas.append(caixa("pe_topo", (-4.105, 1.43, zc), (1.33, 0.06, 0.06), metal_preto, m, chanfro=0.008))

    # ── Gabinete Pichau Gadit L em cima da mesa, no ponto do antigo (frente em x = -3,345) ──
    cg = {
        "aco": cor("aco_gabinete", "#18191c", rugosidade=0.45, metal=0.6),
        "borracha": cor("borracha", "#141416", rugosidade=0.8),
        "preto_brilho": preto_brilho,
        "camo": textura("camuflado", camuflagem_militar(), rugosidade=0.6),
        "led": led_rgb,
        "led_botao": led_botao,
        "grade": grade,
        "vidro": vidro("vidro_gabinete"),
        "pcb": cor("pcb", "#15171b", rugosidade=0.5),
        "gpu": cor("gpu", "#1c1d21", rugosidade=0.35, metal=0.4),
        "aluminio": cor("aluminio_cooler", "#a9adb3", rugosidade=0.35, metal=0.8),
        "pas": cor("pas_fan", "#25262b", rugosidade=0.5),
    }
    pecas.append(transformar(gabinete(m, cg), (-3.99, 1.56, -1.0)))

    # ── Relógio LCD (levemente inclinado para trás), mousepad, caderninho e calculadora ──
    pecas.append(caixa("relogio", (-4.57, 1.721, -4.02), (0.05, 0.27, 0.48), grafite, p, chanfro=0.012, rotacao=(0, 0, 0.1)))
    pecas.append(placa("visor_relogio", (-4.547, 1.758, -4.02), 0.41, 0.125, 0.006, relogio, p, rotacao=(0, 0, 0.1)))
    pecas.append(caixa("mousepad", (-4.075, 1.571, -3.0), (1.25, 0.018, 2.15), feltro, p, chanfro=0.008))
    pecas.append(caixa("mousepad_borda", (-4.075, 1.566, -3.0), (1.27, 0.008, 2.17), feltro_borda, p, chanfro=0.004))
    pecas.append(console(p, branco_console, preto, led_console))
    pecas.append(caixa("caderno", (-3.95, 1.59, -1.85), (0.64, 0.06, 0.46), preto, p, chanfro=0.018, rotacao=(0, 0.05, 0)))
    pecas.append(caixa("calculadora_corpo", (-3.95, 1.632, -1.84), (0.42, 0.024, 0.24), grafite, p, chanfro=0.01, rotacao=(0, -0.08, 0)))
    # Mesmo tamanho do corpo (0,42 em x × 0,24 em z); a textura é em pé, então gira 90° na face
    pecas.append(placa("calculadora", (-3.95, 1.646, -1.84), 0.42, 0.24, 0.004, calculadora, p, normal="+y", rotacao=(0, -0.08, 0), girar=True))

    # ── Monitor no braço articulado (objeto clicável "projects") ──
    # A tela (screen-projects) é desenhada ao vivo pelo código em x = -4,343; a moldura fica logo atrás
    mon = [
        caixa("monitor", (-4.38, 2.46, -2.85), (0.07, 1.32, 2.32), preto_tela, monitor, chanfro=0.02),
        caixa("monitor_traseira", (-4.456, 2.42, -2.85), (0.08, 0.72, 1.1), preto, monitor, chanfro=0.035),
        caixa("vesa", (-4.505, 2.42, -2.85), (0.018, 0.26, 0.26), grafite, monitor, chanfro=0.006),
        cilindro("braco", (-4.625, 2.42, -2.85), 0.028, 0.22, grafite, monitor, rotacao=(0, 0, RAD90)),
        cilindro("junta", (-4.76, 2.42, -2.85), 0.05, 0.09, preto, monitor, segmentos=28),
        cilindro("poste", (-4.76, 1.99, -2.85), 0.034, 0.77, grafite, monitor),
        caixa("braco_base", (-4.76, 1.6, -2.85), (0.18, 0.08, 0.2), preto, monitor, chanfro=0.018),
        # Webcam: corpo em cápsula, lente de vidro e presilha apoiada no topo do monitor
        capsula("webcam", (-4.37, 3.18, -2.85), 0.045, 0.27, preto, monitor, eixo="z"),
        cilindro("lente_aro", (-4.326, 3.18, -2.85), 0.026, 0.008, grafite, monitor, rotacao=(0, 0, RAD90), chanfro=0.002),
        cilindro("lente", (-4.322, 3.18, -2.85), 0.018, 0.006, vidro_lente, monitor, rotacao=(0, 0, RAD90), chanfro=0.002),
        caixa("presilha", (-4.42, 3.11, -2.85), (0.07, 0.11, 0.08), preto, monitor, chanfro=0.012),
    ]
    pecas.append(juntar(mon, f"{GRUPO}_monitor"))

    # ── TV (objeto clicável "experience") com a luminária em cima, LED virado para baixo ──
    # (a TV do código tem escala 0,92; as medidas abaixo já estão multiplicadas)
    tela = [
        caixa("tv", (-4.8, 4.14, -2.8), (0.083, 1.38, 2.392), preto_tela, tv, chanfro=0.018),
        caixa("tv_traseira", (-4.845, 4.1, -2.8), (0.01, 0.8, 1.4), preto, tv, chanfro=0.004),
        caixa("tv_presilha", (-4.777, 4.848, -2.8), (0.156, 0.11, 0.129), preto, tv, chanfro=0.012),
        caixa("tv_barra", (-4.69, 4.876, -2.8), (0.147, 0.064, 1.748), preto, tv, chanfro=0.02),
        caixa("tv_led", (-4.644, 4.842, -2.8), (0.046, 0.004, 1.656), led_tv, tv, chanfro=0.0),
    ]
    pecas.append(juntar(tela, f"{GRUPO}_tv"))

    # Peças fixas: uma malha para os móveis e outra para os objetos (cada grupo tem o seu atlas)
    moveis = [o for o in pecas if not o.get("bk_kind") and o["bk_group"] == GRUPO]
    objetos = [o for o in pecas if not o.get("bk_kind") and o["bk_group"] == GRUPO_OBJETOS]
    clicaveis = [o for o in pecas if o.get("bk_kind")]
    return [juntar(moveis, f"{GRUPO}_fixo"), juntar(objetos, f"{GRUPO_OBJETOS}_fixo")] + clicaveis
