import bpy, sys
argv = sys.argv[sys.argv.index('--') + 1:]
act = argv[0] if argv else 'Andar'; fr = float(argv[1]) if len(argv) > 1 else 0.3
def setup():
    for win in bpy.context.window_manager.windows:
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                for sp in area.spaces:
                    if sp.type == 'VIEW_3D':
                        sp.shading.type = 'MATERIAL'; sp.region_3d.view_perspective = 'CAMERA'
    arm = bpy.data.objects['Avatar']
    a = bpy.data.actions[act]; arm.animation_data.action = a
    sc = bpy.context.scene; sc.frame_start = 0; sc.frame_end = int(a.frame_range[1]); sc.frame_set(int(sc.frame_end * fr))
    bpy.context.view_layer.objects.active = arm; arm.select_set(True)
    return None
bpy.app.timers.register(setup, first_interval=1.5)
