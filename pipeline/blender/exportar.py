"""Etapa 90: exportar a malha assada para o site (GLB sem materiais e sem normais, só com o UV do atlas)
e renderizar imagens de referência (look dev) pelas câmeras do site."""
import math
import os

import bpy

from comum import SAIDA, do_site, log, selecionar


def exportar_glb(objs, caminho):
    copias = []
    for o in objs:
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.scene.collection.objects.link(c)
        c.name = o.name  # o nome (grupo__unidade) vai para o GLB
        o.name = o.name + "_orig"
        uvs = c.data.uv_layers
        for uv in [u for u in uvs if u.name != "bake"]:
            uvs.remove(uv)
        # Sem material: no site, cada grupo ganha o material assado (1 primitiva por malha)
        c.data.materials.clear()
        copias.append(c)
    selecionar(copias)
    bpy.ops.export_scene.gltf(
        filepath=caminho,
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_normals=False,
        export_materials="NONE",
        export_extras=True,
        export_apply=True,
        export_yup=True,
        # Draco: comprime a geometria (o site descomprime com o decodificador do three, servido localmente)
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_texcoord_quantization=12,
    )
    for c in copias:
        bpy.data.objects.remove(c, do_unlink=True)
    for o in objs:
        o.name = o.name.removesuffix("_orig")
    log(f"GLB: {caminho} ({os.path.getsize(caminho) // 1024} KB)")


def render_referencia(config, nome_rig, camera, amostras, largura=1280, altura=800):
    """Imagem do Cycles pela mesma câmera do site (fov vertical 35°), com AgX, para comparar cores."""
    cena = bpy.context.scene
    cfg = config["cameras"][camera]
    dados = bpy.data.cameras.new("cam_ref")
    dados.sensor_fit = "VERTICAL"
    dados.angle_y = math.radians(35)
    cam = bpy.data.objects.new("cam_ref", dados)
    cena.collection.objects.link(cam)
    cam.location = do_site(cfg["posicao"])
    direcao = do_site(cfg["alvo"]) - cam.location
    cam.rotation_euler = direcao.to_track_quat("-Z", "Y").to_euler()
    cena.camera = cam
    cena.render.resolution_x, cena.render.resolution_y, cena.render.resolution_percentage = largura, altura, 100
    cena.cycles.samples = amostras
    cena.cycles.use_denoising = True
    cena.use_nodes = False
    cena.render.use_compositing = False
    cena.view_settings.view_transform = "AgX"
    cena.view_settings.look = "None"
    cena.view_settings.exposure = config["rigs"][nome_rig].get("exposicao", 0)
    cena.render.film_transparent = True
    cena.render.image_settings.file_format = "PNG"
    cena.render.image_settings.color_depth = "8"
    caminho = os.path.join(SAIDA, f"ref_{camera}_{nome_rig}.png")
    cena.render.filepath = caminho
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam, do_unlink=True)
    cena.camera = None
    log(f"referência: {caminho}")
