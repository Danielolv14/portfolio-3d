"""Etapas 00–10: importar o GLB exportado do site, ler as marcações do <Bake> e preparar as malhas."""
import math

import bmesh
import bpy

from comum import do_site, log, selecionar

CHAVES = ("group", "kind", "id", "area")


def limpar_cena():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def importar(caminho):
    bpy.ops.import_scene.gltf(filepath=caminho)
    log(f"importado: {len(bpy.data.objects)} objetos")


def _marcacao(obj, chave):
    """Sobe pelos pais até o <Bake> mais perto que define a chave (igual ao scripts/inventario.mjs)."""
    o = obj
    while o is not None:
        bake = o.get("bake")
        if bake is not None and bake.get(chave):
            return str(bake.get(chave))
        o = o.parent
    return None


def _material_transparente(obj):
    for slot in obj.material_slots:
        m = slot.material
        if m and m.use_nodes:
            bsdf = m.node_tree.nodes.get("Principled BSDF")
            if bsdf and bsdf.inputs["Alpha"].default_value < 0.99 and not bsdf.inputs["Alpha"].is_linked:
                return True
    return False


def preparar(areas=None):
    """Lê as marcações, apaga o que não entra no bake e achata a hierarquia.
    `areas`: se dado, mantém só essas áreas (a prova de conceito usa shell e bed)."""
    malhas = [o for o in bpy.data.objects if o.type == "MESH"]
    for o in malhas:
        for c in CHAVES:
            o[f"bk_{c}"] = _marcacao(o, c) or ""

    apagar = []
    for o in malhas:
        kind = o["bk_kind"]
        # Telas (screen-*): o site desenha ao vivo, com o conteúdo de cada seção; não entram no bake
        if o.name.startswith("screen-") or kind in ("skip", "live", "glass") or _material_transparente(o):
            apagar.append(o)
        elif areas and o["bk_area"] not in areas:
            apagar.append(o)
        elif not o["bk_group"]:
            log(f"AVISO: sem grupo, ignorado: {o.name}")
            apagar.append(o)
    ficam = [o for o in malhas if o not in apagar]

    # Objetos pequenos: um atlas por área (props-desk, props-bed...). Com um atlas só para
    # todos, os detalhes ficavam borrados de perto (docs/plano/resultados-poc.md)
    # O mesmo para os móveis (mesa, nicho, cama): o lightmap de um grupo só deixava a luz manchada
    for o in ficam:
        if o["bk_group"] in ("props", "furniture") and o["bk_area"]:
            o["bk_group"] = f'{o["bk_group"]}-{o["bk_area"]}'

    # Solta dos pais mantendo a posição, depois apaga o que não é malha
    for o in ficam:
        m = o.matrix_world.copy()
        o.parent = None
        o.matrix_world = m
    for o in list(bpy.data.objects):
        if o.type != "MESH" or o in apagar:
            bpy.data.objects.remove(o, do_unlink=True)

    # Cada objeto com a sua própria malha (o exportador do three reaproveita geometrias iguais)
    selecionar(ficam)
    bpy.ops.object.make_single_user(object=True, obdata=True, material=False)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    soldar(ficam)
    log(f"preparado: {len(ficam)} malhas ({len(apagar)} fora do bake)")
    return ficam


def soldar(objs):
    """Junta os vértices repetidos. O three.js (BoxGeometry e companhia) manda cada face com os seus
    próprios vértices; sem soldar, nada está "grudado" para o Blender, e o desdobramento de UV fazia
    quase uma ilha por face (ex.: 2.142 faces -> 1.823 ilhas na estrutura). Isso causava a luz
    manchada, os degraus e o quadriculado nas emendas (estudo de 21/10, docs/plano/estudo-bake.md).
    Depois de soldar, as quinas continuam vivas: arestas com mais de 30° viram "sharp"."""
    for o in objs:
        bm = bmesh.new()
        bm.from_mesh(o.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
        bm.to_mesh(o.data)
        bm.free()
        if o.data.has_custom_normals:
            o.data.free_normals_split() if hasattr(o.data, "free_normals_split") else None
            selecionar([o])
            bpy.ops.mesh.customdata_custom_splitnormals_clear()
        o.data.set_sharp_from_angle(angle=math.radians(30))
    log(f"soldado: {len(objs)} malhas")


def juntar_por_grupo(objs):
    """Junta as malhas de cada grupo numa só (1 draw call por grupo no site).
    Partes que se mexem (dyn) e clicáveis (hotspot) ficam separadas."""
    unidades = {}
    for o in objs:
        kind = o["bk_kind"]
        separada = kind in ("dyn", "hotspot", "screen")
        chave = (o["bk_group"], f'{kind}-{o["bk_id"]}' if separada else "fixo")
        unidades.setdefault(chave, []).append(o)

    juntos = []
    for (grupo, unidade), lista in sorted(unidades.items()):
        selecionar(lista)
        if len(lista) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        obj.name = f"{grupo}__{unidade}"
        obj["bk_group"] = grupo
        obj["bk_unit"] = unidade
        juntos.append(obj)
    log("juntado: " + ", ".join(f"{o.name} ({len(o.data.polygons)} faces)" for o in juntos))
    return juntos


def remover_faces_externas(objs):
    """Apaga as faces da estrutura que a câmera nunca vê: o lado de fora das paredes A (x = -5) e
    B (z = -5) e o fundo da laje. Elas pegam sol e céu direto, inflavam a escala da luz do grupo
    (menos precisão para o resto) e ocupavam área no atlas. Coordenadas do Blender: o z do site
    vira -y, e o y do site vira z."""
    for obj in objs:
        if obj["bk_group"] != "shell":
            continue
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.normal_update()
        fora = []
        for f in bm.faces:
            c, n = f.calc_center_median(), f.normal
            parede_a = n.x < -0.9 and c.x < -5.02
            parede_b = n.y > 0.9 and c.y > 5.02
            fundo = n.z < -0.9 and c.z < -0.38
            if parede_a or parede_b or fundo:
                fora.append(f)
        bmesh.ops.delete(bm, geom=fora, context="FACES")
        bm.to_mesh(obj.data)
        bm.free()
        log(f"faces externas removidas de {obj.name}: {len(fora)}")


def materiais_por_grupo(objs):
    """Cada grupo assa na sua imagem. Material repetido entre grupos vira cópia, senão o
    nó de imagem ativo de um grupo apontaria para a imagem do outro.
    Também zera os brilhos (emissão) que o código usa como truque de luz, como a cabeceira que
    "brilha" de dia: no bake a luz rebatida é de verdade. As fontes de luz vêm do rig."""
    for o in objs:
        for slot in o.material_slots:
            if slot.material:
                slot.material = slot.material.copy()
                bsdf = slot.material.node_tree.nodes.get("Principled BSDF") if slot.material.use_nodes else None
                if bsdf:
                    bsdf.inputs["Emission Strength"].default_value = 0.0
                # Cor por vértice (celular e cadeira): o nó precisa apontar o atributo pelo nome.
                # Sem isso o Cycles às vezes derrubava o Blender ao preparar a malha (ccl::create_mesh)
                if slot.material.use_nodes and o.data.color_attributes:
                    nome_cor = o.data.color_attributes[0].name
                    o.data.color_attributes.active_color = o.data.color_attributes[0]
                    o.data.color_attributes.render_color_index = 0
                    for no in slot.material.node_tree.nodes:
                        if no.bl_idname == "ShaderNodeVertexColor":
                            no.layer_name = nome_cor


def paredes_fantasma(config):
    """As duas paredes da frente e o teto: existem só no bake, para a luz entrar pela janela e
    rebater como num quarto fechado. Não são exportadas (docs/plano/03-iluminacao.md, seção 2)."""
    cfg = config["paredesFantasma"]
    mat = bpy.data.materials.new("fantasma")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*cfg["cor"], 1)
    e = cfg["espessura"]
    # (centro, tamanho) no sistema do site; o piso vai de -5,3 a 5,3 e as paredes têm 5,6 de altura
    # As da frente descem até abaixo da laje (y = -0,4): sem isso, a lateral da laje recebia o céu
    # de fora, estourava no Bloom e subia a escala da luz do grupo shell (menos precisão nas paredes)
    f = 5.3 + 0.02 + e / 2
    caixas = [
        ((f, 2.7, 0), (e, 6.6, 11.0)),  # parede da frente, lado +x
        ((0, 2.7, f), (11.0, 6.6, e)),  # parede da frente, lado +z
        ((0, 5.6 + e / 2, 0), (11.0, e, 11.0)),  # teto
    ]
    fantasmas = []
    for i, (centro, tam) in enumerate(caixas):
        bpy.ops.mesh.primitive_cube_add(location=do_site(centro))
        o = bpy.context.active_object
        o.name = f"fantasma_{i}"
        # tamanho no Blender: x, z do site vira y, y do site vira z
        o.scale = (tam[0] / 2, tam[2] / 2, tam[1] / 2)
        o.data.materials.append(mat)
        # Bloqueia e rebate a luz, mas a câmera das imagens de referência enxerga através
        o.visible_camera = False
        fantasmas.append(o)
    return fantasmas
