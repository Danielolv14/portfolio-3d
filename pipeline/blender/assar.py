"""Etapas 70–80: assar albedo e luz no Cycles, tirar o ruído e codificar em 8 bits para o site."""
import os

import bpy
import numpy as np

from comum import SAIDA, log, selecionar

GAMA = 2.2


def _imagem(nome, tamanho, flutuante):
    img = bpy.data.images.get(nome)
    if img:
        bpy.data.images.remove(img)
    img = bpy.data.images.new(nome, tamanho, tamanho, alpha=True, float_buffer=flutuante)
    img.generated_color = (0, 0, 0, 0)
    if not flutuante:
        img.colorspace_settings.name = "Non-Color"
    return img


def _apontar_materiais(obj, img):
    """Em cada material, um nó de imagem (solto) apontando para a imagem do grupo, ativo: o Cycles assa nele."""
    for slot in obj.material_slots:
        m = slot.material
        if not m:
            continue
        m.use_nodes = True
        nos = m.node_tree.nodes
        no = nos.get("bake_alvo") or nos.new("ShaderNodeTexImage")
        no.name = "bake_alvo"
        no.image = img
        nos.active = no


def assar(objs, img, tipo, amostras, margem):
    """Assa todos os objetos de um grupo na mesma imagem, numa chamada só."""
    cena = bpy.context.scene
    cena.cycles.samples = amostras
    cena.render.bake.margin = margem
    cena.render.bake.margin_type = "EXTEND"
    for obj in objs:
        _apontar_materiais(obj, img)
    selecionar(objs)
    if tipo == "albedo":
        filtro = {"COLOR"}
    else:
        filtro = {"DIRECT", "INDIRECT"}
    bpy.ops.object.bake(type="DIFFUSE", pass_filter=filtro, margin=margem, use_clear=True, target="IMAGE_TEXTURES")


def _pixels(img):
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    return px.reshape(h, w, 4)


def tirar_ruido(img):
    """Denoise (OIDN) pelo compositor: renderiza 1 amostra só para o compositor rodar, com a
    imagem assada entrando no nó Denoise. Devolve uma imagem nova, em float."""
    cena = bpy.context.scene
    w, h = img.size
    antes = (cena.render.resolution_x, cena.render.resolution_y, cena.render.resolution_percentage, cena.cycles.samples, cena.camera)
    if cena.camera is None:
        cam = bpy.data.objects.new("cam_denoise", bpy.data.cameras.new("cam_denoise"))
        cena.collection.objects.link(cam)
        cena.camera = cam
    cena.render.resolution_x, cena.render.resolution_y, cena.render.resolution_percentage = w, h, 100
    cena.cycles.samples = 1
    cena.use_nodes = True
    arvore = cena.node_tree
    arvore.nodes.clear()
    entrada = arvore.nodes.new("CompositorNodeImage")
    entrada.image = img
    dn = arvore.nodes.new("CompositorNodeDenoise")
    dn.prefilter = "NONE"
    saida = arvore.nodes.new("CompositorNodeComposite")
    arvore.links.new(entrada.outputs["Image"], dn.inputs["Image"])
    arvore.links.new(dn.outputs["Image"], saida.inputs["Image"])
    cena.render.use_compositing = True
    cena.view_settings.view_transform = "Standard"
    bpy.ops.render.render()
    resultado = bpy.data.images["Render Result"]
    caminho = os.path.join(SAIDA, f"_denoise_{img.name}.exr")
    cena.render.image_settings.file_format = "OPEN_EXR"
    cena.render.image_settings.color_depth = "32"
    resultado.save_render(caminho)
    limpo = bpy.data.images.load(caminho, check_existing=False)
    limpo.colorspace_settings.name = "Non-Color"
    cena.render.resolution_x, cena.render.resolution_y, cena.render.resolution_percentage, cena.cycles.samples, cena.camera = antes
    cena.use_nodes = False
    return limpo


def _salvar_png(dados, nome):
    """Grava RGBA 0–1 (já codificado) num PNG de 8 bits, sem conversão de cor do Blender."""
    h, w, _ = dados.shape
    img = bpy.data.images.new(nome, w, h, alpha=True, float_buffer=False)
    img.colorspace_settings.name = "Non-Color"
    img.pixels.foreach_set(np.clip(dados, 0, 1).astype(np.float32).ravel())
    # WebP (q90): ~6x menor que PNG sem perda visível (docs/plano/resultados-poc.md)
    # Image.save grava os valores como estão (o save_render aplicaria a transformação de cor da cena)
    caminho = os.path.join(SAIDA, nome + ".webp")
    img.filepath_raw = caminho
    img.file_format = "WEBP"
    img.save(quality=90)
    # Versão do celular, com metade do tamanho (4x menos memória na placa de vídeo)
    img.scale(max(1, w // 2), max(1, h // 2))
    img.filepath_raw = os.path.join(SAIDA, nome + "-mobile.webp")
    img.save(quality=90)
    bpy.data.images.remove(img)
    return caminho


def _srgb(lin):
    lin = np.clip(lin, 0, 1)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)


def salvar_albedo(img, nome):
    px = _pixels(img)
    cor = _srgb(px[..., :3])
    out = np.concatenate([cor, np.ones_like(px[..., :1])], axis=-1)
    return _salvar_png(out, nome)


def salvar_luz(img, nome, cobertura):
    """A luz passa de 1, e o PNG não. Divide por uma escala S (percentil 99,9) e aplica a raiz
    1/2,2, que guarda mais precisão nos escuros. No site: luz = valor^2,2 × S."""
    px = _pixels(img)
    luz = np.maximum(px[..., :3], 0)
    maximo = luz.max(axis=-1)
    validos = maximo[cobertura]
    escala = float(np.percentile(validos, 99.9)) if validos.size else 1.0
    escala = max(escala, 1e-4)
    cod = np.power(np.clip(luz / escala, 0, 1), 1 / GAMA)
    out = np.concatenate([cod, np.ones_like(px[..., :1])], axis=-1)
    return _salvar_png(out, nome), escala


def salvar_mascara(imgs, nome, cobertura):
    """Máscara dos LEDs: a luz de cada fonte (assada sozinha, branca) num canal R, G ou B.
    Cada canal tem a sua escala, como os lightmaps (luz = valor^2,2 × escala)."""
    canais = []
    escalas = []
    for img in imgs:
        luz = np.maximum(_pixels(img)[..., :3], 0).mean(axis=-1)
        validos = luz[cobertura]
        s = max(float(np.percentile(validos, 99.9)) if validos.size else 1.0, 1e-4)
        canais.append(np.power(np.clip(luz / s, 0, 1), 1 / GAMA))
        escalas.append(s)
    out = np.stack(canais + [np.ones_like(canais[0])], axis=-1)
    return _salvar_png(out, nome), escalas


def cobertura(img):
    """Onde há ilhas de UV (o bake escreve alfa 1 nas ilhas e na margem)."""
    return _pixels(img)[..., 3] > 0.5
