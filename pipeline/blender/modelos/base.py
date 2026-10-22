"""Peças básicas para modelar o quarto no Blender por script (estilo maquete).

Tudo é construído nas coordenadas do SITE (three.js: y para cima, as mesmas medidas de src/room) e
convertido para o Blender no final. Assim as posições batem com o quarto em código, que continua
cuidando da interação (cliques, telas, etiquetas).

Regras do estilo (docs/plano/estudo-bake.md):
  - toda quina é chanfrada (3 segmentos, para o chanfro ficar liso e pegar luz);
  - cores lisas, bem escolhidas; textura só onde conta (camuflagem do gabinete, telas, pôsteres);
  - malhas inteiriças, sem peças atravessando, para o bake ter poucas ilhas grandes.
"""
import math
import os

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

from comum import CACHE, RAIZ

# Site (x, y, z) -> Blender (x, -z, y). É uma rotação (determinante 1): as normais continuam certas
SITE_PARA_BLENDER = Matrix(((1, 0, 0, 0), (0, 0, -1, 0), (0, 1, 0, 0), (0, 0, 0, 1)))

# Abaixo deste ângulo, a aresta é lisa; acima, viva. O chanfro de 3 segmentos tem degraus de 30°
ANGULO_LISO = math.radians(35)


def _linear(hex_cor):
    """'#rrggbb' (sRGB, como no CSS) -> RGB linear (o que o Blender usa)."""
    h = hex_cor.lstrip("#")
    srgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]


def cor(nome, hex_cor, rugosidade=0.6, metal=0.0, emissao=None, forca=0.0):
    """Material de cor lisa. `emissao` + `forca`: brilha (LED, lâmpada). O nome importa para as
    fontes ajustáveis no site: emit-R (cabeceira), emit-G (luminária da TV), emit-B (RGB)."""
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*_linear(hex_cor), 1)
    b.inputs["Roughness"].default_value = rugosidade
    b.inputs["Metallic"].default_value = metal
    if emissao:
        b.inputs["Emission Color"].default_value = (*_linear(emissao), 1)
        b.inputs["Emission Strength"].default_value = forca
    return m


def vidro(nome, hex_cor="#9aa3ab", rugosidade=0.04, opacidade=0.14):
    """Vidro fino: quase transparente (alfa) e com reflexo. Vidro com refração no Cycles faz sombra
    inteira e deixa escuro o que está atrás dele (o interior do gabinete sumia); com alfa, a luz passa.
    No site, os materiais "vidro*" viram um material transparente sem luz assada (BakedRoom)."""
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*_linear(hex_cor), 1)
    b.inputs["Roughness"].default_value = rugosidade
    b.inputs["Alpha"].default_value = opacidade
    return m


def textura(nome, arquivo, rugosidade=0.6, metal=0.0):
    """Material com imagem (de pipeline/.cache/texturas, exportada do site)."""
    m = bpy.data.materials.get(nome) or bpy.data.materials.new(nome)
    m.use_nodes = True
    nos = m.node_tree.nodes
    b = nos["Principled BSDF"]
    img = nos.new("ShaderNodeTexImage")
    img.image = bpy.data.images.load(os.path.join(CACHE, "texturas", arquivo), check_existing=True)
    m.node_tree.links.new(img.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rugosidade
    b.inputs["Metallic"].default_value = metal
    return m


PH = os.path.join(CACHE, "polyhaven")


def _tingir(caminho, hex_cor, forca, contraste):
    """Leva uma textura de foto para a cor da paleta sem perder o desenho (veio, trama, poros):
    tira a cor, normaliza o brilho médio e multiplica pela cor alvo. `contraste` < 1 suaviza o desenho.
    O resultado fica em cache (pipeline/.cache/texturas) e só é refeito se o nome mudar."""
    import numpy as np

    nome = f"tinta_{os.path.basename(os.path.dirname(caminho))}_{hex_cor.lstrip('#')}_{forca:.2f}_{contraste:.2f}"
    saida = os.path.join(CACHE, "texturas", nome + ".png")
    if os.path.exists(saida):
        return bpy.data.images.load(saida, check_existing=True)
    src = bpy.data.images.load(caminho, check_existing=True)
    w, h = src.size
    px = np.empty(w * h * 4, dtype=np.float32)
    src.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    lum = px[:, :3] @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    rel = 1 + (lum / max(float(lum.mean()), 1e-4) - 1) * contraste
    alvo = np.array([int(hex_cor[i : i + 2], 16) / 255 for i in (1, 3, 5)], dtype=np.float32)
    px[:, :3] = px[:, :3] * (1 - forca) + np.clip(rel[:, None] * alvo[None, :], 0, 1) * forca
    out = bpy.data.images.new(nome, w, h, alpha=False)
    out.pixels.foreach_set(px.ravel())
    out.filepath_raw = saida
    out.file_format = "PNG"
    out.save()
    return out


def pbr(nome, pasta, escala, tinta=None, forca_tinta=1.0, contraste=1.0, rugosidade=None, relevo=1.0, metal=0.0, veio="u"):
    """Material realista com texturas de foto do Poly Haven (CC0): cor, rugosidade e relevo (normal).
    `escala`: tamanho, em unidades do site, de uma repetição da textura. `tinta`: cor da paleta (hex)
    para a qual a foto é levada. `rugosidade`: fixa (ignora o mapa). `veio`: "u" ou "v", o eixo da
    textura que corre ao longo do comprimento da peça (o veio da madeira acompanha a tábua)."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos, links = m.node_tree.nodes, m.node_tree.links
    b = nos["Principled BSDF"]
    base = os.path.join(PH, pasta)

    def imagem(arquivo, cor=False):
        n = nos.new("ShaderNodeTexImage")
        n.image = arquivo if isinstance(arquivo, bpy.types.Image) else bpy.data.images.load(arquivo, check_existing=True)
        if not cor:
            n.image.colorspace_settings.name = "Non-Color"
        return n

    dif = os.path.join(base, "diff.jpg")
    links.new(imagem(_tingir(dif, tinta, forca_tinta, contraste) if tinta else dif, cor=True).outputs["Color"], b.inputs["Base Color"])
    rough = os.path.join(base, "rough.jpg")
    if rugosidade is None and os.path.exists(rough):
        links.new(imagem(rough).outputs["Color"], b.inputs["Roughness"])
    else:
        b.inputs["Roughness"].default_value = 0.6 if rugosidade is None else rugosidade
    nor = os.path.join(base, "nor.jpg")
    if relevo > 0 and os.path.exists(nor):
        mapa = nos.new("ShaderNodeNormalMap")
        mapa.inputs["Strength"].default_value = relevo
        links.new(imagem(nor).outputs["Color"], mapa.inputs["Color"])
        links.new(mapa.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Metallic"].default_value = metal
    m["escala_textura"] = escala
    m["veio"] = veio
    return m


def _uv_caixa(bm, escala, veio, desloc):
    """UV por projeção de caixa (cada face pega os dois eixos do seu plano), em unidades do site.
    O comprimento da peça vai no eixo `veio` da textura. `desloc` (a posição da peça) evita que peças
    vizinhas repitam o mesmo pedaço da foto."""
    camada = bm.loops.layers.uv.new("UVMap")
    bm.normal_update()
    tam = [max(v.co[i] for v in bm.verts) - min(v.co[i] for v in bm.verts) for i in range(3)]
    for f in bm.faces:
        n = f.normal
        eixo = max(range(3), key=lambda i: abs(n[i]))
        a, b = [i for i in range(3) if i != eixo]
        if tam[b] > tam[a]:
            a, b = b, a
        if veio == "v":
            a, b = b, a
        for loop in f.loops:
            p = loop.vert.co + desloc
            loop[camada].uv = (p[a] / escala, p[b] / escala)


def _chanfrar(bm, chanfro, segmentos):
    if chanfro <= 0:
        return
    arestas = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle(0) > math.radians(30)]
    bmesh.ops.bevel(bm, geom=arestas, offset=chanfro, segments=segmentos, profile=0.5, affect="EDGES", clamp_overlap=True)


def _uv_plano(bm, eixo_u, eixo_v, centro, tamanho_u, tamanho_v):
    """UV de textura por projeção plana (coordenadas do site, antes de converter)."""
    camada = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        for l in f.loops:
            p = l.vert.co
            l[camada].uv = ((p[eixo_u] - centro[eixo_u]) / tamanho_u + 0.5, (p[eixo_v] - centro[eixo_v]) / tamanho_v + 0.5)


def _objeto(nome, bm, material, posicao, rotacao, marca):
    """Gira e posiciona (no site), converte para o Blender e cria o objeto com as marcações do bake."""
    # Material de foto (pbr): UV de caixa nas medidas da própria peça, antes de girar
    if material and material.get("escala_textura") and not bm.loops.layers.uv.get("UVMap"):
        _uv_caixa(bm, material["escala_textura"], material.get("veio", "u"), Vector(posicao))
    if rotacao:
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Euler(rotacao, "XYZ").to_matrix())
    bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(posicao))
    bmesh.ops.transform(bm, verts=bm.verts, matrix=SITE_PARA_BLENDER)
    if not bm.loops.layers.uv.get("UVMap"):
        bm.loops.layers.uv.new("UVMap")
    for f in bm.faces:
        f.smooth = True
    malha = bpy.data.meshes.new(nome)
    bm.to_mesh(malha)
    bm.free()
    malha.set_sharp_from_angle(angle=ANGULO_LISO)
    obj = bpy.data.objects.new(nome, malha)
    bpy.context.scene.collection.objects.link(obj)
    malha.materials.append(material)
    for chave in ("group", "kind", "id", "area"):
        obj[f"bk_{chave}"] = marca.get(chave, "")
    return obj


def caixa(nome, posicao, tamanho, material, marca, chanfro=0.012, segmentos=3, rotacao=None, uv=None):
    """Caixa chanfrada. `tamanho` e `posicao` no site, como o <Box size position> do código.
    `uv`: (eixo_u, eixo_v) para projetar a textura numa face (0 = x, 1 = y, 2 = z do site)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(tamanho), verts=bm.verts)
    _chanfrar(bm, min(chanfro, min(tamanho) * 0.45), segmentos)
    if uv:
        _uv_plano(bm, uv[0], uv[1], Vector((0, 0, 0)), tamanho[uv[0]], tamanho[uv[1]])
    return _objeto(nome, bm, material, posicao, rotacao, marca)


def cilindro(nome, posicao, raio, altura, material, marca, segmentos=24, chanfro=0.006, rotacao=None, raio_topo=None):
    """Cilindro em pé (eixo y do site), como o <Cyl args={[r, r, h, seg]}> do código."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segmentos, radius1=raio, radius2=raio_topo or raio, depth=altura)
    # create_cone cria em pé no eixo z; no site, em pé é o eixo y
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.pi / 2, 3, "X"))
    _chanfrar(bm, min(chanfro, raio * 0.4, altura * 0.4), 2)
    return _objeto(nome, bm, material, posicao, rotacao, marca)


def anel(nome, posicao, raio_ext, raio_int, altura, material, marca, segmentos=48, rotacao=None):
    """Anel (arruela) em pé no eixo y do site: o anel de LED de um fan, uma junta, um aro."""
    bm = bmesh.new()
    vs = []
    for y in (-altura / 2, altura / 2):
        fora = [bm.verts.new((raio_ext * math.cos(2 * math.pi * i / segmentos), y, raio_ext * math.sin(2 * math.pi * i / segmentos))) for i in range(segmentos)]
        dentro = [bm.verts.new((raio_int * math.cos(2 * math.pi * i / segmentos), y, raio_int * math.sin(2 * math.pi * i / segmentos))) for i in range(segmentos)]
        vs.append((fora, dentro))
    (f0, d0), (f1, d1) = vs
    for i in range(segmentos):
        j = (i + 1) % segmentos
        for quad in ((f1[i], f1[j], d1[j], d1[i]), (d0[i], d0[j], f0[j], f0[i]), (f0[i], f0[j], f1[j], f1[i]), (d1[i], d1[j], d0[j], d0[i])):
            bm.faces.new(quad)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _objeto(nome, bm, material, posicao, rotacao, marca)


def juntar(objs, nome):
    """Junta várias peças num objeto só (mesmas marcações do primeiro)."""
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = nome
    return obj


def compor(arquivo, fundo_hex, nome_saida):
    """Imagem com transparência (adesivo, emblema) colada sobre uma cor de fundo, gerando outra
    imagem opaca. O material do site não usa transparência: o fundo transparente sairia preto."""
    import numpy as np

    src = bpy.data.images.load(os.path.join(CACHE, "texturas", arquivo), check_existing=True)
    w, h = src.size
    px = np.empty(w * h * 4, dtype=np.float32)
    src.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    # Imagens de 8 bits: o Blender entrega os valores como estão no arquivo (sRGB); o fundo também
    h_ = fundo_hex.lstrip("#")
    fundo = np.array([int(h_[i : i + 2], 16) / 255 for i in (0, 2, 4)], dtype=np.float32)
    px[:, :3] = px[:, :3] * px[:, 3:4] + fundo * (1 - px[:, 3:4])
    px[:, 3] = 1
    out = bpy.data.images.new(nome_saida, w, h, alpha=False)
    out.pixels.foreach_set(px.ravel())
    out.filepath_raw = os.path.join(CACHE, "texturas", nome_saida + ".png")
    out.file_format = "PNG"
    out.save()
    return nome_saida + ".png"


def placa(nome, posicao, largura, altura, espessura, material, marca, normal="+x", chanfro=0.004, rotacao=None, girar=False):
    """Placa fina com a textura na face da frente (pôster, rótulo, visor). `normal`: para onde a
    frente aponta no site (+x, -x, +z, -z, +y). A textura ocupa a face inteira, sem distorcer."""
    # Espelha quando o eixo da textura (u) aponta para a esquerda de quem olha a face de frente:
    # olhando para -x (face +x), a direita é -z; olhando para -z (face +z), a direita é +x
    eixos = {"+x": ((espessura, altura, largura), (2, 1), True), "-x": ((espessura, altura, largura), (2, 1), False),
             "+z": ((largura, altura, espessura), (0, 1), False), "-z": ((largura, altura, espessura), (0, 1), True),
             "+y": ((largura, espessura, altura), (0, 2), False)}
    tamanho, uv, espelha = eixos[normal]
    if girar:
        # textura girada 90° na face (ex.: a calculadora, deitada de lado na mesa)
        uv = (uv[1], uv[0])
    obj = caixa(nome, posicao, tamanho, material, marca, chanfro=chanfro, rotacao=rotacao, uv=uv)
    if espelha:
        for l in obj.data.uv_layers["UVMap"].data:
            l.uv.x = 1 - l.uv.x
    return obj


def capsula(nome, posicao, raio, comprimento, material, marca, eixo="z", segmentos=24, rotacao=None):
    """Cilindro com as pontas arredondadas (ex.: webcam). `eixo`: direção do comprimento no site."""
    obj_rot = {"z": (1.5708, 0, 0), "x": (0, 0, 1.5708), "y": (0, 0, 0)}[eixo]
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segmentos, radius1=raio, radius2=raio, depth=comprimento)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(-math.pi / 2, 3, "X"))
    _chanfrar(bm, raio * 0.92, 6)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Euler(obj_rot, "XYZ").to_matrix())
    return _objeto(nome, bm, material, posicao, rotacao, marca)


def perfil(nome, pontos, espessura, material, marca, plano="zy", centro=0.0, chanfro=0.012, segmentos=3):
    """Peça extrudada de um contorno 2D (ex.: cabeceira com o topo curvo).
    `pontos`: [(a, b), ...] no plano dado (no site): "zy" = a no eixo z, b no y, extrudado em x a partir
    de `centro` (x do meio da espessura); "xy" = a em x, b em y, extrudado em z."""
    bm = bmesh.new()
    if plano == "zy":
        verts = [bm.verts.new((centro - espessura / 2, b, a)) for a, b in pontos]
        direcao = Vector((espessura, 0, 0))
    else:
        verts = [bm.verts.new((a, b, centro - espessura / 2)) for a, b in pontos]
        direcao = Vector((0, 0, espessura))
    face = bm.faces.new(verts)
    bmesh.ops.recalc_face_normals(bm, faces=[face])
    novo = bmesh.ops.extrude_face_region(bm, geom=[face])
    bmesh.ops.translate(bm, verts=[v for v in novo["geom"] if isinstance(v, bmesh.types.BMVert)], vec=direcao)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Triangula a frente e o fundo (contorno côncavo) só depois de chanfrar as bordas
    _chanfrar(bm, chanfro, segmentos)
    return _objeto(nome, bm, material, (0, 0, 0), None, marca)


def parede(nome, faixa_a, faixa_b, furos, espessura, material, marca, plano="xy", centro=0.0, corte=None, chanfro=0.01):
    """Parede retangular com vãos retangulares (janela, porta), numa malha só e sem faces internas.
    `plano` "xy": a = x e b = y do site, espessura em z em volta de `centro`; "zy": a = z, b = y,
    espessura em x. `faixa_a`/`faixa_b`: (início, fim). `furos`: [(a0, a1, b0, b1), ...].
    `corte`: (material, teste(centro, normal) no Blender) pinta as faces "cortadas" da maquete
    (topo e ponta solta) com outra cor."""
    a_s = sorted({*faixa_a, *[f[0] for f in furos], *[f[1] for f in furos]})
    b_s = sorted({*faixa_b, *[f[2] for f in furos], *[f[3] for f in furos]})
    bm = bmesh.new()
    verts = {}

    def v(a, b):
        if (a, b) not in verts:
            p = (a, b, centro - espessura / 2) if plano == "xy" else (centro - espessura / 2, b, a)
            verts[(a, b)] = bm.verts.new(p)
        return verts[(a, b)]

    # Grade com os cantos dos vãos; as células dentro de um vão ficam vazias
    faces = []
    for i in range(len(a_s) - 1):
        for j in range(len(b_s) - 1):
            ca, cb = (a_s[i] + a_s[i + 1]) / 2, (b_s[j] + b_s[j + 1]) / 2
            if any(f[0] < ca < f[1] and f[2] < cb < f[3] for f in furos):
                continue
            faces.append(bm.faces.new([v(a_s[i], b_s[j]), v(a_s[i + 1], b_s[j]), v(a_s[i + 1], b_s[j + 1]), v(a_s[i], b_s[j + 1])]))
    direcao = Vector((0, 0, espessura)) if plano == "xy" else Vector((espessura, 0, 0))
    novo = bmesh.ops.extrude_face_region(bm, geom=faces)
    bmesh.ops.translate(bm, verts=[x for x in novo["geom"] if isinstance(x, bmesh.types.BMVert)], vec=direcao)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # Junta as células do mesmo plano (menos faces, UV mais limpo)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(1), verts=bm.verts, edges=bm.edges)
    _chanfrar(bm, chanfro, 2)
    obj = _objeto(nome, bm, material, (0, 0, 0), None, marca)
    if corte:
        obj.data.materials.append(corte[0])
        for p in obj.data.polygons:
            if corte[1](p.center, p.normal):
                p.material_index = 1
    return obj


# Unidades do quarto por metro para os modelos prontos. Uniforme (a mesma nos três eixos): com a escala
# do quarto (3,2 na horizontal e 2,15 na vertical) eles ficavam largos e achatados. 2,6 é a média
ESCALA_MODELOS = 2.6


def importar_modelo(id_ph, marca, posicao=(0, 0, 0), rotacao=(0, 0, 0), escala=(ESCALA_MODELOS, ESCALA_MODELOS)):
    """Modelo pronto do Poly Haven (CC0, baixado por pipeline/polyhaven.mjs), com os materiais e as
    texturas dele. Vem em metros e com z para cima; `escala` = (horizontal, vertical) leva para as
    unidades do quarto (ESCALA_MODELOS, igual nos dois sentidos para não deformar).
    `posicao` e `rotacao` no site (o chão do modelo fica em y = posicao[1])."""
    return _importar_glb(os.path.join(PH, id_ph, f"{id_ph}.gltf"), id_ph, marca, posicao, rotacao, escala)


def importar_terceiro(pasta, marca, posicao=(0, 0, 0), rotacao=(0, 0, 0), escala=(ESCALA_MODELOS, ESCALA_MODELOS)):
    """Modelo do Sketchfab (CC BY) já convertido por pipeline/blender/converter.py para
    art/terceiros/<pasta>/modelo.glb, em metros e com a frente para -y do Blender (+z do site)."""
    return _importar_glb(os.path.join(RAIZ, "art", "terceiros", pasta, "modelo.glb"), pasta, marca, posicao, rotacao, escala)


def _soldar_se_solto(obj):
    """Modelos de scan ou feitos por IA (o Dunk, o Funko do Harry Potter) vêm como "sopa de triângulos":
    cada face com os próprios 3 vértices. No atlas do bake cada triângulo vira uma ilha minúscula, sem
    pixels, e o objeto sai preto e pontilhado no site. Soldar os vértices junta as ilhas (o UV é por
    canto de face, então a textura não muda); as normais passam a ser suaves, com quina acima de 40°."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    if len(bm.verts) < 2.5 * max(len(bm.faces), 1):
        bm.free()
        return
    antes = len(bm.verts)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bm.to_mesh(obj.data)
    bm.free()
    with bpy.context.temp_override(object=obj, active_object=obj, selected_objects=[obj]):
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
    obj.data.shade_smooth()
    obj.data.set_sharp_from_angle(angle=math.radians(40))
    print(f"[modelos] {obj.name}: vértices soldados {antes} -> {len(obj.data.vertices)}")


def _importar_glb(caminho, nome, marca, posicao, rotacao, escala):
    if not os.path.exists(caminho):
        raise RuntimeError(f"modelo não encontrado: {caminho}")
    antes = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=caminho)
    novos = [o for o in bpy.data.objects if o not in antes]
    malhas = [o for o in novos if o.type == "MESH"]
    # Aplica a hierarquia (pais, escalas) nas malhas e descarta os vazios
    for o in malhas:
        o.data = o.data.copy()
        o.data.transform(o.matrix_world)
        o.parent = None
        o.matrix_world = Matrix.Identity(4)
    for o in novos:
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    obj = juntar(malhas, nome)
    _soldar_se_solto(obj)
    # Chão do modelo em z = 0 e centro em x, y = 0; depois a escala do quarto e o lugar no site
    zs = [v.co.z for v in obj.data.vertices]
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    obj.data.transform(Matrix.Translation(Vector((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs)))))
    obj.data.transform(Matrix.Diagonal((escala[0], escala[0], escala[1], 1)))
    transformar(obj, posicao, rotacao)
    if not obj.data.uv_layers:
        obj.data.uv_layers.new(name="UVMap")
    obj.data.uv_layers[0].name = "UVMap"
    for chave in ("group", "kind", "id", "area"):
        obj[f"bk_{chave}"] = marca.get(chave, "")
    return obj


def texto(nome, conteudo, fonte, altura, espessura, material, marca, posicao=(0, 0, 0), rotacao=None, inclinacao=0.0):
    """Letreiro em relevo (logo, etiqueta): o texto fica no plano xy do site, centrado, de frente para
    +z, com `altura` de letra e `espessura` em z. `fonte`: arquivo .ttf; `inclinacao`: itálico."""
    curva_txt = bpy.data.curves.new(nome, "FONT")
    curva_txt.body = conteudo
    curva_txt.font = bpy.data.fonts.load(fonte, check_existing=True)
    curva_txt.size = altura
    curva_txt.extrude = espessura / 2
    curva_txt.shear = inclinacao
    curva_txt.align_x = "CENTER"
    curva_txt.align_y = "CENTER"
    tmp = bpy.data.objects.new(nome, curva_txt)
    bpy.context.scene.collection.objects.link(tmp)
    malha = bpy.data.meshes.new_from_object(tmp.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    bpy.data.objects.remove(tmp, do_unlink=True)
    bm = bmesh.new()
    bm.from_mesh(malha)
    bpy.data.meshes.remove(malha)
    return _objeto(nome, bm, material, posicao, rotacao, marca)


def bola_volei(nome, posicao, raio, cores, marca, rotacao=None, sulco=0.04, res=(28, 9)):
    """Bola de vôlei/futevôlei como a de verdade: as 6 faces de um cubo, cada uma com 3 gomos, levadas
    para a esfera. Faces vizinhas têm os gomos cruzados. Perto das costuras o raio cai um pouco (o
    sulco). `cores`: função (eixo da face, índice do gomo) -> material."""
    pecas = []
    for k in range(3):
        ao_longo, atravessado = (k + 1) % 3, (k + 2) % 3
        for s in (-1, 1):
            for g in range(3):
                bm = bmesh.new()
                b0, b1 = -1 + g * 2 / 3, -1 + (g + 1) * 2 / 3
                nu, nv = res
                grade = []
                for i in range(nu + 1):
                    linha = []
                    t = -1 + 2 * i / nu
                    for j in range(nv + 1):
                        w = b0 + (b1 - b0) * j / nv
                        p = [0.0, 0.0, 0.0]
                        p[k], p[ao_longo], p[atravessado] = s, t, w
                        d = Vector(p).normalized()
                        # distância até a costura mais perto (bordas do gomo e da face), no cubo
                        borda = min(abs(t - 1), abs(t + 1), abs(w - b0), abs(w - b1))
                        queda = 1 - min(borda / 0.09, 1) ** 0.5
                        linha.append(bm.verts.new(d * raio * (1 - sulco * queda)))
                    grade.append(linha)
                for i in range(nu):
                    for j in range(nv):
                        f = bm.faces.new([grade[i][j], grade[i + 1][j], grade[i + 1][j + 1], grade[i][j + 1]])
                        f.normal_update()
                        if f.normal.dot(f.calc_center_median()) < 0:
                            f.normal_flip()
                pecas.append(_objeto(f"{nome}_gomo", bm, cores(k, g), (0, 0, 0), None, marca))
    obj = juntar(pecas, nome)
    for poly in obj.data.polygons:
        poly.use_smooth = True
    obj.data.set_sharp_from_angle(angle=math.radians(50))
    return transformar(obj, posicao, rotacao or (0, 0, 0))


def curva(p0, controle, p1, passos=16):
    """Pontos de uma curva quadrática (como o quadraticCurveTo do canvas/three)."""
    out = []
    for i in range(1, passos + 1):
        t = i / passos
        out.append(tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * c + t * t * b for a, c, b in zip(p0, controle, p1)))
    return out


def transformar(obj, posicao=(0, 0, 0), rotacao=(0, 0, 0), escala=1.0):
    """Gira (no site, em torno da origem), escala e move um objeto já pronto. Serve para montar uma
    peça composta (ex.: a luminária) nas coordenadas dela e depois colocá-la no lugar."""
    s = SITE_PARA_BLENDER
    m_site = Matrix.Translation(Vector(posicao)) @ Euler(rotacao, "XYZ").to_matrix().to_4x4() @ Matrix.Scale(escala, 4)
    obj.data.transform(s @ m_site @ s.inverted())
    return obj


def felpudo(obj, forca=0.018, escala=0.06, niveis=4):
    """Superfície felpuda (tapete, almofada): subdivide e desloca com ruído. Fica na geometria,
    então o bake guarda o relevo com sombra de verdade."""
    sub = obj.modifiers.new("sub", "SUBSURF")
    sub.subdivision_type = "SIMPLE"
    sub.levels = sub.render_levels = niveis
    tex = bpy.data.textures.new(f"pelo_{obj.name}", "CLOUDS")
    tex.noise_scale = escala
    tex.noise_depth = 2
    desl = obj.modifiers.new("pelo", "DISPLACE")
    desl.texture = tex
    desl.strength = forca
    desl.mid_level = 0.5
    bpy.context.view_layer.objects.active = obj
    for mod in list(obj.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.set_sharp_from_angle(angle=ANGULO_LISO)
    return obj


def macio(obj, niveis=2):
    """Forma macia (mochila, tênis, almofada): subdivisão suave sobre a caixa chanfrada."""
    sub = obj.modifiers.new("macio", "SUBSURF")
    sub.levels = sub.render_levels = niveis
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=sub.name)
    for f in obj.data.polygons:
        f.use_smooth = True
    obj.data.set_sharp_from_angle(angle=math.radians(60))
    return obj
