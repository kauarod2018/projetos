import bpy, sys
argv = sys.argv[sys.argv.index('--') + 1:]
out, act, fr = argv[0], argv[1], int(argv[2])
sc = bpy.context.scene
bpy.data.objects['Avatar'].animation_data.action = bpy.data.actions[act]
sc.frame_set(fr)
sc.render.resolution_x, sc.render.resolution_y = 540, 960
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
