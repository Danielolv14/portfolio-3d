"""Estrutura do nicho (estante), modelada no Blender (estudo de 21/10, docs/plano/estudo-bake.md).

Substitui do código só a estrutura (`furniture-niche`): fundo, laterais, rodapé recuado, prateleiras
grossas com fita de borda de madeira e o tampo. Os objetos nas prateleiras continuam vindo do código
por enquanto: a estante vai virar o "Sobre mim" (docs/plano/09-estante-sobre-mim.md).
Medidas e posições: src/room/Niche.jsx (coordenadas do site).
"""
from modelos.base import caixa, cor, juntar

GRUPO = "furniture-niche"
X0, X1, Z0, Z1 = -5.0, -4.24, 2.3, 4.95
SIDE, BOARD = 0.06, 0.11
LEVELS = (0.25, 1.6, 2.85, 4.1)
TAMPO = 4.75
FITA = 0.012


def criar():
    m = {"group": GRUPO, "area": "niche"}
    branco = cor("branco_nicho", "#f3eee5", rugosidade=0.55)
    fundo = cor("fundo_nicho", "#f2dcc1", rugosidade=0.95)
    rodape = cor("rodape_nicho", "#e2dcd2", rugosidade=0.7)
    fita = cor("fita_madeira", "#b8936c", rugosidade=0.6)

    profundidade = X1 - X0
    cx, cz = (X0 + X1) / 2, (Z0 + Z1) / 2
    interno = Z1 - Z0 - SIDE * 2
    altura_lado = TAMPO - BOARD / 2
    pecas = [caixa("fundo", (X0 + 0.01, altura_lado / 2, cz), (0.02, altura_lado, Z1 - Z0), fundo, m, chanfro=0.004)]
    for z in (Z0 + SIDE / 2, Z1 - SIDE / 2):
        pecas.append(caixa("lateral", (cx - FITA / 2, altura_lado / 2, z), (profundidade - FITA, altura_lado, SIDE), branco, m, chanfro=0.012))
        pecas.append(caixa("fita_lateral", (X1 - FITA / 2, altura_lado / 2, z), (FITA, altura_lado, SIDE), fita, m, chanfro=0.004))
    plinto = LEVELS[0] - BOARD
    pecas.append(caixa("rodape", (cx - 0.04, plinto / 2, cz), (profundidade - 0.08, plinto, interno), rodape, m, chanfro=0.008))
    for y in LEVELS:
        pecas.append(caixa("prateleira", (cx - FITA / 2, y - BOARD / 2, cz), (profundidade - FITA, BOARD, interno), branco, m, chanfro=0.012))
        pecas.append(caixa("fita", (X1 - FITA / 2, y - BOARD / 2, cz), (FITA, BOARD, interno), fita, m, chanfro=0.004))
    largura_tampo = Z1 - Z0 + 0.04
    pecas.append(caixa("tampo", (cx + 0.02 - FITA / 2, TAMPO, cz), (profundidade + 0.04 - FITA, BOARD, largura_tampo), branco, m, chanfro=0.015))
    pecas.append(caixa("fita_tampo", (X1 + 0.04 - FITA / 2, TAMPO, cz), (FITA, BOARD, largura_tampo), fita, m, chanfro=0.004))
    return [juntar(pecas, f"{GRUPO}_fixo")]
