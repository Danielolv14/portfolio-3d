"""Etapas 00–10: importar o GLB exportado do site, ler as marcações do <Bake> e preparar as malhas."""
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
        if kind in ("skip", "live", "glass") or _material_transparente(o):
            apagar.append(o)
        elif areas and o["bk_area"] not in areas:
            apagar.append(o)
        elif not o["bk_group"]:
            log(f"AVISO: sem grupo, ignorado: {o.name}")
            apagar.append(o)
    ficam = [o for o in malhas if o not in apagar]

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
    log(f"preparado: {len(ficam)} malhas ({len(apagar)} fora do bake)")
    return ficam


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


def materiais_por_grupo(objs):
    """Cada grupo assa na sua imagem. Material repetido entre grupos vira cópia, senão o
    nó de imagem ativo de um grupo apontaria para a imagem do outro."""
    for o in objs:
        for slot in o.material_slots:
            if slot.material:
                slot.material = slot.material.copy()


def paredes_fantasma(config):
    """As duas paredes da frente e o teto: existem só no bake, para a luz entrar pela janela e
    rebater como num quarto fechado. Não são exportadas (docs/plano/03-iluminacao.md, seção 2)."""
    cfg = config["paredesFantasma"]
    mat = bpy.data.materials.new("fantasma")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*cfg["cor"], 1)
    e = cfg["espessura"]
    # (centro, tamanho) no sistema do site; o piso vai de -5,3 a 5,3 e as paredes têm 5,6 de altura
    caixas = [
        ((5.3 + e / 2, 2.9, 0), (e, 6.0, 11.0)),  # parede da frente, lado +x
        ((0, 2.9, 5.3 + e / 2), (11.0, 6.0, e)),  # parede da frente, lado +z
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
