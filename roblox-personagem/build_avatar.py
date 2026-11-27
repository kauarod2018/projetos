# Monta um avatar em blocos (proporções R6: tronco 2x2x1, braços e pernas 1x2x1, cabeça cilíndrica)
# com esqueleto, rosto em geometria (olhos que piscam, boca com shape key) e 6 animações.
# Uso: blender -b --python build_avatar.py -- <saida.blend> <saida.glb>
import bpy, math, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT_BLEND = argv[0] if argv else 'avatar.blend'
OUT_GLB = argv[1] if len(argv) > 1 else 'avatar.glb'

S = 0.65            # 1 "stud" em metros -> altura total ~3.4 (igual ao kit)
FPS = 30

# ---------------- cores (troque aqui) ----------------
COL = {
    'pele':   (1.00, 0.80, 0.42),   # amarelo clássico de bloco
    'camisa': (0.95, 0.28, 0.22),   # moletom vermelho
    'bolso':  (0.80, 0.20, 0.16),
    'calca':  (0.16, 0.32, 0.72),   # calça azul
    'tenis':  (0.12, 0.12, 0.14),
    'cabelo': (0.24, 0.14, 0.07),
    'rosto':  (0.04, 0.04, 0.05),
    'chao':   (0.42, 0.45, 0.48),
    'linha':  (0.33, 0.36, 0.39),
}

# ---------------- cena limpa ----------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scn = bpy.context.scene
scn.render.fps = FPS
scn.unit_settings.system = 'METRIC'

def srgb_to_lin(c):
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

MATS = {}
def mat(name, rough=0.55):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*srgb_to_lin(COL[name]), 1)
    b.inputs['Roughness'].default_value = rough
    m.diffuse_color = (*srgb_to_lin(COL[name]), 1)
    MATS[name] = m
    return m

def block(name, size, loc, material, bevel=0.06, segs=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        md = o.modifiers.new('Bevel', 'BEVEL'); md.width = bevel; md.segments = segs; md.limit_method = 'NONE'
    o.data.materials.append(mat(material))
    bpy.ops.object.shade_smooth()
    o.data.use_auto_smooth = True; o.data.auto_smooth_angle = math.radians(40)
    return o

def apply_mods(o):
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)

parts = {}

# ---------------- corpo ----------------
# pernas: x = ±0.5 stud, z 0..2
for side, sx in (('L', 1), ('R', -1)):
    leg = block(f'Perna.{side}', (0.98 * S, 0.98 * S, 1.72 * S), (sx * 0.5 * S, 0, 0.28 * S + 0.86 * S), 'calca')
    shoe = block(f'Tenis.{side}', (1.0 * S, 1.08 * S, 0.30 * S), (sx * 0.5 * S, 0.04 * S, 0.15 * S), 'tenis', bevel=0.05)
    apply_mods(leg); apply_mods(shoe)
    bpy.ops.object.select_all(action='DESELECT'); leg.select_set(True); shoe.select_set(True)
    bpy.context.view_layer.objects.active = leg; bpy.ops.object.join()
    parts[f'Perna.{side}'] = leg

# tronco 2x2x1, z 2..4
torso = block('Tronco', (2 * S, 1 * S, 2 * S), (0, 0, 3 * S), 'camisa', bevel=0.07)
pocket = block('Bolso', (1.2 * S, 0.06 * S, 0.5 * S), (0, -0.5 * S, 2.45 * S), 'bolso', bevel=0.02)
hood = block('Capuz', (1.6 * S, 0.55 * S, 0.32 * S), (0, 0.28 * S, 4.05 * S), 'camisa', bevel=0.06)
for o in (torso, pocket, hood): apply_mods(o)
bpy.ops.object.select_all(action='DESELECT')
for o in (torso, pocket, hood): o.select_set(True)
bpy.context.view_layer.objects.active = torso; bpy.ops.object.join()
parts['Tronco'] = torso

# braços 1x2x1, x = ±1.5 (manga + mão em cor de pele)
for side, sx in (('L', 1), ('R', -1)):
    arm = block(f'Braco.{side}', (0.98 * S, 0.98 * S, 1.45 * S), (sx * 1.5 * S, 0, 3.27 * S), 'camisa')
    hand = block(f'Mao.{side}', (0.94 * S, 0.94 * S, 0.55 * S), (sx * 1.5 * S, 0, 2.28 * S), 'pele')
    apply_mods(arm); apply_mods(hand)
    bpy.ops.object.select_all(action='DESELECT'); arm.select_set(True); hand.select_set(True)
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.join()
    parts[f'Braco.{side}'] = arm

# cabeça cilíndrica (marca registrada do estilo), z 4..5.2
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.66 * S, depth=1.2 * S, location=(0, 0, 4.62 * S))
head = bpy.context.object; head.name = 'Cabeca'
md = head.modifiers.new('Bevel', 'BEVEL'); md.width = 0.2 * S; md.segments = 6; md.limit_method = 'ANGLE'
head.data.materials.append(mat('pele'))
bpy.ops.object.shade_smooth(); head.data.use_auto_smooth = True; head.data.auto_smooth_angle = math.radians(50)
apply_mods(head)
# pescoço curto que some dentro do tronco
neck = block('Pescoco', (0.7 * S, 0.7 * S, 0.3 * S), (0, 0, 4.02 * S), 'pele', bevel=0.03)
apply_mods(neck)

# cabelo em blocos (acessório)
hair_pieces = []
hair_pieces.append(block('Cab.topo', (1.44 * S, 1.44 * S, 0.34 * S), (0, 0.03 * S, 5.18 * S), 'cabelo', bevel=0.08))
hair_pieces.append(block('Cab.tras', (1.44 * S, 0.42 * S, 0.9 * S), (0, 0.52 * S, 4.82 * S), 'cabelo', bevel=0.07))
for i in range(4):
    x = (-0.5 + i * 0.333) * S
    p = block(f'Cab.franja{i}', (0.36 * S, 0.34 * S, 0.30 * S - abs(i - 1.5) * 0.04 * S), (x, -0.5 * S, 5.0 * S + abs(i - 1.5) * 0.02 * S), 'cabelo', bevel=0.05)
    hair_pieces.append(p)
for p in hair_pieces: apply_mods(p)
bpy.ops.object.select_all(action='DESELECT')
for p in hair_pieces: p.select_set(True)
bpy.context.view_layer.objects.active = hair_pieces[0]; bpy.ops.object.join()
hair = hair_pieces[0]; hair.name = 'Cabelo'

# ---------------- rosto (geometria) ----------------
FACE_Y = -0.66 * S - 0.004   # frente da cabeça (-Y é a frente no Blender)
def eye(name, x):
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.085 * S, depth=0.02, location=(x, FACE_Y, 4.72 * S), rotation=(math.pi / 2, 0, 0))
    e = bpy.context.object; e.name = name; e.scale = (1, 1.55, 1)  # oval vertical
    bpy.ops.object.transform_apply(scale=True)
    e.data.materials.append(mat('rosto', 0.3))
    # brilho
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.03 * S, depth=0.01, location=(x + 0.025 * S, FACE_Y - 0.012, 4.78 * S), rotation=(math.pi / 2, 0, 0))
    g = bpy.context.object; g.data.materials.append(bpy.data.materials.get('brilho') or bpy.data.materials.new('brilho'))
    gm = g.data.materials[0]; gm.diffuse_color = (1, 1, 1, 1); gm.use_nodes = True
    gm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (1, 1, 1, 1)
    bpy.ops.object.select_all(action='DESELECT'); e.select_set(True); g.select_set(True)
    bpy.context.view_layer.objects.active = e; bpy.ops.object.join()
    # shape key de piscar: achata em Z em volta do centro
    e.shape_key_add(name='Basis')
    k = e.shape_key_add(name='Piscar')
    for v in k.data:
        v.co.z = 4.72 * S + (v.co.z - 4.72 * S) * 0.12
    return e
eyeL = eye('Olho.L', 0.2 * S)
eyeR = eye('Olho.R', -0.2 * S)
eyes = eyeL
bpy.ops.object.select_all(action='DESELECT'); eyeL.select_set(True); eyeR.select_set(True)
bpy.context.view_layer.objects.active = eyeL; bpy.ops.object.join(); eyes.name = 'Olhos'

# boca: sorriso feito de um arco (tubo achatado) com shape key "Aberta"
bpy.ops.mesh.primitive_circle_add(vertices=32, radius=0.24 * S, fill_type='NOTHING', location=(0, 0, 0))
arc = bpy.context.object
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.object.mode_set(mode='OBJECT')
me = arc.data
# monta faixa: arco de baixo (sorriso) entre 200° e 340°
import bmesh
bm = bmesh.new()
N = 20
top, bot = [], []
for i in range(N + 1):
    a = math.radians(205 + 130 * i / N)
    r1, r2 = 0.26 * S, 0.20 * S
    top.append(bm.verts.new((math.cos(a) * r1, 0, math.sin(a) * r1 * 0.75)))
    bot.append(bm.verts.new((math.cos(a) * r2, 0, math.sin(a) * r2 * 0.75 + 0.012)))
for i in range(N):
    bm.faces.new((top[i], top[i + 1], bot[i + 1], bot[i]))
bm.to_mesh(me); bm.free()
arc.name = 'Boca'
arc.location = (0, FACE_Y, 4.56 * S)
arc.data.materials.append(mat('rosto', 0.3))
arc.shape_key_add(name='Basis')
ko = arc.shape_key_add(name='Aberta')
for i, v in enumerate(ko.data):
    # a borda interna (bot) sobe, virando um "D" deitado de boca aberta
    if i % 2 == 1 or i >= N + 1:
        pass
for i in range(N + 1, 2 * (N + 1)):
    v = ko.data[i]
    v.co.z = 0.04 * S + v.co.z * 0.15
    v.co.x *= 0.9

# ---------------- esqueleto ----------------
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
arm_obj = bpy.context.object; arm_obj.name = 'Avatar'
amt = arm_obj.data; amt.name = 'AvatarRig'
eb = amt.edit_bones
root = eb[0]; root.name = 'Raiz'; root.head = (0, 0, 0); root.tail = (0, 0.6 * S, 0)
def bone(name, h, t, parent):
    b = eb.new(name); b.head = h; b.tail = t; b.parent = eb[parent]; b.roll = 0; return b
bone('Quadril', (0, 0, 2 * S), (0, 0, 2.6 * S), 'Raiz')
bone('Tronco', (0, 0, 2 * S), (0, 0, 4 * S), 'Quadril')
bone('Cabeca', (0, 0, 4 * S), (0, 0, 5.2 * S), 'Tronco')
bone('Braco.L', (1.5 * S, 0, 3.5 * S), (1.5 * S, 0, 2.0 * S), 'Tronco')
bone('Braco.R', (-1.5 * S, 0, 3.5 * S), (-1.5 * S, 0, 2.0 * S), 'Tronco')
bone('Perna.L', (0.5 * S, 0, 2 * S), (0.5 * S, 0, 0), 'Quadril')
bone('Perna.R', (-0.5 * S, 0, 2 * S), (-0.5 * S, 0, 0), 'Quadril')
for b in eb:
    if b.name.startswith(('Braco', 'Perna')):
        b.roll = 0
bpy.ops.object.mode_set(mode='OBJECT')

def bind(obj, bone_name):
    # peça rígida presa no osso (como um boneco R6)
    mw = obj.matrix_world.copy()
    obj.parent = arm_obj; obj.parent_type = 'BONE'; obj.parent_bone = bone_name
    bpy.context.view_layer.update()
    obj.matrix_world = mw

bind(parts['Tronco'], 'Tronco')
bind(neck, 'Cabeca'); bind(head, 'Cabeca'); bind(hair, 'Cabeca'); bind(eyes, 'Cabeca'); bind(arc, 'Boca' if False else 'Cabeca')
for s in 'LR':
    bind(parts[f'Braco.{s}'], f'Braco.{s}')
    bind(parts[f'Perna.{s}'], f'Perna.{s}')

# ---------------- animações ----------------
pb = arm_obj.pose.bones
for p in pb: p.rotation_mode = 'XYZ'
arm_obj.animation_data_create()

def clear_pose():
    for p in pb:
        p.rotation_euler = (0, 0, 0); p.location = (0, 0, 0)

def key(frame, **rot):
    """rot: nome_osso=(x,y,z) em radianos; 'loc_Quadril'=(x,y,z) para subir/descer o corpo."""
    for k, v in rot.items():
        if k.startswith('loc_'):
            p = pb[k[4:].replace('_', '.')]; p.location = v; p.keyframe_insert('location', frame=frame)
        else:
            p = pb[k.replace('_', '.')]; p.rotation_euler = v; p.keyframe_insert('rotation_euler', frame=frame)

# Nos ossos dos braços/pernas (apontando para baixo), girar em X positivo leva o membro para a FRENTE? Testado:
# osso aponta -Z, eixo X local = +X do mundo; rotação +X leva a ponta para -Y = frente.
FW = 1  # sinal "para frente"

def shape_action(obj, name, keys):
    """keys: lista de (frame, {shape: valor})"""
    sk = obj.data.shape_keys
    sk.animation_data_create()
    act = bpy.data.actions.new(f'{name}_{obj.name}')
    sk.animation_data.action = act
    for f, vals in keys:
        for sname, val in vals.items():
            kb = sk.key_blocks[sname]; kb.value = val; kb.keyframe_insert('value', frame=f)
    sk.animation_data.action = None
    return act

ACTIONS = []
def new_action(name, length, build, loop=True, blink=True, talk=None):
    clear_pose()
    act = bpy.data.actions.new(name)
    arm_obj.animation_data.action = act
    for p in pb:  # todos os ossos com chave no frame 0 (evita pose "presa" de outra animação)
        p.keyframe_insert('rotation_euler', frame=0); p.keyframe_insert('location', frame=0)
    build()
    act.use_fake_user = True
    if loop:
        for fc in act.fcurves:
            fc.modifiers.new('CYCLES')
    arm_obj.animation_data.action = None
    # rosto da mesma animação
    face = []
    bk = []
    if blink:
        for f0 in range(0, length, 75):
            b0 = f0 + 40
            if b0 + 6 < length:
                bk += [(b0, {'Piscar': 0}), (b0 + 3, {'Piscar': 1}), (b0 + 6, {'Piscar': 0})]
    if not bk: bk = [(0, {'Piscar': 0})]
    face.append((eyes, shape_action(eyes, name, bk)))
    mk = talk or [(0, {'Aberta': 0}), (length, {'Aberta': 0})]
    face.append((arc, shape_action(arc, name, mk)))
    ACTIONS.append((name, act, length, face))

z = (0, 0, 0)
def idle():
    for f, k in ((0, 0), (30, 1), (60, 0)):
        a = 0.05 * k
        key(f, Braco_L=(0, 0, 0.04 + a * 0.4), Braco_R=(0, 0, -0.04 - a * 0.4), Tronco=(-0.015 * k, 0, 0),
            Cabeca=(0.03 * k, 0.04 * math.sin(k * 2), 0), loc_Quadril=(0, 0, -0.015 * k), Perna_L=z, Perna_R=z)

def walk():
    A = 0.62
    for f, s in ((0, 1), (15, -1), (30, 1)):
        key(f, Braco_L=(-A * s, 0, 0.03), Braco_R=(A * s, 0, -0.03), Perna_L=(A * s, 0, 0), Perna_R=(-A * s, 0, 0),
            Cabeca=(0, 0.03 * s, 0), Tronco=(0, 0.025 * s, 0))
    for f in (0, 7.5, 15, 22.5, 30):
        bob = 0.0 if f in (0, 15, 30) else 0.06 * S
        pb['Quadril'].location = (0, 0, bob); pb['Quadril'].keyframe_insert('location', frame=f)

def run():
    A = 1.05
    for f, s in ((0, 1), (10, -1), (20, 1)):
        key(f, Braco_L=(-A * s, 0, 0.05), Braco_R=(A * s, 0, -0.05), Perna_L=(A * s * 0.95, 0, 0), Perna_R=(-A * s * 0.95, 0, 0),
            Tronco=(0.16, 0.05 * s, 0), Cabeca=(-0.12, 0, 0))
    for f in (0, 5, 10, 15, 20):
        bob = 0.0 if f in (0, 10, 20) else 0.12 * S
        pb['Quadril'].location = (0, 0, bob); pb['Quadril'].keyframe_insert('location', frame=f)

def wave():
    # braço direito sobe pela lateral e acena
    key(0, Braco_R=(0, 0, -0.04), Braco_L=(0, 0, 0.04), Cabeca=z, Tronco=z)
    key(8, Braco_R=(0, 0, -2.75), Cabeca=(0, 0, -0.12), Tronco=(0, 0, 0.04))
    for i, f in enumerate(range(14, 50, 6)):
        key(f, Braco_R=(0, 0, -2.45 if i % 2 == 0 else -3.0))
    key(56, Braco_R=(0, 0, -2.75), Cabeca=(0, 0, -0.12))
    key(66, Braco_R=(0, 0, -0.04), Cabeca=z, Tronco=z)

def jump():
    # agacha, pula com os braços para cima (pose clássica de pulo), cai
    key(0, loc_Quadril=z, Braco_L=(0, 0, 0.04), Braco_R=(0, 0, -0.04), Perna_L=z, Perna_R=z)
    key(6, loc_Quadril=(0, 0, -0.18 * S), Braco_L=(0.3, 0, 0.1), Braco_R=(0.3, 0, -0.1), Perna_L=(-0.2, 0, 0), Perna_R=(-0.2, 0, 0))
    key(14, loc_Quadril=(0, 0, 1.6 * S), Braco_L=(-3.0, 0, 0.12), Braco_R=(-3.0, 0, -0.12), Perna_L=(0.35, 0, 0), Perna_R=(-0.15, 0, 0))
    key(22, loc_Quadril=(0, 0, 1.9 * S))
    key(30, loc_Quadril=(0, 0, 0.1 * S), Braco_L=(-2.6, 0, 0.3), Braco_R=(-2.6, 0, -0.3), Perna_L=z, Perna_R=z)
    key(34, loc_Quadril=(0, 0, -0.14 * S), Braco_L=(0.2, 0, 0.2), Braco_R=(0.2, 0, -0.2))
    key(44, loc_Quadril=z, Braco_L=(0, 0, 0.04), Braco_R=(0, 0, -0.04))
    for p in pb:
        for fc in arm_obj.animation_data.action.fcurves:
            pass

def talk_body():
    # fala gesticulando (para narração / co-star)
    for f, k in ((0, 0), (20, 1), (40, -1), (60, 1), (80, 0)):
        key(f, Cabeca=(0.06 * abs(k), 0.12 * k, 0.04 * k), Braco_L=(-0.55 - 0.2 * k, 0, 0.35), Braco_R=(-0.55 + 0.2 * k, 0, -0.35),
            Tronco=(0, 0.05 * k, 0), loc_Quadril=(0, 0, 0.02 * S * abs(k)), Perna_L=z, Perna_R=z)

def dance():
    for f, s in ((0, 1), (10, -1), (20, 1), (30, -1), (40, 1)):
        key(f, Braco_L=(0, 0, 0.3 + 1.6 * (s > 0)), Braco_R=(0, 0, -0.3 - 1.6 * (s < 0)), Tronco=(0, 0, 0.12 * s),
            Cabeca=(0, 0, -0.18 * s), Perna_L=(0, 0, 0.12 * (s > 0)), Perna_R=(0, 0, -0.12 * (s < 0)),
            loc_Quadril=(0.15 * S * s, 0, 0))
    for f in range(5, 40, 10):
        pb['Quadril'].location = (0, 0, -0.12 * S); pb['Quadril'].keyframe_insert('location', frame=f)

talk_mouth = []
pat = [0, .9, .3, 1, .2, .8, .1, .95, .4, .7, 0, .85, .3, 1, .5, 0]
for i, v in enumerate(pat): talk_mouth.append((i * 5, {'Aberta': v}))
talk_mouth.append((80, {'Aberta': 0}))

new_action('Parado', 60, idle)
new_action('Andar', 30, walk)
new_action('Correr', 20, run)
new_action('Acenar', 66, wave, loop=False)
new_action('Pular', 44, jump, loop=False)
new_action('Falar', 80, talk_body, talk=talk_mouth)
new_action('Dancar', 40, dance)

# NLA: uma faixa por animação (o exportador glTF vira cada faixa em uma animação nomeada)
for name, act, length, face in ACTIONS:
    tr = arm_obj.animation_data.nla_tracks.new(); tr.name = name
    st = tr.strips.new(name, 1, act); st.action_frame_end = length; tr.mute = True
    for obj, fa in face:
        sk = obj.data.shape_keys
        t2 = sk.animation_data.nla_tracks.new(); t2.name = name
        t2.strips.new(name, 1, fa); t2.mute = True

# ---------------- cenário de visualização ----------------
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0))
ground = bpy.context.object; ground.name = 'Chao'
gm = bpy.data.materials.new('chao'); gm.use_nodes = True
nt = gm.node_tree; bsdf = nt.nodes['Principled BSDF']
chk = nt.nodes.new('ShaderNodeTexChecker'); chk.inputs['Scale'].default_value = 40 / (4 * S) * 1.0
chk.inputs['Color1'].default_value = (*srgb_to_lin(COL['chao']), 1); chk.inputs['Color2'].default_value = (*srgb_to_lin(COL['linha']), 1)
nt.links.new(chk.outputs['Color'], bsdf.inputs['Base Color']); bsdf.inputs['Roughness'].default_value = 0.8
gm.diffuse_color = (*srgb_to_lin(COL['chao']), 1)
ground.data.materials.append(gm)

world = bpy.data.worlds.new('Ceu'); scn.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.45, 0.68, 0.95, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9

bpy.ops.object.light_add(type='SUN', location=(4, -6, 10))
sun = bpy.context.object; sun.name = 'Sol'; sun.data.energy = 3.2; sun.rotation_euler = (math.radians(50), 0, math.radians(30))
bpy.ops.object.light_add(type='AREA', location=(-4, 3, 5))
rim = bpy.context.object; rim.name = 'Contraluz'; rim.data.energy = 300; rim.data.size = 4
rim.rotation_euler = (math.radians(-55), 0, math.radians(-145))

bpy.ops.object.camera_add(location=(4.3, -7.2, 3.1))
cam = bpy.context.object; cam.name = 'Camera'; scn.camera = cam
cam.data.lens = 50
tgt = bpy.data.objects.new('AlvoCamera', None); tgt.location = (0, 0, 1.75); scn.collection.objects.link(tgt)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'

# mostra "Andar" ativo ao abrir o arquivo
arm_obj.animation_data.action = bpy.data.actions['Andar']
scn.frame_start = 0; scn.frame_end = 29
scn.render.engine = 'BLENDER_EEVEE'
scn.eevee.use_soft_shadows = True
scn.view_settings.view_transform = 'Standard'
scn.render.resolution_x = 1080; scn.render.resolution_y = 1920

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

# ---------------- exporta GLB (para o three.js / kit) ----------------
arm_obj.animation_data.action = None
for o in bpy.data.objects:
    o.select_set(o.name not in ('Chao', 'Sol', 'Contraluz', 'Camera', 'AlvoCamera'))
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True,
                          export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_morph=True, export_apply=True, export_yup=True)
print('OK', OUT_BLEND, OUT_GLB)
