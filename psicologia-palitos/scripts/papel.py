"""Gera o fundo de papel de caderno do canal.

Uso: python3 scripts/papel.py horizontal|vertical saida.png
"""
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

formato, saida = sys.argv[1], sys.argv[2]
W, H = (1920, 1080) if formato == "horizontal" else (1080, 1920)
rng = np.random.default_rng(3)

base = np.zeros((H, W, 3), np.float32)
base[:] = (243, 235, 221)  # creme
# variação suave de tom (manchas grandes) + grão fino
manchas = rng.normal(0, 1, (H // 60 + 2, W // 60 + 2))
manchas = np.array(Image.fromarray(((manchas + 3) * 40).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32)
base += ((manchas - 120) / 120.0)[..., None] * 5
base += rng.normal(0, 3.2, (H, W, 1))
# fibras do papel
fibras = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(fibras)
for _ in range(900):
    x, y = rng.integers(0, W), rng.integers(0, H)
    ang = rng.uniform(0, np.pi)
    comp = rng.uniform(6, 22)
    d.line([(x, y), (x + comp * np.cos(ang), y + comp * np.sin(ang))], fill=int(rng.uniform(10, 26)), width=1)
fibras = np.array(fibras.filter(ImageFilter.GaussianBlur(0.6)), np.float32)
base -= fibras[..., None] * 0.35
img = Image.fromarray(base.clip(0, 255).astype(np.uint8))

# pautas azuis bem claras e margem vermelha
d = ImageDraw.Draw(img, "RGBA")
passo = 54
for y in range(passo * 2, H, passo):
    d.line([(0, y), (W, y)], fill=(120, 160, 200, 34), width=2)
margem = 150 if formato == "horizontal" else 90
d.line([(margem, 0), (margem, H)], fill=(214, 92, 92, 120), width=3)
d.line([(margem + 6, 0), (margem + 6, H)], fill=(214, 92, 92, 60), width=2)

# vinheta leve
yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
vin = 1 - 0.10 * np.clip(r - 0.55, 0, 1)
arr = np.array(img, np.float32) * vin[..., None]
Image.fromarray(arr.clip(0, 255).astype(np.uint8)).save(saida)
print(saida)
