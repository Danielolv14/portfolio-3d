"""Estrutura do quarto, modelada no Blender (estudo de 21/10, docs/plano/estudo-bake.md).

Substitui do código: laje, piso, rodapé, porta e o pôster do de_dust2. Continuam vindo do código:
as paredes (peça única com os vãos) e a janela com a persiana.
Medidas e posições: src/room/Shell.jsx (coordenadas do site).
"""
import random

from modelos.base import caixa, cilindro, cor, juntar, placa, textura

GRUPO = "shell"
RAD90 = 1.5708
DOOR = {"z0": 0.0, "z1": 1.75, "top": 4.4}
CASING = 0.17


def criar():
    m = {"group": GRUPO, "area": "shell"}
    rnd = random.Random(14)

    rejunte = cor("rejunte", "#b9afa3", rugosidade=0.9)
    rodape = cor("rodape", "#e6dfd5", rugosidade=0.35)
    folha = cor("porta", "#b26a32", rugosidade=0.4)
    batente = cor("batente", "#9e5c2a", rugosidade=0.45)
    dourado = cor("dobradica", "#b48a52", rugosidade=0.3, metal=1.0)
    cromado = cor("cromado", "#dfe3e8", rugosidade=0.15, metal=1.0)
    preto = cor("preto_fosco", "#1d1e22", rugosidade=0.5)
    moldura = cor("moldura_poster", "#17181b", rugosidade=0.45)

    pecas = []

    # ── Laje (vista de fora como uma maquete) com o topo 1,2 cm abaixo do piso: aparece no rejunte ──
    pecas.append(caixa("laje", (0, -0.206, 0), (10.6, 0.388, 10.6), rejunte, m, chanfro=0.02))

    # ── Porcelanato: placas de verdade com 1,2 cm de rejunte; cada uma com um tom levemente diferente ──
    n, lado, junta = 6, 10.6 / 6, 0.012
    for i in range(n):
        for k in range(n):
            tom = rnd.uniform(-1, 1)
            hexa = "#%02x%02x%02x" % tuple(max(0, min(255, round(c + tom * 4))) for c in (236, 230, 220))
            placa_mat = cor(f"porcelanato_{hexa}", hexa, rugosidade=0.3)
            x = -5.3 + lado * (i + 0.5)
            z = -5.3 + lado * (k + 0.5)
            pecas.append(caixa("piso", (x, -0.006, z), (lado - junta, 0.012, lado - junta), placa_mat, m, chanfro=0.004))

    # ── Rodapé (fora da porta, do nicho e de trás do painel ripado da mesa) ──
    pecas.append(caixa("rodape_b", (0.15, 0.1, -4.98), (10.3, 0.2, 0.04), rodape, m, chanfro=0.008))
    for z0, z1 in ((-0.75, DOOR["z0"] - CASING), (DOOR["z1"] + CASING, 2.3), (4.95, 5.3)):
        pecas.append(caixa("rodape_a", (-4.98, 0.1, (z0 + z1) / 2), (0.04, 0.2, z1 - z0), rodape, m, chanfro=0.008))

    # ── Porta: folha recuada no vão, batentes, dobradiças e maçaneta de alavanca cromada ──
    largura = DOOR["z1"] - DOOR["z0"]
    cz = (DOOR["z0"] + DOOR["z1"]) / 2
    pecas.append(caixa("porta", (-5.065, DOOR["top"] / 2 + 0.01, cz), (0.07, DOOR["top"] - 0.02, largura), folha, m, chanfro=0.012))
    for z in (DOOR["z0"] - CASING / 2, DOOR["z1"] + CASING / 2):
        pecas.append(caixa("batente", (-4.9925, (DOOR["top"] + CASING) / 2, z), (0.075, DOOR["top"] + CASING, CASING), batente, m, chanfro=0.012))
    pecas.append(caixa("batente_topo", (-4.9925, DOOR["top"] + CASING / 2, cz), (0.075, CASING, largura + CASING * 2), batente, m, chanfro=0.012))
    for y in (0.7, 2.2, 3.7):
        pecas.append(cilindro("dobradica", (-5.02, y, DOOR["z0"] + 0.012), 0.024, 0.22, dourado, m, segmentos=16))
    hz = DOOR["z1"] - 0.2
    pecas.append(cilindro("espelho", (-5.02, 2.15, hz), 0.065, 0.025, cromado, m, segmentos=32, rotacao=(0, 0, RAD90)))
    pecas.append(cilindro("eixo", (-4.98, 2.15, hz), 0.022, 0.1, cromado, m, segmentos=16, rotacao=(0, 0, RAD90)))
    pecas.append(caixa("alavanca", (-4.94, 2.15, hz - 0.12), (0.035, 0.04, 0.3), cromado, m, chanfro=0.015))
    pecas.append(cilindro("tambor", (-5.02, 1.88, hz), 0.045, 0.025, cromado, m, segmentos=28, rotacao=(0, 0, RAD90)))
    pecas.append(caixa("fechadura", (-5.005, 1.88, hz), (0.01, 0.045, 0.012), preto, m, chanfro=0.002))

    # ── Pôster do de_dust2 entre a janela e os pôsteres dos filmes ──
    pecas.append(caixa("moldura_cs", (0.95, 3.4, -4.975), (0.8, 1.08, 0.04), moldura, m, chanfro=0.012))
    arte = textura("poster_dust", "poster_dust.png", rugosidade=0.55)
    pecas.append(placa("poster_dust", (0.95, 3.4, -4.953), 0.72, 1.0, 0.004, arte, m, normal="+z", chanfro=0.001))

    return [juntar(pecas, f"{GRUPO}_novo")]
