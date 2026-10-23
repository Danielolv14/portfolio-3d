"""Área da cama, modelada no Blender (decisão 14; alvo em docs/plano/alvo/).

Cama baixa de carvalho claro com encosto e braço estofados (cara de sofá-cama), fita de LED atrás do
encosto e criado-mudo flutuante. Substitui do código: estrutura da cama, cabeceira, criado-mudo, luminária de cobre, pôsteres e o
tapete (que era feito de camadas finas empilhadas e assava com a beirada preta). Continuam vindo do
código: a roupa de cama (colchão, edredom matelassê, travesseiros, boné, cordão), o celular (objeto
clicável, com a tela ao vivo), a bola e os objetos em cima do criado-mudo.
Medidas e posições: src/room/Bed.jsx (coordenadas do site).
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector

from modelos.base import (ESCALA_MODELOS, _objeto, bola_ft5, caixa, cilindro, cor, felpudo, juntar, macio, na_bola, pbr, placa, texto,
                          textura, transformar)

GRUPO = "furniture-bed"
GRUPO_OBJETOS = "props-bed"

# Fontes dos escritos da bola (as mais parecidas com as da Mikasa FT-5 que vêm no Windows)
FONTE_MIKASA = "C:/Windows/Fonts/ariblk.ttf"
FONTE_TEXTO = "C:/Windows/Fonts/arial.ttf"
FONTE_SERIFA = "C:/Windows/Fonts/timesbd.ttf"
FONTE_ASSINATURA = "C:/Windows/Fonts/segoescb.ttf"
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


def edredom(material, marca):
    """Edredom matelassê: a mesma conta do código (src/room/Bed.jsx, quiltGeometry), feita no Blender.
    Uma grade fina cobre o colchão, faz a curva na quina e cai pela lateral e pelo pé da cama; os gomos
    em losango são relevo de verdade (zero na costura, estufado no meio)."""
    x0, x1, z0, z1, topo, r, cai, gomo, estufa = -1.0, 4.3, -4.95, -2.1, 1.0, 0.1, 0.4, 0.6, 0.045
    curva_q = r * math.pi / 2
    extra = curva_q + cai
    sx, sz = x1 - x0 + extra, z1 - z0 + extra
    nx, nz = round(sx * 18), round(sz * 18)
    bm = bmesh.new()
    grade = []
    for i in range(nx + 1):
        linha = []
        for j in range(nz + 1):
            fx = x1 - sx + sx * i / nx
            fz = z0 + sz * j / nz
            dx, dz = max(0.0, x0 - fx), max(0.0, fz - z1)
            comp = math.hypot(dx, dz)
            d = min(comp, extra)
            dir_x, dir_z = (-dx / comp, dz / comp) if comp else (0.0, 0.0)
            th = min(d / r, math.pi / 2)
            queda = max(0.0, d - curva_q)
            t = queda / cai
            ao_longo = fx * abs(dir_z) + fz * abs(dir_x)
            fora = r * math.sin(th) + 0.032 * t * math.sin(ao_longo * 6.3 + 1.2)
            plano = max(0.0, 1 - d / curva_q)
            ruga = 0.014 * plano * (math.sin(fx * 1.35 + 0.4) * math.cos(fz * 1.8 - 0.3) + 0.5 * math.sin(fx * 3.1 + fz * 2.2))
            a, b = (fx + fz) / gomo, (fx - fz) / gomo
            p = estufa * abs(math.sin(math.pi * a) * math.sin(math.pi * b)) ** 0.5
            nh, ny = math.sin(th), math.cos(th)
            linha.append(bm.verts.new((max(fx, x0) + dir_x * (fora + nh * p), topo - (r - r * math.cos(th)) - queda + ny * p + ruga,
                                       min(fz, z1) + dir_z * (fora + nh * p))))
        grade.append(linha)
    for i in range(nx):
        for j in range(nz):
            bm.faces.new([grade[i][j], grade[i][j + 1], grade[i + 1][j + 1], grade[i + 1][j]])
    bm.normal_update()
    # A frente do pano aponta para cima (+y do site)
    if sum(f.normal.y for f in bm.faces) < 0:
        for f in bm.faces:
            f.normal_flip()
    obj = _objeto("edredom", bm, material, (0, 0, 0), None, marca)
    # Espessura de pano, para a borda que cai não ficar uma folha de papel
    mod = obj.modifiers.new("espessura", "SOLIDIFY")
    mod.thickness = 0.02
    mod.offset = -1
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=mod.name)
    return obj


def bone(material, marca, posicao, giro):
    """Boné preto deitado na cama: copa (meia esfera achatada), aba curva e o botão no alto."""
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=28, v_segments=14, radius=0.19)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.pi / 2, 3, "X"))
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y < -0.001], context="VERTS")
    bmesh.ops.scale(bm, vec=(1.0, 0.72, 1.08), verts=bm.verts)
    copa = _objeto("copa", bm, material, (0, 0, 0), None, marca)
    # Aba: um disco fino; a metade de trás fica escondida embaixo da copa e a da frente vira a aba redonda
    aba = cilindro("aba", (0, 0.01, 0.17), 0.2, 0.016, material, marca, segmentos=32, chanfro=0.006)
    botao = cilindro("botao", (0, 0.14, 0), 0.018, 0.012, material, marca, segmentos=12)
    return transformar(macio(juntar([copa, aba, botao], "bone"), niveis=1), posicao, (0, giro, 0))


def criar():
    m = {"group": GRUPO, "area": "bed"}
    p = {"group": GRUPO_OBJETOS, "area": "bed"}

    carvalho = pbr("carvalho_cama", "oak_veneer_01", 4.0, tinta="#ddc29c", forca_tinta=0.75)
    base_escura = cor("base_cama", "#26272b", rugosidade=0.7)
    estofado = pbr("estofado", "poly_wool_herringbone", 1.4, tinta="#c8cacd", contraste=0.7, relevo=0.8)
    metal = cor("metal_preto", "#1c1d20", rugosidade=0.4, metal=0.5)
    preto_metal = cor("preto_metal", "#1b1c1f", rugosidade=0.35, metal=0.4)
    cobre = cor("cobre", "#c27a46", rugosidade=0.28, metal=1.0)
    luz_cobre = cor("emit-R-luminaria", "#fff1d6", emissao="#ffb15e", forca=6.0)
    led_fita = cor("emit-B-fita", "#2a1a0a", emissao="#ffb36b", forca=6.0)
    tapete = pbr("tapete", "curly_teddy_natural", 1.6, tinta="#b9b6b1", contraste=0.8)
    moldura = cor("moldura_poster", "#17181b", rugosidade=0.45)

    pecas = []

    # ── Cama baixa (decisão 14): rodapé escuro recuado e estrado de carvalho claro ──
    pecas.append(caixa("cama_base", (1.96, 0.05, -3.5), (5.8, 0.1, 2.75), base_escura, m, chanfro=0.01))
    pecas.append(caixa("cama_estrado", (1.96, 0.3, -3.5), (6.02, 0.4, 2.95), carvalho, m, chanfro=0.03))

    # ── Encosto estofado ao longo da parede grafite e braço estofado na ponta (cara de sofá-cama) ──
    # O topo do encosto fica abaixo dos pôsteres de baixo (que começam em y ≈ 1,98)
    pecas.append(macio(caixa("encosto", (1.9, 1.22, -4.8), (5.9, 1.36, 0.34), estofado, m, chanfro=0.12, segmentos=2)))
    pecas.append(macio(caixa("braco_cama", (4.84, 1.05, -3.42), (0.34, 1.02, 2.62), estofado, m, chanfro=0.12, segmentos=2)))
    # Fita de LED atrás do encosto, virada para cima: à noite a parede grafite ganha um halo quente
    pecas.append(caixa("fita_cama", (1.9, 1.91, -4.975), (5.6, 0.012, 0.02), led_fita, m, chanfro=0.0))

    # ── Criado-mudo flutuante de carvalho (o tampo continua em 1,3: os objetos do código ficam em cima) ──
    pecas.append(caixa("criado_corpo", (4.68, 0.86, -1.4), (1.06, 0.88, 1.06), carvalho, m, chanfro=0.02))
    pecas.append(caixa("criado_gaveta", (4.145, 0.98, -1.4), (0.012, 0.3, 0.96), carvalho, m, chanfro=0.004))
    pecas.append(caixa("criado_puxador", (4.135, 0.98, -1.4), (0.012, 0.02, 0.4), metal, m, chanfro=0.003))
    for x in (4.25, 5.11):
        for z in (-1.83, -0.97):
            pecas.append(caixa("pe_criado", (x, 0.21, z), (0.04, 0.42, 0.04), metal, m, chanfro=0.006))
    pecas.append(luminaria(preto_metal, cobre, luz_cobre, m))

    # ── Pôsteres dos filmes: moldura preta e a arte (própria, minimalista) em alta resolução ──
    for nome, x, y in (("pulp", 3.0, 4.15), ("fight", 4.25, 4.15), ("beauty", 3.0, 2.7), ("basterds", 4.25, 2.7)):
        pecas.append(caixa("moldura", (x, y, -4.97), (1.08, 1.44, 0.04), moldura, m, chanfro=0.012))
        arte = textura(f"poster_{nome}", f"poster_{nome}.png", rugosidade=0.55)
        pecas.append(placa(f"poster_{nome}", (x, y, -4.948), 1.0, 1.36, 0.004, arte, m, normal="+z", chanfro=0.001))

    # ── Tapete felpudo: uma peça só, macia nas bordas (antes eram camadas finas empilhadas) ──
    # Mais quente que o piso, para se destacar dele, e com o pelo em relevo (ruído na geometria)
    pecas.append(felpudo(caixa("tapete", (1.6, 0.045, -0.025), (4.6, 0.09, 3.85), tapete, p, chanfro=0.045, segmentos=4), forca=0.022))

    # ── Roupa de cama (no lugar da do código): colchão, edredom matelassê branco, travesseiro
    # encostado no braço e o boné. O celular (clicável) continua do código ──
    algodao = pbr("algodao", "cotton_jersey", 0.9, tinta="#f1efeb", contraste=0.5, relevo=0.5)
    fronha = pbr("fronha", "cotton_jersey", 0.9, tinta="#d8d6d2", contraste=0.5, relevo=0.5)
    pecas.append(macio(caixa("colchao", (1.92, 0.73, -3.5), (5.86, 0.48, 2.85), algodao, p, chanfro=0.08, segmentos=2), niveis=1))
    pecas.append(edredom(algodao, p))
    pecas.append(macio(caixa("travesseiro", (4.42, 1.38, -3.4), (0.3, 0.74, 1.75), fronha, p, chanfro=0.14, segmentos=2, rotacao=(0, 0, -0.45))))
    # O boné em cima da cama saiu em 23/10 (o Daniel achou feio)

    # ── Bola de futevôlei Mikasa FT-5 (a do Daniel, 23/10), em tamanho real, no tapete ──
    pecas += bola_mikasa(p)

    moveis = [o for o in pecas if o["bk_group"] == GRUPO]
    objetos = [o for o in pecas if o["bk_group"] == GRUPO_OBJETOS]
    return [juntar(moveis, f"{GRUPO}_fixo"), juntar(objetos, f"{GRUPO_OBJETOS}_fixo")]


def bola_mikasa(p):
    """Mikasa FT-5 amarela e preta (bola_ft5: 32 triângulos em xadrez) com os escritos dela curvados na
    superfície. 68–70 cm de circunferência (tamanho 5): raio de 11 cm. O triângulo preto do logo
    ("Goalmaster", em dourado) olha para a câmera da visão geral; em cima dele, o amarelo com MIKASA,
    FT-5 e "Footvolley ball"; embaixo à direita, o amarelo com SOFT BILT, NYLON WOUND, WATER PROOF e
    SIZE 5. Material liso e brilhante, como o couro sintético dela."""
    raio = 0.11 * ESCALA_MODELOS
    centro = (2.6, 0.09 + raio - 0.015, -0.6)  # apoiada no tapete, afundando um pouco no pelo
    frente = Vector((14.68, 13.64, 14.68)) - Vector(centro)  # câmera "geral" do bake.json
    amarelo = cor("bola_amarela", "#dccc00", rugosidade=0.3)
    preto = cor("bola_preta", "#16161a", rugosidade=0.32)
    tinta = cor("bola_tinta", "#101012", rugosidade=0.5)
    ouro = cor("bola_ouro", "#c9a24a", rugosidade=0.3, metal=0.85)
    bola, giro, centros = bola_ft5("bola", centro, raio, preto, amarelo, p, frente)
    # dos dois amarelos de baixo do logo, o da direita (visto da câmera)
    direita = Vector((0, 1, 0)).cross(frente.normalized())
    lado = max(centros["lados"], key=lambda d: (giro @ d).dot(direita))
    escritos = [
        # texto, fonte, altura da letra, triângulo, deslocamento (x, y) dentro dele, material
        ("MIKASA", FONTE_MIKASA, 0.034, centros["marca"], (0.0, 0.022), tinta),
        ("JAPAN", FONTE_TEXTO, 0.009, centros["marca"], (0.045, 0.0), tinta),
        ("FT-5", FONTE_TEXTO, 0.026, centros["marca"], (0.0, -0.024), tinta),
        ("Footvolley ball", FONTE_TEXTO, 0.015, centros["marca"], (0.0, -0.054), tinta),
        ("Goalmaster", FONTE_ASSINATURA, 0.022, centros["logo"], (0.008, 0.012), ouro),
        ("SOFT BILT", FONTE_SERIFA, 0.014, lado, (0.0, 0.028), tinta),
        ("NYLON WOUND", FONTE_SERIFA, 0.014, lado, (0.0, 0.009), tinta),
        ("WATER PROOF", FONTE_SERIFA, 0.014, lado, (0.0, -0.01), tinta),
        ("SIZE 5", FONTE_SERIFA, 0.014, lado, (0.0, -0.029), tinta),
    ]
    pecas = [bola]
    for conteudo, fonte, altura, direcao, (x, y), material in escritos:
        letreiro = texto("bola_escrito", conteudo, fonte, altura, 0.0012, material, p)
        pecas.append(na_bola(letreiro, centro, raio, giro, direcao, x, y))
    return pecas
