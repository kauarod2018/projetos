"""
==============================================================================
 BLOCKY STORY KIT — PASSO 1: Setup de Cena, Câmera, Render e Iluminação
==============================================================================
Como usar:
  1. Abra o Blender (testado para a API 4.2+ e 5.x).
  2. Vá na aba "Scripting", clique em "New", cole este arquivo e aperte
     "Run Script" (ou Alt+P).
  3. Ajuste o bloco CONFIG abaixo e rode de novo quando quiser: o script é
     idempotente (recria apenas o que ele mesmo gerou, pelos nomes).

O que ele cria:
  - Coleções padronizadas do projeto (00_SETUP, 10_CHARACTERS, 20_SETS, ...)
  - Render (EEVEE ou Cycles), resolução Shorts (1080x1920) ou YouTube
    (1920x1080), 30 fps, saída MP4 H.264
  - Gerenciamento de cor AgX com look de alto contraste/saturação
  - Mundo: céu em degradê estilizado (procedural) OU HDRI, se existir o arquivo
  - Iluminação de 3 pontos (Key quente, Fill fria, Rim colorido) num rig
    que gira em volta do personagem
  - 3 câmeras com rig (Raiz -> Shake -> Câmera) prontas para o Passo 3:
    CAM_Wide, CAM_Medium, CAM_Close
  - Chão de teste e um boneco proxy blocado para conferir a luz
==============================================================================
"""

import bpy
import math
import os
from mathutils import Vector

# ==============================================================================
# CONFIG — mude aqui
# ==============================================================================
CONFIG = {
    # "SHORTS" = 1080x1920 (TikTok/Shorts/Reels) | "YOUTUBE" = 1920x1080
    "FORMAT": "SHORTS",
    # "EEVEE" = rápido (recomendado para o dia a dia) | "CYCLES" = mais bonito
    "ENGINE": "EEVEE",
    "FPS": 30,
    "FRAME_START": 1,
    "FRAME_END": 300,            # 10 s a 30 fps
    # Amostras: valores baixos = preview rápido; aumente para o render final
    "EEVEE_SAMPLES": 32,
    "CYCLES_SAMPLES": 96,
    "MOTION_BLUR": True,
    # Cor
    "VIEW_TRANSFORM": "AgX",
    # Tentados em ordem; o primeiro que existir na sua versão é usado
    "LOOKS": ["AgX - Punchy", "Punchy", "AgX - High Contrast",
              "AgX - Medium High Contrast", "None"],
    "EXPOSURE": 0.15,
    # HDRI opcional (caminho relativo ao .blend, "//" = pasta do .blend).
    # Se o arquivo não existir, o script usa o céu procedural.
    "HDRI_PATH": "//assets/hdri/stylized_sky.hdr",
    "HDRI_STRENGTH": 0.8,
    # Céu procedural (cores em RGB linear 0..1)
    "SKY_TOP": (0.10, 0.45, 1.00),
    "SKY_HORIZON": (0.65, 0.88, 1.00),
    "SKY_GROUND": (0.95, 0.85, 0.70),
    "WORLD_LIGHT_STRENGTH": 0.6,  # quanto o céu ilumina a cena
    # Altura de referência do personagem (m). Toda a escala do kit parte daqui.
    "CHARACTER_HEIGHT": 2.0,
    # Criar chão + boneco proxy para testar a luz
    "CREATE_TEST_PROPS": True,
    # Apagar o Cubo/Luz/Câmera padrão do Blender, se existirem
    "REMOVE_DEFAULT_OBJECTS": True,
}

# Prefixo que marca tudo que este script gerou (para poder recriar com segurança)
KIT_TAG = "bsk_generated"


# ==============================================================================
# UTILITÁRIOS
# ==============================================================================
def log(msg):
    print(f"[BlockyStoryKit] {msg}")


def get_or_create_collection(name, parent=None):
    """Retorna a coleção `name`, criando e linkando se necessário."""
    coll = bpy.data.collections.get(name)
    if coll is None:
        coll = bpy.data.collections.new(name)
    parent = parent or bpy.context.scene.collection
    if coll.name not in [c.name for c in parent.children]:
        parent.children.link(coll)
    return coll


def remove_object(name):
    obj = bpy.data.objects.get(name)
    if obj is not None:
        data = obj.data
        bpy.data.objects.remove(obj, do_unlink=True)
        # Remove o datablock órfão (luz/câmera/mesh) para não acumular lixo
        if data is not None and data.users == 0:
            for coll in (bpy.data.meshes, bpy.data.lights, bpy.data.cameras):
                if data.name in coll and coll[data.name] == data:
                    coll.remove(data)
                    break


def link_to(obj, coll):
    """Garante que o objeto esteja só na coleção `coll`."""
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)


def tag(obj):
    obj[KIT_TAG] = True
    return obj


def new_empty(name, coll, location=(0, 0, 0), display="PLAIN_AXES", size=0.5):
    remove_object(name)
    obj = bpy.data.objects.new(name, None)
    obj.empty_display_type = display
    obj.empty_display_size = size
    obj.location = location
    link_to(obj, coll)
    return tag(obj)


def set_enum_safely(struct, prop, candidates):
    """Tenta valores em ordem (os nomes de enum mudam entre versões)."""
    for value in candidates:
        try:
            setattr(struct, prop, value)
            return value
        except (TypeError, ValueError):
            continue
    return None


def make_material(name, color, roughness=0.5, emission=0.0):
    """Material Principled simples, cor sólida (estética 'plástico' blocado)."""
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*color, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        if emission > 0:
            # "Emission Color" (4.x+) / "Emission" (3.x)
            key = "Emission Color" if "Emission Color" in bsdf.inputs else "Emission"
            bsdf.inputs[key].default_value = (*color, 1.0)
            if "Emission Strength" in bsdf.inputs:
                bsdf.inputs["Emission Strength"].default_value = emission
    mat.diffuse_color = (*color, 1.0)  # cor no viewport em modo Solid
    return mat


# ==============================================================================
# 1. ESTRUTURA DE COLEÇÕES
# ==============================================================================
def setup_collections():
    names = {
        "setup": "00_SETUP",
        "cameras": "01_CAMERAS",
        "lights": "02_LIGHTS",
        "characters": "10_CHARACTERS",
        "sets": "20_SETS",
        "vfx": "30_VFX",
        "helpers": "90_HELPERS",
    }
    colls = {}
    colls["setup"] = get_or_create_collection(names["setup"])
    colls["cameras"] = get_or_create_collection(names["cameras"], colls["setup"])
    colls["lights"] = get_or_create_collection(names["lights"], colls["setup"])
    for key in ("characters", "sets", "vfx", "helpers"):
        colls[key] = get_or_create_collection(names[key])

    # Cores nas coleções do Outliner (organização visual)
    color_tags = {"setup": "COLOR_04", "characters": "COLOR_05",
                  "sets": "COLOR_03", "vfx": "COLOR_06", "helpers": "COLOR_07"}
    for key, ctag in color_tags.items():
        try:
            colls[key].color_tag = ctag
        except (AttributeError, TypeError):
            pass
    log("Coleções prontas.")
    return colls


def remove_default_objects():
    for name in ("Cube", "Light", "Camera"):
        obj = bpy.data.objects.get(name)
        # Só remove se NÃO foi criado pelo kit
        if obj is not None and KIT_TAG not in obj:
            remove_object(name)


# ==============================================================================
# 2. RENDER
# ==============================================================================
def setup_render(scene):
    r = scene.render

    # --- Motor -------------------------------------------------------------
    if CONFIG["ENGINE"].upper() == "CYCLES":
        r.engine = "CYCLES"
        cy = scene.cycles
        cy.samples = CONFIG["CYCLES_SAMPLES"]
        cy.use_adaptive_sampling = True
        cy.adaptive_threshold = 0.02
        cy.use_denoising = True
        # Menos bounces = mais rápido; visual cartoon não precisa de mais
        cy.max_bounces = 6
        cy.diffuse_bounces = 3
        cy.glossy_bounces = 2
        cy.transmission_bounces = 4
        cy.transparent_max_bounces = 8
        cy.caustics_reflective = False
        cy.caustics_refractive = False
        cy.blur_glossy = 1.0
        # Tenta usar a GPU (se configurada em Preferências > System)
        try:
            cy.device = "GPU"
        except TypeError:
            pass
    else:
        # 4.2–4.5 chamam "BLENDER_EEVEE_NEXT"; 5.x voltou a "BLENDER_EEVEE"
        engine = set_enum_safely(r, "engine",
                                 ["BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"])
        ee = scene.eevee
        if hasattr(ee, "taa_render_samples"):
            ee.taa_render_samples = CONFIG["EEVEE_SAMPLES"]
        if hasattr(ee, "taa_samples"):
            ee.taa_samples = 16  # viewport
        # Raytracing (reflexos/GI de tela) — dá acabamento "premium"
        if hasattr(ee, "use_raytracing"):
            ee.use_raytracing = True
        if hasattr(ee, "use_shadows"):
            ee.use_shadows = True
        if hasattr(ee, "shadow_ray_count"):
            ee.shadow_ray_count = 1
        if hasattr(ee, "shadow_step_count"):
            ee.shadow_step_count = 6
        # EEVEE legado (<4.2): AO + bloom ajudam no visual vibrante
        if hasattr(ee, "use_gtao"):
            ee.use_gtao = True
        if hasattr(ee, "use_bloom"):
            try:
                ee.use_bloom = True
                ee.bloom_intensity = 0.03
            except AttributeError:
                pass
        log(f"Motor: {engine}")

    # --- Resolução e tempo -------------------------------------------------
    if CONFIG["FORMAT"].upper() == "SHORTS":
        r.resolution_x, r.resolution_y = 1080, 1920
    else:
        r.resolution_x, r.resolution_y = 1920, 1080
    r.resolution_percentage = 100
    r.pixel_aspect_x = r.pixel_aspect_y = 1.0
    r.fps = CONFIG["FPS"]
    r.fps_base = 1.0
    scene.frame_start = CONFIG["FRAME_START"]
    scene.frame_end = CONFIG["FRAME_END"]

    # --- Motion blur (deixa movimentos rápidos/snappy mais "filmados") ----
    # 4.2+: render.use_motion_blur | antigo EEVEE: eevee.use_motion_blur
    if hasattr(r, "use_motion_blur"):
        r.use_motion_blur = CONFIG["MOTION_BLUR"]
        if hasattr(r, "motion_blur_shutter"):
            r.motion_blur_shutter = 0.5
    elif hasattr(scene.eevee, "use_motion_blur"):
        scene.eevee.use_motion_blur = CONFIG["MOTION_BLUR"]

    r.film_transparent = False
    r.use_stamp = False

    # --- Saída: MP4 H.264 -------------------------------------------------
    r.filepath = "//render/shot_"
    img = r.image_settings
    # 5.x exige media_type antes do formato; 4.x não tem esse campo
    if hasattr(img, "media_type"):
        try:
            img.media_type = "VIDEO"
        except (TypeError, ValueError):
            pass
    try:
        img.file_format = "FFMPEG"
        r.ffmpeg.format = "MPEG4"
        r.ffmpeg.codec = "H264"
        r.ffmpeg.constant_rate_factor = "HIGH"
        r.ffmpeg.ffmpeg_preset = "GOOD"
        r.ffmpeg.gopsize = CONFIG["FPS"]  # 1 keyframe por segundo
        r.ffmpeg.audio_codec = "AAC"      # para a narração no Passo 3+
        r.ffmpeg.audio_bitrate = 192
    except (TypeError, AttributeError) as e:
        log(f"Aviso: não consegui configurar FFMPEG ({e}); saída fica em PNG.")

    log(f"Render: {r.resolution_x}x{r.resolution_y} @ {r.fps} fps.")


# ==============================================================================
# 3. GERENCIAMENTO DE COR (AgX vibrante)
# ==============================================================================
def setup_color(scene):
    vs = scene.view_settings
    scene.display_settings.display_device = "sRGB"
    applied_vt = set_enum_safely(vs, "view_transform",
                                 [CONFIG["VIEW_TRANSFORM"], "AgX", "Filmic"])
    applied_look = set_enum_safely(vs, "look", CONFIG["LOOKS"])
    vs.exposure = CONFIG["EXPOSURE"]
    vs.gamma = 1.0
    log(f"Cor: {applied_vt} / look: {applied_look}")


# ==============================================================================
# 4. MUNDO (céu estilizado procedural OU HDRI)
# ==============================================================================
def setup_world(scene):
    world = bpy.data.worlds.get("WORLD_BlockyStory")
    if world is None:
        world = bpy.data.worlds.new("WORLD_BlockyStory")
    scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    N, L = nt.nodes, nt.links

    out = N.new("ShaderNodeOutputWorld"); out.location = (900, 0)

    # --- Céu em degradê (o que a CÂMERA vê) -------------------------------
    texco = N.new("ShaderNodeTexCoord"); texco.location = (-900, 200)
    sep = N.new("ShaderNodeSeparateXYZ"); sep.location = (-700, 200)
    ramp = N.new("ShaderNodeValToRGB"); ramp.location = (-500, 200)
    # Z do vetor de direção vai de -1 (chão) a +1 (topo); mapeamos para 0..1
    maprange = N.new("ShaderNodeMapRange"); maprange.location = (-600, 0)
    maprange.inputs["From Min"].default_value = -1.0
    maprange.inputs["From Max"].default_value = 1.0
    L.new(texco.outputs["Generated"], sep.inputs[0])
    L.new(sep.outputs["Z"], maprange.inputs["Value"])
    L.new(maprange.outputs["Result"], ramp.inputs["Fac"])

    cr = ramp.color_ramp
    cr.interpolation = "EASE"
    cr.elements[0].position = 0.45
    cr.elements[0].color = (*CONFIG["SKY_GROUND"], 1)
    cr.elements[1].position = 1.0
    cr.elements[1].color = (*CONFIG["SKY_TOP"], 1)
    mid = cr.elements.new(0.52)
    mid.color = (*CONFIG["SKY_HORIZON"], 1)

    bg_cam = N.new("ShaderNodeBackground"); bg_cam.location = (-200, 200)
    bg_cam.name = "BG_Camera"
    bg_cam.inputs["Strength"].default_value = 1.0
    L.new(ramp.outputs["Color"], bg_cam.inputs["Color"])

    # --- Luz ambiente (o que ILUMINA a cena) ------------------------------
    bg_light = N.new("ShaderNodeBackground"); bg_light.location = (-200, -150)
    bg_light.name = "BG_Lighting"

    hdri_abs = bpy.path.abspath(CONFIG["HDRI_PATH"])
    use_hdri = bool(bpy.data.filepath) and os.path.isfile(hdri_abs)
    if use_hdri:
        env = N.new("ShaderNodeTexEnvironment"); env.location = (-500, -200)
        env.image = bpy.data.images.load(hdri_abs, check_existing=True)
        mapping = N.new("ShaderNodeMapping"); mapping.location = (-700, -200)
        mapping.name = "HDRI_Rotation"  # gire em Z para mudar a direção do sol
        texco2 = N.new("ShaderNodeTexCoord"); texco2.location = (-900, -200)
        L.new(texco2.outputs["Generated"], mapping.inputs["Vector"])
        L.new(mapping.outputs["Vector"], env.inputs["Vector"])
        L.new(env.outputs["Color"], bg_light.inputs["Color"])
        bg_light.inputs["Strength"].default_value = CONFIG["HDRI_STRENGTH"]
        log(f"Mundo: HDRI carregado ({hdri_abs}).")
    else:
        # Sem HDRI: o próprio degradê ilumina, mais suave
        L.new(ramp.outputs["Color"], bg_light.inputs["Color"])
        bg_light.inputs["Strength"].default_value = CONFIG["WORLD_LIGHT_STRENGTH"]
        log("Mundo: céu procedural (nenhum HDRI encontrado — tudo bem).")

    # --- Mistura: câmera vê o degradê, a cena é iluminada pelo outro ------
    lp = N.new("ShaderNodeLightPath"); lp.location = (100, 300)
    mix = N.new("ShaderNodeMixShader"); mix.location = (600, 0)
    L.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    L.new(bg_light.outputs["Background"], mix.inputs[1])
    L.new(bg_cam.outputs["Background"], mix.inputs[2])
    L.new(mix.outputs["Shader"], out.inputs["Surface"])
    return world


# ==============================================================================
# 5. ILUMINAÇÃO DE 3 PONTOS (rig giratório)
# ==============================================================================
def new_light(name, ltype, coll, energy, color, location, size=1.0,
              parent=None, spot_size=None):
    remove_object(name)
    data = bpy.data.lights.new(name, type=ltype)
    data.energy = energy
    data.color = color
    if ltype == "AREA":
        data.shape = "DISK"
        data.size = size
    elif ltype in ("POINT", "SPOT"):
        data.shadow_soft_size = size
    if ltype == "SPOT" and spot_size:
        data.spot_size = math.radians(spot_size)
        data.spot_blend = 0.6
    obj = bpy.data.objects.new(name, data)
    obj.location = location
    link_to(obj, coll)
    if parent:
        obj.parent = parent
    return tag(obj)


def aim_at(obj, target):
    """Track To fixo para a luz/câmera sempre mirar no alvo."""
    for c in list(obj.constraints):
        if c.type == "TRACK_TO":
            obj.constraints.remove(c)
    c = obj.constraints.new("TRACK_TO")
    c.target = target
    c.track_axis = "TRACK_NEGATIVE_Z"
    c.up_axis = "UP_Y"
    return c


def setup_lights(colls):
    h = CONFIG["CHARACTER_HEIGHT"]
    coll = colls["lights"]

    # Raiz do rig: gire o Z deste empty para "orbitar" a luz ao redor da ação
    rig = new_empty("LGT_Rig_Root", coll, (0, 0, 0), "CIRCLE", 3.0)
    target = new_empty("LGT_Target", coll, (0, 0, h * 0.6), "SPHERE", 0.2)
    target.parent = rig

    # KEY — quente, forte, 45° frontal-lateral
    key = new_light("LGT_Key", "AREA", coll, energy=900,
                    color=(1.0, 0.92, 0.80), location=(3.5, -4.0, 4.5),
                    size=2.5, parent=rig)
    # FILL — fria, fraca, lado oposto (preenche as sombras sem matar o contraste)
    fill = new_light("LGT_Fill", "AREA", coll, energy=250,
                     color=(0.70, 0.82, 1.0), location=(-4.5, -3.0, 2.5),
                     size=4.0, parent=rig)
    # RIM — colorido e saturado, por trás: recorta a silhueta (look "viral")
    rim = new_light("LGT_Rim", "SPOT", coll, energy=1500,
                    color=(0.25, 0.85, 1.0), location=(-1.5, 4.5, 4.0),
                    size=0.3, parent=rig, spot_size=50)
    # KICKER — segundo contorno quente/magenta do outro lado (opcional)
    kick = new_light("LGT_Kicker", "SPOT", coll, energy=700,
                     color=(1.0, 0.35, 0.75), location=(3.0, 4.0, 2.0),
                     size=0.3, parent=rig, spot_size=45)

    for light in (key, fill, rim, kick):
        aim_at(light, target)

    log("Luzes: Key / Fill / Rim / Kicker prontas (gire 'LGT_Rig_Root').")


# ==============================================================================
# 6. CÂMERAS COM RIG (Raiz -> Shake -> Câmera)
# ==============================================================================
def make_camera_rig(name, coll, location, lens, target_z, focus_target=None):
    """
    Hierarquia:
      CAMRIG_<name>_Root   -> move/anima a câmera (dolly, travelling)
        CAMRIG_<name>_Shake -> recebe o tremor procedural no Passo 3
          CAM_<name>        -> a câmera em si (lens/zoom animável)
      CAMRIG_<name>_Aim     -> alvo para onde a câmera olha
    """
    root = new_empty(f"CAMRIG_{name}_Root", coll, location, "CUBE", 0.3)
    shake = new_empty(f"CAMRIG_{name}_Shake", coll, (0, 0, 0), "ARROWS", 0.25)
    shake.parent = root
    aim = new_empty(f"CAMRIG_{name}_Aim", coll, (0, 0, target_z), "SPHERE", 0.15)

    cam_name = f"CAM_{name}"
    remove_object(cam_name)
    cam_data = bpy.data.cameras.new(cam_name)
    cam_data.lens = lens
    cam_data.sensor_fit = "AUTO"
    cam_data.clip_start = 0.05
    cam_data.clip_end = 500
    cam_data.show_safe_areas = True          # mostra área segura (UI do TikTok)
    cam_data.show_composition_thirds = True  # regra dos terços
    cam_data.passepartout_alpha = 0.85
    # Profundidade de campo sutil: separa personagem do fundo
    cam_data.dof.use_dof = True
    cam_data.dof.aperture_fstop = 2.8 if lens >= 50 else 5.6
    cam_data.dof.focus_object = focus_target or aim

    cam = bpy.data.objects.new(cam_name, cam_data)
    link_to(cam, coll)
    cam.parent = shake
    tag(cam)
    aim_at(cam, aim)
    return cam


def setup_cameras(scene, colls):
    h = CONFIG["CHARACTER_HEIGHT"]
    coll = colls["cameras"]
    vertical = CONFIG["FORMAT"].upper() == "SHORTS"
    # No vertical, afastamos um pouco mais para caber o corpo inteiro
    k = 1.35 if vertical else 1.0

    wide = make_camera_rig("Wide", coll, (0, -9.0 * k, h * 0.9), 28, h * 0.5)
    medium = make_camera_rig("Medium", coll, (1.2, -5.0 * k, h * 0.85), 45, h * 0.7)
    close = make_camera_rig("Close", coll, (0.4, -2.6 * k, h * 0.92), 70, h * 0.85)

    scene.camera = medium
    log("Câmeras: CAM_Wide / CAM_Medium (ativa) / CAM_Close.")
    return wide, medium, close


# ==============================================================================
# 7. PROPS DE TESTE (chão + boneco proxy blocado)
# ==============================================================================
def add_box(name, coll, size, location, mat, parent=None, bevel=0.03):
    """Cubo com bevel leve — a 'cara' de peça blocada com cantos suaves."""
    remove_object(name)
    mesh = bpy.data.meshes.new(name)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    # Tamanho "assado" na malha (escala do objeto fica 1) para o bevel
    # ficar uniforme em todas as arestas
    bmesh.ops.scale(bm, vec=Vector(size), verts=bm.verts)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    link_to(obj, coll)
    mesh.materials.append(mat)
    if bevel > 0:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
    if parent:
        obj.parent = parent
    return tag(obj)


def setup_test_props(colls):
    h = CONFIG["CHARACTER_HEIGHT"]
    helpers = colls["helpers"]

    # Chão grande, cor clara e quente (não rouba atenção do personagem)
    remove_object("HELPER_Ground")
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    ground = bpy.context.active_object
    ground.name = "HELPER_Ground"
    ground.data.name = "HELPER_Ground"
    link_to(ground, helpers)
    ground.data.materials.append(make_material("MAT_Helper_Ground",
                                               (0.55, 0.80, 0.35), 0.8))
    tag(ground)

    # Boneco proxy proporções "R6 estilizado" (unidade = altura/5)
    u = h / 5.0
    skin = make_material("MAT_Helper_Skin", (1.0, 0.80, 0.20), 0.45)
    shirt = make_material("MAT_Helper_Shirt", (0.10, 0.45, 1.0), 0.5)
    pants = make_material("MAT_Helper_Pants", (0.15, 0.15, 0.20), 0.6)

    root = new_empty("HELPER_Proxy_Root", helpers, (0, 0, 0), "CIRCLE", 1.0)
    # Pernas: 2u de altura
    add_box("HELPER_Proxy_LegL", helpers, (u * 0.95, u * 0.95, u * 2.0),
            (-u * 0.5, 0, u * 1.0), pants, root)
    add_box("HELPER_Proxy_LegR", helpers, (u * 0.95, u * 0.95, u * 2.0),
            (u * 0.5, 0, u * 1.0), pants, root)
    # Tronco: 2u
    add_box("HELPER_Proxy_Torso", helpers, (u * 2.0, u * 1.0, u * 2.0),
            (0, 0, u * 3.0), shirt, root)
    # Braços: 2u
    add_box("HELPER_Proxy_ArmL", helpers, (u * 0.95, u * 0.95, u * 2.0),
            (-u * 1.5, 0, u * 3.0), skin, root)
    add_box("HELPER_Proxy_ArmR", helpers, (u * 0.95, u * 0.95, u * 2.0),
            (u * 1.5, 0, u * 3.0), skin, root)
    # Cabeça: 1u (um pouco maior = mais fofo/expressivo)
    add_box("HELPER_Proxy_Head", helpers, (u * 1.2, u * 1.2, u * 1.1),
            (0, 0, u * 4.6), skin, root, bevel=0.06)

    log("Props de teste criados em 90_HELPERS (desligue a coleção quando quiser).")


# ==============================================================================
# 8. AJUSTES DE VIEWPORT / TIMELINE
# ==============================================================================
def setup_viewport():
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == "VIEW_3D":
                for space in area.spaces:
                    if space.type == "VIEW_3D":
                        space.shading.type = "MATERIAL"
                        space.overlay.show_relationship_lines = False


def add_scene_markers(scene):
    """Marcador inicial: no Passo 3 os cortes de câmera serão marcadores."""
    if "SHOT_01" not in scene.timeline_markers:
        m = scene.timeline_markers.new("SHOT_01", frame=scene.frame_start)
        m.camera = scene.camera


# ==============================================================================
# EXECUÇÃO
# ==============================================================================
def main():
    scene = bpy.context.scene
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")

    if CONFIG["REMOVE_DEFAULT_OBJECTS"]:
        remove_default_objects()

    colls = setup_collections()
    setup_render(scene)
    setup_color(scene)
    setup_world(scene)
    setup_lights(colls)
    setup_cameras(scene, colls)
    if CONFIG["CREATE_TEST_PROPS"]:
        setup_test_props(colls)
    add_scene_markers(scene)
    try:
        setup_viewport()
    except Exception:  # rodando em background (sem UI): ignora
        pass

    scene.frame_set(scene.frame_start)
    log("PASSO 1 concluído. Aperte Numpad 0 para ver pela câmera "
        "e F12 para um render de teste.")
    if not bpy.data.filepath:
        log("Dica: salve o .blend (Ctrl+S) para os caminhos '//' "
            "(HDRI, render) funcionarem.")


main()
