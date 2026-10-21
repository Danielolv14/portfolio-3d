"""Parede da mesa, modelada no Blender (fatia vertical do estudo de 21/10, docs/plano/estudo-bake.md).

Substitui as peças de `furniture-desk` do código: painel, tampo, lateral, gaveteiro, gabinete,
monitor (objeto clicável "projects") e TV com a luminária (objeto clicável "experience").
Os objetos pequenos (teclado, mouse, cadeira, relógio, cabos...) continuam vindo do código.
Medidas e posições: src/room/Desk.jsx (coordenadas do site).
"""
from modelos.base import caixa, cilindro, cor, juntar, textura

GRUPO = "furniture-desk"


def criar():
    m = {"group": GRUPO, "area": "desk"}
    monitor = {**m, "kind": "hotspot", "id": "projects"}
    tv = {**m, "kind": "hotspot", "id": "experience"}

    # Paleta (sRGB, como no CSS). Madeiras do quarto real, um pouco mais saturadas
    carvalho = cor("carvalho", "#d2ad82", rugosidade=0.7)
    carvalho_fundo = cor("carvalho_fundo", "#9c7b58", rugosidade=0.8)
    nogueira = cor("nogueira", "#6a4730", rugosidade=0.45)
    nogueira_frente = cor("nogueira_frente", "#7b5539", rugosidade=0.4)
    cromado = cor("cromado", "#dfe3e8", rugosidade=0.15, metal=1.0)
    preto = cor("preto_fosco", "#1d1e22", rugosidade=0.5)
    preto_tela = cor("preto_moldura", "#131418", rugosidade=0.3)
    grade = cor("grade", "#0e0f11", rugosidade=0.85)
    camuflado = textura("camuflado", "camo.png", rugosidade=0.55)
    led_rgb = cor("emit-B-rgb", "#2a0a24", emissao="#ff3fd2", forca=6.0)
    led_tv = cor("emit-G-barra", "#ffffff", emissao="#f4f7ff", forca=8.0)

    pecas = []

    # Painel ripado de carvalho atrás da TV e do monitor: fundo + réguas verticais com frestas
    # (no código era uma caixa só com textura). Vai de z = -4,85 a -0,75; frente em x = -4,86
    pecas.append(caixa("painel_fundo", (-4.97, 2.5, -2.8), (0.06, 4.9, 4.1), carvalho_fundo, m, chanfro=0.006))
    largura, fresta = 0.185, 0.03
    z = -4.85 + fresta / 2
    while z + largura <= -0.75 + 1e-6:
        pecas.append(caixa("ripa", (-4.9, 2.5, z + largura / 2), (0.08, 4.9, largura), carvalho, m, chanfro=0.01))
        z += largura + fresta

    # Tampo (termina no gaveteiro, sem atravessar), lateral e gaveteiro com 4 gavetas
    pecas.append(caixa("tampo", (-4.105, 1.51, -3.05), (1.51, 0.1, 3.0), nogueira, m, chanfro=0.015))
    pecas.append(caixa("lateral", (-4.13, 0.73, -4.51), (1.46, 1.46, 0.08), nogueira, m, chanfro=0.012))
    pecas.append(caixa("gaveteiro", (-3.805, 0.78, -1.0), (2.11, 1.56, 1.1), nogueira, m, chanfro=0.015))
    for y in (0.22, 0.6, 0.98, 1.36):
        pecas.append(caixa("gaveta", (-2.735, y, -1.0), (0.03, 0.34, 1.02), nogueira_frente, m, chanfro=0.008))
        pecas.append(cilindro("puxador", (-2.68, y + 0.05, -1.0), 0.016, 0.52, cromado, m, segmentos=16, rotacao=(1.5708, 0, 0)))
        for dz in (-0.22, 0.22):
            pecas.append(caixa("suporte", (-2.705, y + 0.05, -1.0 + dz), (0.05, 0.026, 0.026), cromado, m, chanfro=0.006))

    # Gabinete preto com moldura chanfrada, tela camuflada recuada e fita de LED magenta no topo
    pecas.append(caixa("gabinete", (-3.99, 2.44, -1.0), (1.28, 1.76, 0.6), preto, m, chanfro=0.025))
    pecas.append(caixa("grade_topo", (-4.05, 3.326, -1.0), (1.1, 0.012, 0.46), grade, m, chanfro=0.003))
    frente = -3.35
    for nome, pos, tam in (
        ("moldura_esq", (frente + 0.025, 2.452, -1.2875), (0.05, 1.76, 0.045)),
        ("moldura_dir", (frente + 0.025, 2.452, -0.7125), (0.05, 1.76, 0.045)),
        ("moldura_topo", (frente + 0.025, 3.282, -1.0), (0.05, 0.1, 0.53)),
        ("moldura_base", (frente + 0.025, 1.612, -1.0), (0.05, 0.08, 0.53)),
    ):
        pecas.append(caixa(nome, pos, tam, preto, m, chanfro=0.008))
    pecas.append(caixa("tela_camuflada", (frente + 0.01, 2.405, -1.0), (0.02, 1.49, 0.53), camuflado, m, chanfro=0.004, uv=(2, 1)))
    pecas.append(caixa("led_gabinete", (frente + 0.022, 3.195, -1.0), (0.006, 0.035, 0.44), led_rgb, m, chanfro=0.0))

    # Monitor no braço (objeto clicável "projects"). A tela (screen-projects) é desenhada ao vivo
    # pelo código em x = -4,343; a moldura tem a frente em -4,345, logo atrás
    mon = [
        caixa("monitor", (-4.38, 2.46, -2.85), (0.07, 1.32, 2.32), preto_tela, monitor, chanfro=0.02),
        caixa("monitor_traseira", (-4.456, 2.42, -2.85), (0.08, 0.72, 1.1), preto, monitor, chanfro=0.03),
        caixa("webcam", (-4.36, 3.17, -2.85), (0.12, 0.1, 0.28), preto, monitor, chanfro=0.03),
        cilindro("braco_poste", (-4.76, 1.995, -2.85), 0.04, 0.73, preto, monitor),
        cilindro("braco_horizontal", (-4.62, 2.36, -2.85), 0.035, 0.28, preto, monitor, rotacao=(0, 0, 1.5708)),
        caixa("braco_base", (-4.76, 1.6, -2.85), (0.16, 0.08, 0.18), preto, monitor, chanfro=0.015),
    ]
    pecas.append(juntar(mon, f"{GRUPO}_monitor"))

    # TV (objeto clicável "experience") com a luminária em cima, LED virado para baixo
    # (a TV do código tem escala 0,92; as medidas abaixo já estão multiplicadas)
    tela = [
        caixa("tv", (-4.8, 4.14, -2.8), (0.083, 1.38, 2.392), preto_tela, tv, chanfro=0.018),
        caixa("tv_presilha", (-4.777, 4.848, -2.8), (0.156, 0.11, 0.129), preto, tv, chanfro=0.012),
        caixa("tv_barra", (-4.69, 4.876, -2.8), (0.147, 0.064, 1.748), preto, tv, chanfro=0.02),
        caixa("tv_led", (-4.644, 4.842, -2.8), (0.046, 0.004, 1.656), led_tv, tv, chanfro=0.0),
    ]
    pecas.append(juntar(tela, f"{GRUPO}_tv"))

    # Peças fixas da mesa numa malha só
    fixas = [p for p in pecas if p.get("bk_kind") == ""]
    clicaveis = [p for p in pecas if p.get("bk_kind")]
    return [juntar(fixas, f"{GRUPO}_fixo")] + clicaveis
