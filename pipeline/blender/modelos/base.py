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

from comum import CACHE

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


def curva(p0, controle, p1, passos=16):
    """Pontos de uma curva quadrática (como o quadraticCurveTo do canvas/three)."""
    out = []
    for i in range(1, passos + 1):
        t = i / passos
        out.append(tuple((1 - t) ** 2 * a + 2 * (1 - t) * t * c + t * t * b for a, c, b in zip(p0, controle, p1)))
    return out


def transformar(obj, posicao=(0, 0, 0), rotacao=(0, 0, 0)):
    """Gira (no site, em torno da origem) e move um objeto já pronto. Serve para montar uma peça
    composta (ex.: a luminária) nas coordenadas dela e depois colocá-la no lugar."""
    s = SITE_PARA_BLENDER
    m_site = Matrix.Translation(Vector(posicao)) @ Euler(rotacao, "XYZ").to_matrix().to_4x4()
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
