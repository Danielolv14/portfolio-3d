"""Etapa 60: os rigs de luz de dia e de noite (docs/plano/03-iluminacao.md)."""
import math

import bpy

from comum import apontar, direcao_sol, do_site, log

COLECAO = "rig"


def _limpar_rig():
    col = bpy.data.collections.get(COLECAO)
    if col:
        for o in list(col.objects):
            bpy.data.objects.remove(o, do_unlink=True)
    else:
        col = bpy.data.collections.new(COLECAO)
        bpy.context.scene.collection.children.link(col)
    return col


def _mundo():
    mundo = bpy.data.worlds.get("mundo") or bpy.data.worlds.new("mundo")
    bpy.context.scene.world = mundo
    mundo.use_nodes = True
    nos = mundo.node_tree.nodes
    nos.clear()
    saida = nos.new("ShaderNodeOutputWorld")
    fundo = nos.new("ShaderNodeBackground")
    mundo.node_tree.links.new(fundo.outputs[0], saida.inputs[0])
    return mundo, fundo


def _luz(col, cfg):
    tipo = cfg["tipo"]
    dados = bpy.data.lights.new(cfg["nome"], tipo)
    dados.color = cfg["cor"]
    dados.energy = cfg["forca"]
    if tipo in ("POINT", "SPOT"):
        dados.shadow_soft_size = cfg.get("raio", 0.1)
    if tipo == "AREA":
        # Retângulo: o lado comprido (tamanho[1]) fica ao longo do eixo z do site
        dados.shape = "RECTANGLE"
        dados.size, dados.size_y = cfg["tamanho"]
    obj = bpy.data.objects.new(cfg["nome"], dados)
    obj.location = do_site(cfg["posicao"])
    # A fonte ilumina, mas não aparece nas imagens (o retângulo de luz ficaria visível na prévia)
    obj.visible_camera = False
    col.objects.link(obj)
    if "direcao" in cfg:
        apontar(obj, do_site(cfg["direcao"]))
    return obj


def _sol(col, cfg):
    dados = bpy.data.lights.new("sol", "SUN")
    dados.energy = cfg["forca"]
    dados.angle = math.radians(cfg["angulo"])
    dados.color = cfg["cor"]
    obj = bpy.data.objects.new("sol", dados)
    col.objects.link(obj)
    apontar(obj, do_site(direcao_sol(cfg["elevacao"], cfg["azimute"])))
    return obj


def _portal(col, janela):
    """Area light do tipo portal no vão da janela: ajuda o Cycles a achar a luz do céu."""
    dados = bpy.data.lights.new("portal", "AREA")
    dados.shape = "RECTANGLE"
    dados.size = janela["x1"] - janela["x0"]
    dados.size_y = janela["y1"] - janela["y0"]
    dados.cycles.is_portal = True
    obj = bpy.data.objects.new("portal", dados)
    centro = ((janela["x0"] + janela["x1"]) / 2, (janela["y0"] + janela["y1"]) / 2, janela["z"])
    obj.location = do_site(centro)
    col.objects.link(obj)
    apontar(obj, do_site((0, 0, 1)))  # para dentro do quarto
    return obj


def montar_led(leds):
    """Só as fontes de um canal acesas, brancas, com o céu preto: o bake mostra até onde a luz delas
    chega. No site, essa luz é multiplicada pela cor e pela potência escolhidas (máscara de LEDs)."""
    col = _limpar_rig()
    _mundo()[1].inputs[1].default_value = 0.0
    for led in leds:
        _luz(col, {**led, "cor": [1.0, 1.0, 1.0]})
    log(f"led: {', '.join(l['nome'] for l in leds)} (canal {leds[0]['canal']})")


def montar(config, nome):
    rig = config["rigs"][nome]
    col = _limpar_rig()
    mundo, fundo = _mundo()
    if "ceu" in rig:
        ceu = mundo.node_tree.nodes.new("ShaderNodeTexSky")
        ceu.sky_type = "NISHITA"
        ceu.sun_disc = False  # o disco do sol vem da luz `sol`, alinhada no mesmo ângulo
        ceu.sun_elevation = math.radians(rig["ceu"]["elevacaoSol"])
        mundo.node_tree.links.new(ceu.outputs[0], fundo.inputs[0])
        fundo.inputs[1].default_value = rig["ceu"]["forca"]
    else:
        fundo.inputs[0].default_value = (*rig["mundo"]["cor"], 1)
        fundo.inputs[1].default_value = rig["mundo"]["forca"]
    _sol(col, rig["sol"])
    _portal(col, config["janela"])
    for l in rig["luzes"]:
        _luz(col, l)
    log(f"rig: {nome} ({len(col.objects)} luzes)")
