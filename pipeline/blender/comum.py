"""Coisas usadas por todas as etapas do pipeline: caminhos, configuração, conversão de coordenadas e log."""
import json
import math
import os
import sys
import time

import bpy
from mathutils import Vector

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.join(RAIZ, "pipeline", ".cache")
SAIDA = os.path.join(CACHE, "out")

_inicio = time.time()


def log(msg):
    print(f"[pipeline {time.time() - _inicio:7.1f}s] {msg}", flush=True)


def ler_config(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def argumentos():
    """Argumentos depois de `--` na linha do Blender: --config, --preview, --etapa."""
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    opcoes = {"config": os.path.join(RAIZ, "pipeline", "config", "bake.json"), "preview": False, "etapa": "tudo"}
    for a in args:
        if a == "--preview":
            opcoes["preview"] = True
        elif a.startswith("--config="):
            opcoes["config"] = a.split("=", 1)[1]
        elif a.startswith("--etapa="):
            opcoes["etapa"] = a.split("=", 1)[1]
    return opcoes


def do_site(v):
    """Ponto do site (three.js, y para cima) para o Blender (z para cima): (x, y, z) -> (x, -z, y)."""
    x, y, z = v
    return Vector((x, -z, y))


def direcao_sol(elevacao, azimute):
    """Direção em que a luz do sol ANDA, no sistema do site.
    O sol fica atrás da parede da janela (z negativo) e a luz anda para +z, descendo.
    `azimute` gira essa direção para +x (positivo) ou -x (negativo), em graus."""
    el = math.radians(elevacao)
    az = math.radians(azimute)
    return (math.sin(az) * math.cos(el), -math.sin(el), math.cos(az) * math.cos(el))


def apontar(obj, direcao_blender):
    """Gira uma luz (que emite para o seu -Z local) para apontar na direção dada."""
    obj.rotation_euler = Vector(direcao_blender).to_track_quat("-Z", "Y").to_euler()


def configurar_gpu(dispositivo):
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = dispositivo
    prefs.get_devices()
    for d in prefs.devices:
        # Só a GPU: misturar com a CPU deixa o bake mais lento nesta máquina
        d.use = d.type != "CPU"
    cena = bpy.context.scene
    cena.render.engine = "CYCLES"
    cena.cycles.device = "GPU"
    # 1 thread no processador: o Cycles às vezes derrubava o Blender ao ler os atributos das malhas
    # em paralelo (EXCEPTION_ACCESS_VIOLATION em OpenImageIO ustring, dentro de ccl::create_mesh).
    # O render continua na GPU; só a preparação da cena fica mais lenta
    cena.render.threads_mode = "FIXED"
    cena.render.threads = 1
    log(f"GPU: {dispositivo} {[d.name for d in prefs.devices if d.use]}")


def selecionar(objs, ativo=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = ativo or (objs[0] if objs else None)
