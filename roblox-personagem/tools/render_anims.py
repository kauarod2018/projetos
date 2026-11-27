# Renderiza cada animação (Eevee) em frames PNG: <pasta>/<acao>_####.png
import bpy, sys, os
argv = sys.argv[sys.argv.index('--') + 1:]
out = argv[0]; acts = argv[1].split(',')
sc = bpy.context.scene; arm = bpy.data.objects['Avatar']
sc.render.resolution_x, sc.render.resolution_y = 540, 960
sc.eevee.taa_render_samples = 16
for name in acts:
    a = bpy.data.actions[name]; arm.animation_data.action = a
    n = int(a.frame_range[1])
    reps = max(1, 60 // n) if name in ('Andar', 'Correr', 'Dancar') else 1
    k = 0
    for r in range(reps):
        for f in range(0, n):
            sc.frame_set(f)
            # rosto: aplica as ações de shape key da mesma animação
            for ob in ('Olhos', 'Boca'):
                sk = bpy.data.objects[ob].data.shape_keys
                sk.animation_data.action = bpy.data.actions.get(f'{name}_{ob}')
            sc.frame_set(f)
            sc.render.filepath = os.path.join(out, f'{name}_{k:04d}.png'); k += 1
            bpy.ops.render.render(write_still=True)
