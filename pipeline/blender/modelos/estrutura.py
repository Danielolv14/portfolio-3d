"""Estrutura do quarto, modelada no Blender (decisão 14: moderno, minimalista e futurista).

Alvo visual: docs/plano/alvo/alvo-dia.webp e alvo-noite.png. Substitui do código tudo do grupo
shell: laje, piso, paredes, rodapé, porta, janela e o pôster do de_dust2. A vista lá fora (céu, sol,
estrelas) e o vidro continuam ao vivo no site (kind live/glass).
Medidas e posições: src/room/Shell.jsx (coordenadas do site).
"""
import random

from modelos.base import caixa, cilindro, cor, juntar, parede, pbr, placa, textura

GRUPO = "shell"
RAD90 = 1.5708
H = 5.6
T = 0.3
WIN = {"x0": -2.5, "x1": 0.3, "y0": 2.0, "y1": 4.3}
DOOR = {"z0": 0.0, "z1": 1.75, "top": 4.4}
CASING = 0.12


def janela(m, preto, peitoril):
    """Janela de alumínio preto: guarnição rente à parede, marco no vão e duas folhas de correr."""
    x0, x1, y0, y1 = WIN["x0"], WIN["x1"], WIN["y0"], WIN["y1"]
    cx, cy, w, h = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0
    p = [
        # guarnição fina na face de dentro da parede
        caixa("guarnicao", (cx, y1 + 0.03, -4.99), (w + 0.12, 0.06, 0.02), preto, m, chanfro=0.006),
        caixa("guarnicao", (cx, y0 - 0.03, -4.99), (w + 0.12, 0.06, 0.02), preto, m, chanfro=0.006),
        caixa("guarnicao", (x0 - 0.03, cy, -4.99), (0.06, h, 0.02), preto, m, chanfro=0.006),
        caixa("guarnicao", (x1 + 0.03, cy, -4.99), (0.06, h, 0.02), preto, m, chanfro=0.006),
        # marco recuado no meio do vão
        caixa("marco", (cx, y1 - 0.03, -5.15), (w, 0.06, 0.14), preto, m, chanfro=0.006),
        caixa("marco", (cx, y0 + 0.03, -5.15), (w, 0.06, 0.14), preto, m, chanfro=0.006),
        caixa("marco", (x0 + 0.03, cy, -5.15), (0.06, h, 0.14), preto, m, chanfro=0.006),
        caixa("marco", (x1 - 0.03, cy, -5.15), (0.06, h, 0.14), preto, m, chanfro=0.006),
        # peitoril claro, fino, para destacar a janela na parede grafite
        caixa("peitoril", (cx, y0 - 0.02, -4.93), (w + 0.2, 0.05, 0.16), peitoril, m, chanfro=0.008),
    ]
    # Duas folhas de correr, cada uma num trilho, com perfil fino e uma travessa no meio
    ya, yb = y0 + 0.06, y1 - 0.06
    fh = yb - ya
    for a, b, z in ((x0 + 0.06, cx + 0.04, -5.19), (cx - 0.04, x1 - 0.06, -5.11)):
        fw, fx = b - a, (a + b) / 2
        p += [
            caixa("folha", (fx, yb - 0.025, z), (fw, 0.05, 0.04), preto, m, chanfro=0.005),
            caixa("folha", (fx, ya + 0.025, z), (fw, 0.05, 0.04), preto, m, chanfro=0.005),
            caixa("folha", (a + 0.025, ya + fh / 2, z), (0.05, fh, 0.04), preto, m, chanfro=0.005),
            caixa("folha", (b - 0.025, ya + fh / 2, z), (0.05, fh, 0.04), preto, m, chanfro=0.005),
            caixa("travessa", (fx, ya + fh * 0.42, z), (fw - 0.08, 0.03, 0.03), preto, m, chanfro=0.004),
        ]
    return p


def porta(m, folha, preto):
    """Porta lisa, clara, com guarnição fina da mesma cor e maçaneta de alavanca preta."""
    largura = DOOR["z1"] - DOOR["z0"]
    cz = (DOOR["z0"] + DOOR["z1"]) / 2
    hz = DOOR["z1"] - 0.18
    p = [caixa("porta", (-5.08, DOOR["top"] / 2 + 0.01, cz), (0.06, DOOR["top"] - 0.02, largura - 0.02), folha, m, chanfro=0.01)]
    for z in (DOOR["z0"] - CASING / 2, DOOR["z1"] + CASING / 2):
        p.append(caixa("guarnicao_porta", (-4.985, (DOOR["top"] + CASING) / 2, z), (0.03, DOOR["top"] + CASING, CASING), folha, m, chanfro=0.008))
    p.append(caixa("guarnicao_porta", (-4.985, DOOR["top"] + CASING / 2, cz), (0.03, CASING, largura + CASING * 2), folha, m, chanfro=0.008))
    # Maçaneta: roseta redonda, eixo e alavanca reta, tudo preto fosco
    p.append(cilindro("roseta", (-5.04, 2.1, hz), 0.05, 0.016, preto, m, segmentos=32, rotacao=(0, 0, RAD90)))
    p.append(cilindro("eixo", (-5.0, 2.1, hz), 0.016, 0.07, preto, m, segmentos=16, rotacao=(0, 0, RAD90)))
    p.append(caixa("alavanca", (-4.97, 2.1, hz - 0.1), (0.022, 0.026, 0.24), preto, m, chanfro=0.01))
    p.append(cilindro("tranca", (-5.04, 1.86, hz), 0.032, 0.014, preto, m, segmentos=24, rotacao=(0, 0, RAD90)))
    return p


def criar():
    m = {"group": GRUPO, "area": "shell"}
    rnd = random.Random(14)

    # Paredes de massa pintada (textura de foto, CC0), levadas para as cores do alvo
    clara = pbr("parede_clara", "beige_wall_001", 6.0, tinta="#e9e5df", contraste=0.6, rugosidade=0.9, relevo=0.6)
    grafite = pbr("parede_grafite", "beige_wall_001", 6.0, tinta="#3b3e44", contraste=0.6, rugosidade=0.85, relevo=0.6)
    # As faces "cortadas" da maquete (topo das paredes, pontas soltas, lateral da laje): creme claro
    corte = cor("corte_maquete", "#efe9e1", rugosidade=0.8)
    rejunte = cor("rejunte", "#b8a690", rugosidade=0.9)
    rodape_claro = cor("rodape_claro", "#dcd7cf", rugosidade=0.6)
    rodape_grafite = cor("rodape_grafite", "#2c2f34", rugosidade=0.6)
    folha = cor("porta_clara", "#e6e3de", rugosidade=0.5)
    preto = cor("preto_fosco", "#1c1d20", rugosidade=0.45, metal=0.3)
    peitoril = cor("peitoril", "#d3cec6", rugosidade=0.35)
    moldura = cor("moldura_poster", "#17181b", rugosidade=0.45)

    pecas = []

    # ── Laje creme (a base da maquete) e, por cima, uma lâmina cor de rejunte que aparece nas juntas ──
    pecas.append(caixa("laje", (0, -0.208, 0), (10.6, 0.388, 10.6), corte, m, chanfro=0.02))
    pecas.append(caixa("rejunte", (0, -0.013, 0), (10.58, 0.002, 10.58), rejunte, m, chanfro=0.0))

    # ── Porcelanato quente: placas menores (8 x 8), tom areia, com o veio suave de uma pedra (foto CC0).
    # Cada placa pega um pedaço diferente da foto (UV deslocado pela posição), como placas de verdade ──
    porcelanato = pbr("porcelanato", "marble_01", 3.4, tinta="#ddcdb7", contraste=0.3, rugosidade=0.28, relevo=0.15)
    n, lado, junta = 8, 10.6 / 8, 0.01
    for i in range(n):
        for k in range(n):
            x = -5.3 + lado * (i + 0.5)
            z = -5.3 + lado * (k + 0.5)
            pecas.append(caixa("piso", (x + rnd.uniform(-0.002, 0.002), -0.006, z), (lado - junta, 0.012, lado - junta), porcelanato, m, chanfro=0.003))

    # ── Paredes: B (cama e janela) em grafite, A (mesa, porta, estante) clara; topo e ponta solta em creme ──
    # No Blender, o y do site é z e o z do site é -y
    pecas.append(
        parede("parede_b", (-5.3, 5.3), (0, H), [(WIN["x0"], WIN["x1"], WIN["y0"], WIN["y1"])], T, grafite, m,
               plano="xy", centro=-5.15, corte=(corte, lambda c, nn: (nn.z > 0.9 and c.z > H - 0.05) or (nn.x > 0.9 and c.x > 5.29)))
    )
    pecas.append(
        parede("parede_a", (-5.0, 5.3), (0, H), [(DOOR["z0"], DOOR["z1"], -0.1, DOOR["top"])], T, clara, m,
               plano="zy", centro=-5.15, corte=(corte, lambda c, nn: (nn.z > 0.9 and c.z > H - 0.05) or (nn.y < -0.9 and c.y < -5.29)))
    )

    # ── Rodapé baixo e fino, da cor de cada parede (some no minimalismo, mas marca o encontro com o piso) ──
    pecas.append(caixa("rodape_b", (0.15, 0.08, -4.985), (10.3, 0.16, 0.03), rodape_grafite, m, chanfro=0.006))
    for z0, z1 in ((-5.0, DOOR["z0"] - CASING), (DOOR["z1"] + CASING, 5.3)):
        pecas.append(caixa("rodape_a", (-4.985, 0.08, (z0 + z1) / 2), (0.03, 0.16, z1 - z0), rodape_claro, m, chanfro=0.006))

    pecas += porta(m, folha, preto)
    pecas += janela(m, preto, peitoril)

    # ── Pôster do de_dust2 entre a janela e os pôsteres dos filmes, moldura preta fina ──
    pecas.append(caixa("moldura_cs", (0.95, 3.4, -4.975), (0.78, 1.06, 0.03), moldura, m, chanfro=0.008))
    arte = textura("poster_dust", "poster_dust.png", rugosidade=0.55)
    pecas.append(placa("poster_dust", (0.95, 3.4, -4.958), 0.72, 1.0, 0.004, arte, m, normal="+z", chanfro=0.001))

    return [juntar(pecas, f"{GRUPO}_novo")]
