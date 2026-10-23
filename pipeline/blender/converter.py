"""Converte os modelos de terceiros (Sketchfab, CC BY) para um GLB limpo, um por pasta.

    blender -b --factory-startup --python pipeline/blender/converter.py -- [--forcar] [--so=xdj,ps5]
    (ou: npm run terceiros)

Lê a lista "terceiros" do bake.json. Para cada pasta em art/terceiros/<pasta>/: abre o arquivo
original (GLB, FBX, OBJ ou BLEND), religa as texturas que ficaram na pasta textures/, junta as malhas,
reduz os polígonos até o limite, leva para o tamanho real em metros e grava art/terceiros/<pasta>/modelo.glb.
O pipeline (modelos/base.importar_terceiro) usa esse GLB.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import bpy  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

from comum import RAIZ, ler_config, log  # noqa: E402

PASTA = os.path.join(RAIZ, "art", "terceiros")


def opcoes():
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    so = next((a.split("=", 1)[1].split(",") for a in args if a.startswith("--so=")), None)
    return "--forcar" in args, so


def importar(fonte):
    ext = os.path.splitext(fonte)[1].lower()
    if ext in (".glb", ".gltf"):
        bpy.ops.import_scene.gltf(filepath=fonte)
    elif ext == ".fbx":
        bpy.ops.import_scene.fbx(filepath=fonte, use_image_search=True)
    elif ext == ".obj":
        bpy.ops.wm.obj_import(filepath=fonte)
    elif ext == ".blend":
        with bpy.data.libraries.load(fonte) as (de, para):
            para.objects = de.objects
        for o in para.objects:
            if o is not None:
                bpy.context.scene.collection.objects.link(o)
    else:
        raise RuntimeError(f"formato não suportado: {fonte}")


def religar_texturas(base):
    """Imagens que o arquivo procura em outro caminho: acha pelo nome em qualquer subpasta."""
    arquivos = {}
    for raiz, _, nomes in os.walk(base):
        for n in nomes:
            arquivos.setdefault(n.lower(), os.path.join(raiz, n))
    for img in bpy.data.images:
        if img.source != "FILE" or img.packed_file:
            continue
        if os.path.exists(bpy.path.abspath(img.filepath)):
            continue
        achado = arquivos.get(os.path.basename(img.filepath.replace("\\", "/")).lower())
        if achado:
            img.filepath = achado
            img.reload()
        else:
            log(f"  textura não achada: {img.filepath}")


def _plano_de_fundo(o):
    """Chão ou fundo de vitrine que vem junto no arquivo: quase sem espessura e com poucas faces."""
    vs = [v.co for v in o.data.vertices]
    dim = [max(v[i] for v in vs) - min(v[i] for v in vs) for i in range(3)]
    return len(o.data.polygons) <= 64 and min(dim) < max(dim) * 0.01


def juntar_malhas():
    malhas = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for o in malhas:
        o.data = o.data.copy()
        o.data.transform(o.matrix_world)
    fundos = [o for o in malhas if _plano_de_fundo(o)]
    for o in fundos:
        log(f"  plano de fundo removido: {o.name}")
        bpy.data.objects.remove(o, do_unlink=True)
    malhas = [o for o in malhas if o not in fundos]
    for o in list(bpy.context.scene.objects):
        if o.type != "MESH":
            bpy.data.objects.remove(o, do_unlink=True)
    for o in malhas:
        o.parent = None
        o.matrix_world = Matrix.Identity(4)
    bpy.ops.object.select_all(action="DESELECT")
    for o in malhas:
        o.select_set(True)
    bpy.context.view_layer.objects.active = malhas[0]
    bpy.ops.object.join()
    return bpy.context.view_layer.objects.active


def _rgb(hexa):
    import numpy as np

    return np.array([int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5)], dtype=np.float32)


def _recolorir(img, trocas):
    """Troca cores da textura assada (ex.: camuflagem verde/laranja/branca -> verde-oliva/marrom/cáqui).
    Cada troca: [cor de origem, cor nova, tolerância 0–255]. O brilho de cada pixel em relação à cor de
    origem é mantido, para não perder a trama do tecido."""
    import numpy as np

    px = np.empty(len(img.pixels), dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    original = px[:, :3].copy()
    for de, para, tol in trocas:
        a, b = _rgb(de), _rgb(para)
        sel = np.linalg.norm(original - a, axis=1) < tol / 255
        brilho = original[sel].mean(axis=1, keepdims=True) / max(float(a.mean()), 1e-3)
        px[sel, :3] = np.clip(b * brilho, 0, 1)
    img.pixels.foreach_set(px.ravel())


def assar_cor(obj, base, cfg):
    """Material feito com nós que o GLB não carrega (misturas, ruído, troca de cor): o Cycles assa só a
    cor numa imagem (UV do próprio modelo) e o material vira um Principled simples com essa imagem
    e, se houver, o mapa de relevo original."""
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.device = "CPU"
    cena.cycles.samples = 4
    res = cfg.get("resolucao", 2048)
    img = bpy.data.images.new(f"{obj.name}_cor", res, res)
    for slot in obj.material_slots:
        nos = slot.material.node_tree.nodes
        no = nos.new("ShaderNodeTexImage")
        no.image = img
        nos.active = no
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"COLOR"}, margin=8)
    if cfg.get("recolorir"):
        _recolorir(img, cfg["recolorir"])
    caminho = os.path.join(base, "cor_assada.png")
    img.filepath_raw = caminho
    img.file_format = "PNG"
    img.save()
    mat = bpy.data.materials.new(f"{obj.name}_assado")
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    cor = mat.node_tree.nodes.new("ShaderNodeTexImage")
    cor.image = img
    mat.node_tree.links.new(cor.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = cfg.get("rugosidade", 0.6)
    if cfg.get("normal"):
        n = mat.node_tree.nodes.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(os.path.join(base, cfg["normal"]))
        n.image.colorspace_settings.name = "Non-Color"
        mapa = mat.node_tree.nodes.new("ShaderNodeNormalMap")
        mat.node_tree.links.new(n.outputs["Color"], mapa.inputs["Color"])
        mat.node_tree.links.new(mapa.outputs["Normal"], b.inputs["Normal"])
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def converter(pasta, cfg):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    base = os.path.join(PASTA, pasta)
    importar(os.path.join(base, cfg["fonte"]))
    religar_texturas(base)
    obj = juntar_malhas()
    # Modelo com variantes de cor (ex.: a JBL branca, azul, camuflada): todas as faces na escolhida
    if cfg.get("variante"):
        indice = next(i for i, s in enumerate(obj.material_slots) if s.material and s.material.name == cfg["variante"])
        for p in obj.data.polygons:
            p.material_index = indice
    if cfg.get("assar_cor"):
        assar_cor(obj, base, cfg["assar_cor"])
    faces = len(obj.data.polygons)
    limite = cfg.get("faces", 40000)
    if faces > limite:
        # Malha em "sopa de triângulos" (cada face com os seus 3 vértices) não reduz direito: solda antes
        import bmesh

        vs = [v.co for v in obj.data.vertices]
        tamanho = max(max(v[i] for v in vs) - min(v[i] for v in vs) for i in range(3))
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=tamanho * 1e-5)
        bm.to_mesh(obj.data)
        bm.free()
        faces = len(obj.data.polygons)
    if faces > limite:
        mod = obj.modifiers.new("reduzir", "DECIMATE")
        mod.ratio = limite / faces
        bpy.ops.object.modifier_apply(modifier=mod.name)
    # Tamanho real: a medida pedida (altura em z, ou o maior lado) vira `metros`
    vs = [v.co for v in obj.data.vertices]
    minimo = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    maximo = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    dim = maximo - minimo
    eixo, metros = cfg["medida"]
    atual = dim.z if eixo == "altura" else max(dim)
    s = metros / atual
    centro = (minimo + maximo) / 2
    obj.data.transform(Matrix.Scale(s, 4) @ Matrix.Translation(Vector((-centro.x, -centro.y, -minimo.z))))
    saida = os.path.join(base, "modelo.glb")
    bpy.ops.export_scene.gltf(filepath=saida, export_format="GLB", use_selection=False, export_image_format="JPEG",
                              export_jpeg_quality=90, export_apply=True)
    log(f"{pasta}: {faces} -> {len(obj.data.polygons)} faces, {dim.x * s:.3f} x {dim.y * s:.3f} x {dim.z * s:.3f} m, "
        f"{os.path.getsize(saida) // 1024} KB")


def main():
    forcar, so = opcoes()
    config = ler_config(os.path.join(RAIZ, "pipeline", "config", "bake.json"))
    for pasta, cfg in config["terceiros"].items():
        if pasta == "comentario" or (so and pasta not in so):
            continue
        if os.path.exists(os.path.join(PASTA, pasta, "modelo.glb")) and not forcar:
            continue
        converter(pasta, cfg)


main()
