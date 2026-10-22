"""Parede da mesa, modelada no Blender (estudo de 21/10, docs/plano/estudo-bake.md).

Substitui as peças de `furniture-desk` e `props-desk` do código: painel, tampo, lateral, gaveteiro,
gabinete, monitor (objeto clicável "projects"), TV com a luminária (objeto clicável "experience"),
relógio, mousepad, caderninho e calculadora. Continuam vindo do código: teclado, mouse, fones, cabos
e a cadeira (que se mexe). Medidas e posições: src/room/Desk.jsx (coordenadas do site).
"""
from modelos.base import caixa, capsula, cilindro, compor, cor, juntar, placa, textura

GRUPO = "furniture-desk"
GRUPO_OBJETOS = "props-desk"
RAD90 = 1.5708


def criar():
    m = {"group": GRUPO, "area": "desk"}
    p = {"group": GRUPO_OBJETOS, "area": "desk"}
    monitor = {**m, "kind": "hotspot", "id": "projects"}
    tv = {**m, "kind": "hotspot", "id": "experience"}

    # Paleta (sRGB, como no CSS). Madeiras do quarto real, um pouco mais saturadas
    carvalho = cor("carvalho", "#d2ad82", rugosidade=0.7)
    carvalho_fundo = cor("carvalho_fundo", "#9c7b58", rugosidade=0.8)
    nogueira = cor("nogueira", "#6a4730", rugosidade=0.45)
    nogueira_frente = cor("nogueira_frente", "#7b5539", rugosidade=0.4)
    cromado = cor("cromado", "#dfe3e8", rugosidade=0.15, metal=1.0)
    preto = cor("preto_fosco", "#1d1e22", rugosidade=0.5)
    preto_brilho = cor("preto_brilho", "#121316", rugosidade=0.22)
    preto_tela = cor("preto_moldura", "#131418", rugosidade=0.3)
    grafite = cor("grafite", "#2c2e33", rugosidade=0.45)
    grade = cor("grade", "#0b0c0e", rugosidade=0.85)
    vidro_lente = cor("vidro_lente", "#05060a", rugosidade=0.05)
    azul_marinho = cor("azul_marinho", "#283044", rugosidade=0.95)
    azul_borda = cor("azul_borda", "#323b52", rugosidade=0.9)
    camuflado = textura("camuflado", "camo.png", rugosidade=0.55)
    adesivos = textura("adesivos", compor("adesivos.png", "#1d1e22", "adesivos_gabinete"), rugosidade=0.45)
    logo = textura("logo", compor("logo.png", "#1d1e22", "logo_gabinete"), rugosidade=0.3, metal=0.4)
    asas = textura("asas", compor("asas.png", "#1d1e22", "asas_gabinete"), rugosidade=0.3, metal=0.4)
    relogio = textura("relogio", compor("relogio.png", "#1f2a24", "visor_relogio"), rugosidade=0.2)
    calculadora = textura("calculadora", "calculadora.png", rugosidade=0.5)
    led_rgb = cor("emit-B-rgb", "#2a0a24", emissao="#ff3fd2", forca=6.0)
    led_botao = cor("emit-B-botao", "#2a0a24", emissao="#ff3fd2", forca=4.0)
    led_tv = cor("emit-G-barra", "#ffffff", emissao="#f4f7ff", forca=8.0)

    pecas = []

    # ── Painel ripado de carvalho: fundo + réguas verticais com frestas (z = -4,85 a -0,75) ──
    pecas.append(caixa("painel_fundo", (-4.97, 2.5, -2.8), (0.06, 4.9, 4.1), carvalho_fundo, m, chanfro=0.006))
    largura, fresta = 0.185, 0.03
    z = -4.85 + fresta / 2
    while z + largura <= -0.75 + 1e-6:
        pecas.append(caixa("ripa", (-4.9, 2.5, z + largura / 2), (0.08, 4.9, largura), carvalho, m, chanfro=0.01))
        z += largura + fresta

    # ── Mesa: tampo (termina no gaveteiro), lateral e gaveteiro com 4 gavetas ──
    pecas.append(caixa("tampo", (-4.105, 1.51, -3.05), (1.51, 0.1, 3.0), nogueira, m, chanfro=0.015))
    pecas.append(caixa("lateral", (-4.13, 0.73, -4.51), (1.46, 1.46, 0.08), nogueira, m, chanfro=0.012))
    pecas.append(caixa("gaveteiro", (-3.805, 0.78, -1.0), (2.11, 1.56, 1.1), nogueira, m, chanfro=0.015))
    for y in (0.22, 0.6, 0.98, 1.36):
        pecas.append(caixa("gaveta", (-2.735, y, -1.0), (0.03, 0.34, 1.02), nogueira_frente, m, chanfro=0.008))
        pecas.append(cilindro("puxador", (-2.68, y + 0.05, -1.0), 0.016, 0.52, cromado, m, segmentos=16, rotacao=(RAD90, 0, 0)))
        for dz in (-0.22, 0.22):
            pecas.append(caixa("suporte", (-2.705, y + 0.05, -1.0 + dz), (0.05, 0.026, 0.026), cromado, m, chanfro=0.006))

    # ── Gabinete sobre o gaveteiro: pés, corpo, moldura chanfrada, tela camuflada, LED, topo ──
    base = 1.59  # o corpo fica 3 cm acima do gaveteiro, apoiado nos pés
    for x in (-4.53, -3.47):
        for zz in (-1.22, -0.78):
            pecas.append(cilindro("pe_gabinete", (x, 1.575, zz), 0.035, 0.03, grafite, m, segmentos=16))
    pecas.append(caixa("gabinete", (-3.99, base + 0.88, -1.0), (1.28, 1.76, 0.6), preto, m, chanfro=0.03))
    topo = base + 1.76
    for i in range(9):
        pecas.append(caixa("grade_topo", (-4.5 + i * 0.105, topo + 0.003, -1.0), (0.055, 0.006, 0.42), grade, m, chanfro=0.002))
    # Botão de ligar com anel de LED e 2 portas USB, no topo perto da frente
    pecas.append(cilindro("botao", (-3.47, topo + 0.006, -0.85), 0.032, 0.012, preto_brilho, m, segmentos=24, chanfro=0.003))
    pecas.append(cilindro("botao_led", (-3.47, topo + 0.003, -0.85), 0.04, 0.006, led_botao, m, segmentos=24, chanfro=0.0))
    for zz in (-1.06, -1.14):
        pecas.append(caixa("usb", (-3.47, topo + 0.003, zz), (0.045, 0.006, 0.022), grade, m, chanfro=0.0015))
    frente = -3.35
    y0 = base + 0.03
    for nome, pos, tam in (
        ("moldura_esq", (frente + 0.025, y0 + 0.852, -1.2875), (0.05, 1.76, 0.045)),
        ("moldura_dir", (frente + 0.025, y0 + 0.852, -0.7125), (0.05, 1.76, 0.045)),
        ("moldura_topo", (frente + 0.025, y0 + 1.682, -1.0), (0.05, 0.1, 0.53)),
        ("moldura_base", (frente + 0.025, y0 + 0.012, -1.0), (0.05, 0.08, 0.53)),
    ):
        pecas.append(caixa(nome, pos, tam, preto, m, chanfro=0.01))
    pecas.append(placa("tela_camuflada", (frente + 0.01, y0 + 0.805, -1.0), 0.53, 1.49, 0.02, camuflado, m))
    pecas.append(caixa("led_gabinete", (frente + 0.022, y0 + 1.595, -1.0), (0.006, 0.035, 0.44), led_rgb, m, chanfro=0.0))
    pecas.append(placa("logo", (frente + 0.024, y0 + 1.3, -1.04), 0.12, 0.12, 0.006, logo, m, chanfro=0.002))
    pecas.append(placa("asas", (frente + 0.024, y0 + 0.3, -1.0), 0.36, 0.09, 0.006, asas, m, chanfro=0.002))
    pecas.append(placa("adesivos", (-3.59, base + 1.42, -0.697), 0.44, 0.44, 0.004, adesivos, m, normal="+z", chanfro=0.001))

    # ── Relógio LCD (levemente inclinado para trás), mousepad, caderninho e calculadora ──
    pecas.append(caixa("relogio", (-4.57, 1.721, -4.15), (0.05, 0.27, 0.48), grafite, p, chanfro=0.012, rotacao=(0, 0, 0.1)))
    pecas.append(placa("visor_relogio", (-4.547, 1.758, -4.15), 0.41, 0.125, 0.006, relogio, p, rotacao=(0, 0, 0.1)))
    pecas.append(caixa("mousepad", (-4.075, 1.571, -3.275), (1.25, 0.018, 2.15), azul_marinho, p, chanfro=0.008))
    pecas.append(caixa("mousepad_borda", (-4.075, 1.566, -3.275), (1.27, 0.008, 2.17), azul_borda, p, chanfro=0.004))
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
