"""Gera um fundo de estrelas 1920x1080 (PNG) para ficar atrás das cenas do Blender."""
import sys
import numpy as np
from PIL import Image, ImageFilter

rng = np.random.default_rng(42)
W, H = 1920, 1080
img = np.zeros((H, W, 3), np.float32)
img[:] = (2, 4, 10)
n = 2600
xs, ys = rng.integers(0, W, n), rng.integers(0, H, n)
brilho = rng.power(6, n) * 255  # poucas estrelas fortes, muitas fracas
tons = rng.choice([(1, 1, 1), (0.8, 0.88, 1), (1, 0.93, 0.8)], n)
for x, y, b, t in zip(xs, ys, brilho, tons):
    img[y, x] = np.minimum(255, img[y, x] + b * np.array(t))
base = Image.fromarray(img.astype(np.uint8))
brilho_suave = base.filter(ImageFilter.GaussianBlur(1.2))
final = Image.blend(base, brilho_suave, 0.5)
final.save(sys.argv[1])
