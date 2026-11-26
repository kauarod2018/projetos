import glob, sys
from PIL import Image
fs = sorted(glob.glob('build/preview/*.jpg'), key=lambda f: float(f.split('/t')[-1][:-4]))
cols = int(sys.argv[1]) if len(sys.argv) > 1 else 7
W, H = 300, 533; rows = (len(fs) + cols - 1) // cols
im = Image.new('RGB', (W * cols, H * rows))
for i, f in enumerate(fs): im.paste(Image.open(f).resize((W, H)), ((i % cols) * W, (i // cols) * H))
im.save('build/sheet.jpg', quality=88)
