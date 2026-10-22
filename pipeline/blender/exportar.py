"""Etapa 90: exportar a malha assada para o site (GLB sem materiais e sem normais, só com o UV do atlas)
e renderizar imagens de referência (look dev) pelas câmeras do site."""
import math
import os

import bpy

from comum import SAIDA, do_site, log, selecionar


def _chave_material(m):
    """O que importa no site (que não calcula luz): a cor base e as texturas ligadas a ela.
    Dois materiais com a mesma chave são iguais no site, mesmo sendo diferentes no código."""
    if not m or not m.use_nodes:
        return ("vazio",)
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return ("outro", m.name)
    # Material que brilha (LED, lâmpada): fica sozinho, com o nome (emit-R/G/B controla no site)
    if bsdf.inputs["Emission Strength"].default_value > 0:
        return ("emit", m.name)
    # Faces cortadas da maquete: material próprio, porque o site as desenha sem luz (cor fixa)
    if m.name.startswith("corte_maquete"):
        return ("corte", m.name)
    # Vidro: o site desenha transparente, sem a luz assada
    if m.name.startswith("vidro"):
        return ("vidro", m.name)
    base = bsdf.inputs["Base Color"]
    # Rugosidade e metal decidem o reflexo no site: arredondados em degraus, para juntar o que é parecido
    acabamento = (round(bsdf.inputs["Roughness"].default_value * 10) / 10, round(bsdf.inputs["Metallic"].default_value * 2) / 2)
    if not base.is_linked:
        return ("cor", acabamento, tuple(round(c, 3) for c in base.default_value))
    partes = []
    pilha = [base.links[0].from_node]
    vistos = set()
    while pilha:
        no = pilha.pop()
        if no.name in vistos:
            continue
        vistos.add(no.name)
        if no.bl_idname == "ShaderNodeTexImage":
            partes.append(("img", no.image.name if no.image else ""))
        for entrada in no.inputs:
            if entrada.is_linked:
                pilha.extend(l.from_node for l in entrada.links)
            elif hasattr(entrada, "default_value"):
                v = entrada.default_value
                v = tuple(round(x, 4) for x in v) if hasattr(v, "__len__") else round(v, 4) if isinstance(v, float) else v
                partes.append((no.bl_idname, entrada.identifier, v))
    return ("tex", acabamento, tuple(sorted(partes, key=str)))


def _material_liso(acabamento):
    """Material para as superfícies só de cor, um por acabamento (rugosidade, metal): a cor vai em
    cada vértice (atributo cor_base)."""
    rug, metal = acabamento
    nome = f"liso_r{rug:.1f}_m{metal:.1f}"
    m = bpy.data.materials.get(nome)
    if m:
        return m
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    nos = m.node_tree.nodes
    cor = nos.new("ShaderNodeVertexColor")
    cor.layer_name = "cor_base"
    bsdf = nos["Principled BSDF"]
    m.node_tree.links.new(cor.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rug
    bsdf.inputs["Metallic"].default_value = metal
    return m


def simplificar_materiais(obj):
    """Menos materiais = menos draw calls no site. (1) Materiais iguais viram um só. (2) As faces só
    de cor (sem textura) passam a usar o material `liso`, com a cor guardada nos vértices.
    Objetos que já têm cor por vértice (celular, cadeira) só passam pelo passo 1."""
    malha = obj.data
    tem_cor = len(malha.color_attributes) > 0
    chaves = [_chave_material(s.material) for s in obj.material_slots]
    cor_de = {}
    if not tem_cor:
        attr = malha.color_attributes.new("cor_base", "FLOAT_COLOR", "CORNER")
        # Branco nas faces com textura: o three multiplica pela cor do vértice em toda a malha
        for item in attr.data:
            item.color = (1.0, 1.0, 1.0, 1.0)
        for poly in malha.polygons:
            if poly.material_index < len(chaves):
                k = chaves[poly.material_index]
                if k[0] == "cor":
                    for li in poly.loop_indices:
                        attr.data[li].color = k[2]
                    cor_de[poly.index] = True
        malha.color_attributes.active_color = attr
        malha.color_attributes.render_color_index = malha.color_attributes.find("cor_base")
    # Slots finais: um por chave de textura, mais o `liso`
    novos = []
    indice_de = {}
    for i, k in enumerate(chaves):
        alvo = ("liso", k[1]) if (k[0] == "cor" and not tem_cor) else k
        if alvo not in indice_de:
            indice_de[alvo] = len(novos)
            novos.append(_material_liso(k[1]) if alvo[0] == "liso" else obj.material_slots[i].material)
        chaves[i] = indice_de[alvo]
    indices = [chaves[p.material_index] if p.material_index < len(chaves) else 0 for p in malha.polygons]
    malha.materials.clear()
    for m in novos:
        malha.materials.append(m)
    for p, i in zip(malha.polygons, indices):
        p.material_index = i
    return len(novos)


def _imagens_rgb(objs):
    """O gravador WebP do Blender não aceita imagem de 1 canal (ex.: rugosidade em tons de cinza de um
    modelo do Poly Haven): a textura saía sem imagem no GLB e o GLTFLoader do site quebrava ("reading
    'uri'"). Essas imagens viram uma cópia RGB embutida."""
    trocas = {}
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not (m and m.use_nodes):
                continue
            for no in m.node_tree.nodes:
                img = getattr(no, "image", None)
                # depth = bits por pixel: 8 (ou 16) é uma imagem de 1 canal, em tons de cinza
                if no.bl_idname != "ShaderNodeTexImage" or img is None or img.depth not in (8, 16):
                    continue
                if img.name not in trocas:
                    w, h = img.size
                    nova = bpy.data.images.new(f"{img.name}_rgb", w, h, alpha=False)
                    nova.pixels.foreach_set(_pixels_rgba(img))
                    nova.colorspace_settings.name = img.colorspace_settings.name
                    nova.pack()
                    trocas[img.name] = nova
                    log(f"imagem em tons de cinza convertida para RGB: {img.name}")
                no.image = trocas[img.name]


def _pixels_rgba(img):
    import numpy as np

    px = np.empty(len(img.pixels), dtype=np.float32)
    img.pixels.foreach_get(px)
    return px


def exportar_glb(objs, caminho):
    _imagens_rgb(objs)
    copias = []
    for o in objs:
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.scene.collection.objects.link(c)
        # O nome (grupo__unidade) vai para o GLB: o original sai do caminho antes, senão a cópia
        # ganharia o sufixo ".001" e o site não acharia o objeto clicável pelo nome
        nome = o.name
        o.name = nome + "_orig"
        c.name = nome
        # Mantém os materiais e as texturas originais (nítidas) e os dois UVs:
        # TEXCOORD_0 = UV das texturas (UVMap), TEXCOORD_1 = UV do atlas de luz (bake)
        # Devolve o brilho que o bake tinha zerado
        for slot in c.material_slots:
            if slot.material and "emissao" in slot.material and slot.material.use_nodes:
                bsdf = slot.material.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    bsdf.inputs["Emission Strength"].default_value = slot.material["emissao"]
        antes = len(c.material_slots)
        depois = simplificar_materiais(c)
        log(f"materiais de {c.name}: {antes} -> {depois}")
        copias.append(c)
    selecionar(copias)
    # Computador: texturas de no máximo 1024 px. Os modelos prontos traziam 4096 px até em objetos
    # pequenos: 114 texturas davam ~2,5 GB de memória de GPU e o celular derrubava a página
    _limitar_imagens(copias, 1024)
    _gravar_glb(caminho)
    # Celular: GLB próprio com a cor em 512 px, os outros mapas em 128 px e sem relevo (normal map);
    # a luz assada já dá o volume
    _limitar_imagens(copias, 512, celular=True)
    _gravar_glb(caminho.replace(".glb", "-mobile.glb"))
    for c in copias:
        bpy.data.objects.remove(c, do_unlink=True)
    for o in objs:
        o.name = o.name.removesuffix("_orig")


def _limitar_imagens(objs, limite, celular=False):
    """Reduz as texturas usadas pelos objetos para no máximo `limite` px no lado maior. No celular,
    tira o relevo (normal map) e deixa os mapas que não são de cor (rugosidade, metal) em 128 px."""
    vistas = set()
    for o in objs:
        for slot in o.material_slots:
            m = slot.material
            if not (m and m.use_nodes):
                continue
            if celular:
                for link in list(m.node_tree.links):
                    if link.to_socket.name == "Normal" and link.to_node.bl_idname == "ShaderNodeBsdfPrincipled":
                        m.node_tree.links.remove(link)
            for no in m.node_tree.nodes:
                img = getattr(no, "image", None)
                if no.bl_idname != "ShaderNodeTexImage" or img is None or img.name in vistas:
                    continue
                vistas.add(img.name)
                eh_cor = img.colorspace_settings.name == "sRGB"
                lim = limite if (eh_cor or not celular) else 128
                w, h = img.size
                if max(w, h) > lim:
                    s = lim / max(w, h)
                    img.scale(max(1, round(w * s)), max(1, round(h * s)))


def _gravar_glb(caminho):
    bpy.ops.export_scene.gltf(
        filepath=caminho,
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        # Normais: o site calcula o reflexo (piso, cromado, vidro) a partir delas
        export_normals=True,
        export_materials="EXPORT",
        export_image_format="WEBP",
        export_image_quality=90,
        export_extras=True,
        export_apply=True,
        export_yup=True,
        # Draco: comprime a geometria (o site descomprime com o decodificador do three, servido localmente)
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=7,
        export_draco_position_quantization=14,
        export_draco_texcoord_quantization=12,
    )
    log(f"GLB: {caminho} ({os.path.getsize(caminho) // 1024} KB)")


def _fundo_composto(cena, hexa):
    """Põe a imagem (fundo transparente) sobre uma cor lisa, como o fundo do site."""
    cor = [int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    # O compositor trabalha em linear; a cor do site é sRGB
    cor = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in cor]
    cena.use_nodes = True
    cena.render.use_compositing = True
    nos = cena.node_tree.nodes
    nos.clear()
    camada = nos.new("CompositorNodeRLayers")
    sobre = nos.new("CompositorNodeAlphaOver")
    saida = nos.new("CompositorNodeComposite")
    sobre.inputs[1].default_value = (*cor, 1.0)
    cena.node_tree.links.new(camada.outputs["Image"], sobre.inputs[2])
    cena.node_tree.links.new(sobre.outputs[0], saida.inputs[0])


def render_referencia(config, nome_rig, camera, amostras, largura=1280, altura=800, pasta=None, nome=None, fundo=None, manter_camera=False):
    """Imagem do Cycles pela mesma câmera do site (fov vertical 35°), com AgX, para comparar cores.
    A prévia rápida (previa.py) usa a mesma função, com o fundo do site e outra pasta."""
    cena = bpy.context.scene
    velha = bpy.data.objects.get("cam_ref")
    if velha:
        bpy.data.objects.remove(velha, do_unlink=True)
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
    if fundo:
        _fundo_composto(cena, fundo)
    else:
        cena.use_nodes = False
        cena.render.use_compositing = False
    cena.view_settings.view_transform = "AgX"
    cena.view_settings.look = "None"
    cena.view_settings.exposure = config["rigs"][nome_rig].get("exposicao", 0)
    cena.render.film_transparent = True
    cena.render.image_settings.file_format = "PNG"
    cena.render.image_settings.color_depth = "8"
    caminho = os.path.join(pasta or SAIDA, f"{nome or f'ref_{camera}_{nome_rig}'}.png")
    cena.render.filepath = caminho
    bpy.ops.render.render(write_still=True)
    if not manter_camera:
        bpy.data.objects.remove(cam, do_unlink=True)
        cena.camera = None
    log(f"referência: {caminho}")
