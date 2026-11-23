"""Cenas 3D no Blender (bpy, Cycles na CPU).

Uso:
  python3 blender/cenas.py <cena> <segundos> <fps> <pasta_saida> [quadro_teste]
Cenas: terra_lua | canhao | orbita
Gera PNGs com fundo transparente (as estrelas são compostas depois com FFmpeg).
"""
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

AQUI = Path(__file__).resolve().parent
CENA, DUR, FPS, SAIDA = sys.argv[1], float(sys.argv[2]), int(sys.argv[3]), Path(sys.argv[4])
TESTE = int(sys.argv[5]) if len(sys.argv) > 5 else None
NQ = int(round(DUR * FPS))


def suave(u):
    u = max(0.0, min(1.0, u))
    return u * u * (3 - 2 * u)


# ---------- cena base ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"
cena = bpy.context.scene
r = cena.render
r.engine = "CYCLES"
cena.cycles.device = "CPU"
cena.cycles.samples = 12
cena.cycles.adaptive_threshold = 0.04
cena.cycles.use_denoising = True
cena.cycles.max_bounces = 3
cena.cycles.diffuse_bounces = 1
cena.cycles.glossy_bounces = 1
cena.cycles.transparent_max_bounces = 8
r.use_persistent_data = True
r.film_transparent = True
r.resolution_x, r.resolution_y, r.resolution_percentage = 1280, 720, 100
r.fps = FPS
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
cena.view_settings.view_transform = "AgX"
cena.view_settings.look = "AgX - Medium High Contrast"
cena.frame_start, cena.frame_end = 1, NQ

mundo = bpy.data.worlds.new("mundo")
cena.world = mundo
mundo.use_nodes = True
mundo.node_tree.nodes["Background"].inputs["Color"].default_value = (0.0, 0.0, 0.0, 1)
mundo.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.0


def material(nome):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    return m, m.node_tree.nodes, m.node_tree.links


def esfera(nome, raio, seg=128, aneis=64):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=aneis, radius=raio)
    o = bpy.context.active_object
    o.name = nome
    bpy.ops.object.shade_smooth()
    return o


def criar_terra(com_nuvens=True, com_atmosfera=True):
    pivo = bpy.data.objects.new("eixo_terra", None)
    cena.collection.objects.link(pivo)
    terra = esfera("terra", 1.0)
    terra.parent = pivo
    m, n, l = material("terra")
    bsdf = n["Principled BSDF"]
    tex = n.new("ShaderNodeTexImage")
    tex.image = bpy.data.images.load(str(AQUI / "terra.png"))
    l.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    # oceano mais brilhante (reflexo do sol), terra fosca
    sep = n.new("ShaderNodeSeparateColor")
    l.new(tex.outputs["Color"], sep.inputs["Color"])
    dif = n.new("ShaderNodeMath"); dif.operation = "SUBTRACT"
    l.new(sep.outputs["Blue"], dif.inputs[0]); l.new(sep.outputs["Red"], dif.inputs[1])
    mr = n.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value, mr.inputs["From Max"].default_value = 0.0, 0.25
    mr.inputs["To Min"].default_value, mr.inputs["To Max"].default_value = 0.9, 0.3
    l.new(dif.outputs[0], mr.inputs["Value"])
    l.new(mr.outputs["Result"], bsdf.inputs["Roughness"])
    # leve relevo
    ruido = n.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = 60; ruido.inputs["Detail"].default_value = 6
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.08
    l.new(ruido.outputs["Fac"], bump.inputs["Height"]); l.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    terra.data.materials.append(m)

    if com_nuvens:
        nuv = esfera("nuvens", 1.012)
        nuv.parent = pivo
        m, n, l = material("nuvens")
        bsdf = n["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
        bsdf.inputs["Roughness"].default_value = 1.0
        coord = n.new("ShaderNodeTexCoord")
        rd = n.new("ShaderNodeTexNoise")
        rd.inputs["Scale"].default_value = 3.2; rd.inputs["Detail"].default_value = 10; rd.inputs["Roughness"].default_value = 0.62
        l.new(coord.outputs["Object"], rd.inputs["Vector"])
        rampa = n.new("ShaderNodeValToRGB")
        rampa.color_ramp.elements[0].position = 0.52; rampa.color_ramp.elements[1].position = 0.70
        l.new(rd.outputs["Fac"], rampa.inputs["Fac"])
        transp = n.new("ShaderNodeBsdfTransparent")
        mix = n.new("ShaderNodeMixShader")
        l.new(rampa.outputs["Color"], mix.inputs["Fac"])
        l.new(transp.outputs[0], mix.inputs[1]); l.new(bsdf.outputs[0], mix.inputs[2])
        l.new(mix.outputs[0], n["Material Output"].inputs["Surface"])
        nuv.data.materials.append(m)

    if not com_atmosfera:
        return pivo, terra
    # atmosfera: borda azul brilhante
    atm = esfera("atmosfera", 1.035, 96, 48)
    atm.parent = pivo
    m, n, l = material("atmosfera")
    n.remove(n["Principled BSDF"])
    lw = n.new("ShaderNodeLayerWeight"); lw.inputs["Blend"].default_value = 0.5
    pot = n.new("ShaderNodeMath"); pot.operation = "POWER"; pot.inputs[1].default_value = 6.0
    l.new(lw.outputs["Facing"], pot.inputs[0])
    em = n.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (0.25, 0.55, 1.0, 1); em.inputs["Strength"].default_value = 1.6
    transp = n.new("ShaderNodeBsdfTransparent")
    mix = n.new("ShaderNodeMixShader")
    l.new(pot.outputs[0], mix.inputs["Fac"]); l.new(transp.outputs[0], mix.inputs[1]); l.new(em.outputs[0], mix.inputs[2])
    l.new(mix.outputs[0], n["Material Output"].inputs["Surface"])
    atm.data.materials.append(m)
    return pivo, terra


def criar_lua(raio):
    lua = esfera("lua", raio, 96, 48)
    m, n, l = material("lua")
    bsdf = n["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = 0.95
    vor = n.new("ShaderNodeTexVoronoi"); vor.inputs["Scale"].default_value = 9
    ruido = n.new("ShaderNodeTexNoise"); ruido.inputs["Scale"].default_value = 5; ruido.inputs["Detail"].default_value = 8
    rampa = n.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].color = (0.18, 0.18, 0.19, 1); rampa.color_ramp.elements[1].color = (0.62, 0.61, 0.6, 1)
    l.new(ruido.outputs["Fac"], rampa.inputs["Fac"]); l.new(rampa.outputs["Color"], bsdf.inputs["Base Color"])
    bump = n.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.35
    l.new(vor.outputs["Distance"], bump.inputs["Height"]); l.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    lua.data.materials.append(m)
    return lua


def sol(rot, forca=4.5):
    luz = bpy.data.lights.new("sol", "SUN")
    luz.energy = forca
    luz.angle = math.radians(0.6)
    o = bpy.data.objects.new("sol", luz)
    cena.collection.objects.link(o)
    o.rotation_euler = [math.radians(a) for a in rot]
    return o


def camera(lente=50):
    c = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    c.data.lens = lente
    c.data.clip_start = 0.01
    cena.collection.objects.link(c)
    cena.camera = c
    alvo = bpy.data.objects.new("alvo", None)
    cena.collection.objects.link(alvo)
    tr = c.constraints.new("TRACK_TO")
    tr.target = alvo
    tr.track_axis, tr.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
    return c, alvo


def emissivo(nome, cor, forca):
    m, n, l = material(nome)
    n.remove(n["Principled BSDF"])
    em = n.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*cor, 1)
    em.inputs["Strength"].default_value = forca
    l.new(em.outputs[0], n["Material Output"].inputs["Surface"])
    return m, em


def trilha(nome, pontos, cor, espessura):
    cu = bpy.data.curves.new(nome, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = espessura
    cu.bevel_resolution = 2
    cu.bevel_factor_mapping_end = "SEGMENTS"
    cu.bevel_factor_mapping_start = "SEGMENTS"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pontos) - 1)
    for p, (x, y, z) in zip(sp.points, pontos):
        p.co = (x, y, z, 1)
    o = bpy.data.objects.new(nome, cu)
    cena.collection.objects.link(o)
    m, _ = emissivo(nome + "_mat", cor, 2.2)
    cu.materials.append(m)
    return o, cu


# ---------- cenas ----------
def cena_terra_lua():
    pivo, terra = criar_terra()
    pivo.rotation_euler = (0, math.radians(23.4), 0)
    lua = criar_lua(0.27)
    sol((62, 0, -58), 4.8)
    cam, alvo = camera(50)
    for f in range(1, NQ + 1):
        u = (f - 1) / max(NQ - 1, 1)
        terra.rotation_euler = (0, 0, math.radians(-110 + 70 * u))
        terra.keyframe_insert("rotation_euler", frame=f)
        th = math.radians(-160 + 140 * u)
        lua.location = (3.7 * math.cos(th), 3.7 * math.sin(th), 0.35 * math.sin(th + 1.0))
        lua.keyframe_insert("location", frame=f)
        d = 11.5 - 3.0 * suave(u)
        cam.location = (0.8 - 1.2 * u, -d, 1.6 + 0.5 * u)
        cam.keyframe_insert("location", frame=f)
        alvo.location = (0.5 - 0.6 * u, 0, 0)
        alvo.keyframe_insert("location", frame=f)


def cena_canhao():
    pivo, terra = criar_terra(com_nuvens=False, com_atmosfera=False)
    # leva o Brasil (lat -10, lon -50) para o topo, onde fica a montanha
    terra.rotation_mode = "ZXY"
    terra.rotation_euler = (math.radians(-100), 0, math.radians(-50))
    sol((55, 0, -35), 5.0)
    # montanha e canhão no "topo" da Terra
    bpy.ops.mesh.primitive_cone_add(vertices=64, radius1=0.16, radius2=0.004, depth=0.15, location=(0, 0, 1.055))
    mont = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    m, n, l = material("montanha")
    bsdf = n["Principled BSDF"]
    coord = n.new("ShaderNodeTexCoord")
    sepz = n.new("ShaderNodeSeparateXYZ"); l.new(coord.outputs["Object"], sepz.inputs[0])
    rampa = n.new("ShaderNodeValToRGB")
    rampa.color_ramp.elements[0].position = 0.55; rampa.color_ramp.elements[0].color = (0.22, 0.17, 0.13, 1)
    rampa.color_ramp.elements[1].position = 0.85; rampa.color_ramp.elements[1].color = (0.92, 0.94, 0.98, 1)
    mr = n.new("ShaderNodeMapRange"); mr.inputs["From Min"].default_value = -0.075; mr.inputs["From Max"].default_value = 0.075
    l.new(sepz.outputs["Z"], mr.inputs["Value"]); l.new(mr.outputs["Result"], rampa.inputs["Fac"])
    l.new(rampa.outputs["Color"], bsdf.inputs["Base Color"]); bsdf.inputs["Roughness"].default_value = 0.9
    mont.data.materials.append(m)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.007, depth=0.05, location=(0.022, 0, 1.128), rotation=(0, math.radians(90), 0))
    canhao = bpy.context.active_object
    mc, nc, lc = material("canhao")
    nc["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.05, 0.06, 1)
    nc["Principled BSDF"].inputs["Metallic"].default_value = 1.0
    nc["Principled BSDF"].inputs["Roughness"].default_value = 0.35
    canhao.data.materials.append(mc)

    # física: GM = 1, raio da Terra = 1, lançamento horizontal do topo da montanha
    r0 = 1.13
    vc = math.sqrt(1 / r0)
    cores = [(1.0, 0.25, 0.15), (1.0, 0.55, 0.1), (1.0, 0.9, 0.2), (0.45, 1.0, 0.35), (0.25, 0.85, 1.0)]
    fatores = [0.30, 0.52, 0.70, 0.86, 1.0]
    inicios = [0.6, 2.3, 4.1, 6.3, 8.9]
    duracoes = [1.1, 1.4, 1.8, 2.3, 5.2]
    for k, (fat, cor, t0, dur) in enumerate(zip(fatores, cores, inicios, duracoes)):
        x, z, vx, vz = 0.045, r0, fat * vc, 0.0
        pts, dt, ang, tsim = [(x, 0, z)], 0.002, 0.0, 0.0
        while True:
            def ac(px, pz):
                d3 = (px * px + pz * pz) ** 1.5
                return -px / d3, -pz / d3
            ax1, az1 = ac(x, z)
            vx2, vz2 = vx + ax1 * dt / 2, vz + az1 * dt / 2
            ax2, az2 = ac(x + vx * dt / 2, z + vz * dt / 2)
            x, z = x + vx2 * dt, z + vz2 * dt
            vx, vz = vx + ax2 * dt, vz + az2 * dt
            tsim += dt
            ang = math.atan2(x, z) % (2 * math.pi)
            pts.append((x, 0, z))
            if math.hypot(x, z) < 1.0 or (len(pts) > 50 and ang < 0.02 and fat >= 0.99):
                break
            if tsim > 12:
                break
        # reamostra em passos iguais de tempo para casar com a animação
        nq = int(dur * FPS)
        idx = [round(i * (len(pts) - 1) / nq) for i in range(nq + 1)]
        amostra = [pts[i] for i in idx]
        obj, cu = trilha(f"trilha{k}", amostra, cor, 0.0032)
        bola = esfera(f"bola{k}", 0.011, 24, 12)
        mb, _ = emissivo(f"bola{k}_mat", (1, 0.95, 0.8), 12.0)
        bola.data.materials.append(mb)
        f0 = int(t0 * FPS) + 1
        for f in range(1, NQ + 1):
            i = f - f0
            vis = i >= 0
            p = amostra[min(max(i, 0), nq)]
            bola.location = p
            bola.scale = (1, 1, 1) if vis else (0, 0, 0)
            bola.keyframe_insert("location", frame=f); bola.keyframe_insert("scale", frame=f)
            cu.bevel_factor_end = min(max(i, 0) / nq, 1.0) if vis else 0.0
            cu.keyframe_insert("bevel_factor_end", frame=f)
        # clarão no impacto (quando a bala bate no chão)
        if fat < 0.99:
            clarao = esfera(f"clarao{k}", 0.03, 24, 12)
            mcl, emc = emissivo(f"clarao{k}_mat", cor, 0.0)
            clarao.data.materials.append(mcl)
            clarao.location = amostra[-1]
            fi = f0 + nq
            for f in range(1, NQ + 1):
                u = (f - fi) / (0.6 * FPS)
                s = 0 if u < 0 or u > 1 else 0.4 + 1.6 * u
                clarao.scale = (s, s, s)
                clarao.keyframe_insert("scale", frame=f)
                emc.inputs["Strength"].default_value = 0 if u < 0 or u > 1 else 25 * (1 - u)
                emc.inputs["Strength"].keyframe_insert("default_value", frame=f)

    cam, alvo = camera(35)
    for f in range(1, NQ + 1):
        t = (f - 1) / FPS
        u = suave((t - 2.6) / 7.0)
        cam.location = Vector((0.3, -0.82, 1.16)).lerp(Vector((0.0, -5.4, 0.25)), u)
        alvo.location = Vector((0.2, 0, 1.06)).lerp(Vector((0, 0, 0.1)), u)
        cam.keyframe_insert("location", frame=f); alvo.keyframe_insert("location", frame=f)


def cena_orbita():
    pivo, terra = criar_terra()
    pivo.rotation_euler = (0, math.radians(23.4), 0)
    sol((60, 0, -50), 4.8)
    inc = math.radians(28)
    raio = 1.11
    a0, volta = -100.0, 290.0  # ângulo inicial e quanto o satélite percorre no clipe

    def pos(graus):
        a = math.radians(graus)
        x, y = raio * math.cos(a), raio * math.sin(a)
        return (x, y * math.cos(inc), y * math.sin(inc))

    # anel fraco com a órbita completa + rastro brilhante atrás do satélite
    anel, cu_anel = trilha("anel", [pos(a0 + i) for i in range(361)], (0.3, 0.6, 1.0), 0.0015)
    cu_anel.materials[0].node_tree.nodes["Emission"].inputs["Strength"].default_value = 1.2
    _, cu = trilha("rastro", [pos(a0 + i * volta / 360) for i in range(361)], (0.3, 0.85, 1.0), 0.006)
    sat = esfera("satelite", 0.016, 24, 12)
    ms, _ = emissivo("sat_mat", (1, 1, 1), 15.0)
    sat.data.materials.append(ms)
    cam, alvo = camera(40)
    for f in range(1, NQ + 1):
        u = (f - 1) / max(NQ - 1, 1)
        terra.rotation_euler = (0, 0, math.radians(-60 + 25 * u))
        terra.keyframe_insert("rotation_euler", frame=f)
        sat.location = pos(a0 + volta * u)
        sat.keyframe_insert("location", frame=f)
        cu.bevel_factor_end = u
        cu.bevel_factor_start = max(0.0, u - 0.3)
        cu.keyframe_insert("bevel_factor_end", frame=f)
        cu.keyframe_insert("bevel_factor_start", frame=f)
        th = math.radians(-95 + 25 * u)
        cam.location = (3.6 * math.cos(th), 3.6 * math.sin(th), 1.3)
        cam.keyframe_insert("location", frame=f)
        alvo.location = (0.15, 0, -0.05)
        alvo.keyframe_insert("location", frame=f)


{"terra_lua": cena_terra_lua, "canhao": cena_canhao, "orbita": cena_orbita}[CENA]()

SAIDA.mkdir(parents=True, exist_ok=True)
if TESTE:
    cena.frame_set(TESTE)
    r.filepath = str(SAIDA / f"teste_{CENA}_{TESTE:04d}.png")
    bpy.ops.render.render(write_still=True)
else:
    r.filepath = str(SAIDA / "q_")
    bpy.ops.render.render(animation=True)
