# Abre o .blend com interface, mostra viewport em Material Preview e tira prints da tela do Blender.
# blender avatar.blend --python tools/gui_shot.py -- <pasta_saida> <acao1,acao2,...>
import bpy, sys, os
argv = sys.argv[sys.argv.index('--') + 1:]
OUT = argv[0]; ACTS = argv[1].split(',')
state = {'i': 0, 'step': 0}
def setup():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                for sp in area.spaces:
                    if sp.type == 'VIEW_3D':
                        sp.shading.type = 'MATERIAL'
                        r = sp.region_3d
                        r.view_perspective = 'CAMERA'
                        sp.overlay.show_bones = True
    arm = bpy.data.objects['Avatar']
    bpy.context.view_layer.objects.active = arm
def tick():
    sc = bpy.context.scene
    arm = bpy.data.objects['Avatar']
    if state['step'] == 0:
        setup(); state['step'] = 1; return 1.0
    i = state['i']
    if i >= len(ACTS):
        bpy.ops.wm.quit_blender(); return None
    name = ACTS[i]
    act = bpy.data.actions[name]
    arm.animation_data.action = act
    fr = int(act.frame_range[1] * 0.3)
    sc.frame_end = int(act.frame_range[1])
    sc.frame_set(fr)
    def snap():
        win = bpy.context.window_manager.windows[0]
        with bpy.context.temp_override(window=win):
            bpy.ops.screen.screenshot(filepath=os.path.join(OUT, f'blender_{name}.png'))
    bpy.app.timers.register(lambda: (snap(), None)[1], first_interval=1.5)
    state['i'] += 1
    return 3.0
bpy.app.timers.register(tick, first_interval=2.0)
