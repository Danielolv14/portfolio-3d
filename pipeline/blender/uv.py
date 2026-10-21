"""Etapa 50: o mapa de UV `bake`, onde cada grupo é desdobrado num atlas só.
O mapa original (`UVMap`) continua sendo o das texturas; o `bake` é o do atlas."""
import math

import bmesh
import bpy

from comum import log, selecionar


def encolher_faces_de_baixo(objs, fator=0.2):
    """Faces viradas para baixo (fundo dos móveis, parte de baixo das prateleiras) quase nunca
    aparecem: ficam com 20% do tamanho no atlas. O empacotamento seguinte respeita o tamanho
    relativo das ilhas, então sobra mais área (e nitidez) para o que a câmera vê."""
    for obj in objs:
        bm = bmesh.from_edit_mesh(obj.data)
        camada = bm.loops.layers.uv["bake"]
        for f in bm.faces:
            if f.normal.z < -0.7:
                centro = sum((l[camada].uv for l in f.loops), f.loops[0][camada].uv * 0) / len(f.loops)
                for l in f.loops:
                    l[camada].uv = centro + (l[camada].uv - centro) * fator
        bmesh.update_edit_mesh(obj.data)


def desdobrar_grupo(objs, margem):
    """Desdobra todos os objetos de um grupo juntos (edição de vários objetos ao mesmo tempo),
    para as ilhas de todos dividirem o mesmo atlas sem se sobrepor."""
    for obj in objs:
        uvs = obj.data.uv_layers
        original = uvs[0] if len(uvs) else None
        bake = uvs.new(name="bake")
        # As texturas continuam lendo o UV original (render); o bake escreve no `bake` (ativo)
        if original:
            original.active_render = True
        uvs.active = bake

    selecionar(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=margem, area_weight=0.0, correct_aspect=True)
    encolher_faces_de_baixo(objs)
    bpy.ops.uv.pack_islands(rotate=True, margin_method="FRACTION", margin=margem, shape_method="CONCAVE")
    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"UV: {[o.name for o in objs]}")
