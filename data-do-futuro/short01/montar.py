"""Monta o Short 'Coisas que serão criadas até 2045' (1080x1920) a partir da voz,
dos tempos de cada palavra e dos vídeos do Pixabay. Uso: python3 montar.py [voz]"""
import json, subprocess, sys, os

VOZ = sys.argv[1] if len(sys.argv) > 1 else 'voz_antonio'
W, H, FPS = 1080, 1920, 30
os.makedirs('tmp', exist_ok=True)

# Segmentos: (palavra que abre o trecho, selo do topo, clipes)
SEG = [
    ('Coisas', 'ATÉ 2045', ['hook1', 'hook2']),
    ('Em 2026', '2026 – Chance alta', ['rob1', 'rob2']),
    ('Em 2028', '2028 – Chance alta', ['voa1', 'voa2']),
    ('No', '2028 – Chance média', ['vac1', 'vac2']),
    ('Em 2030', '2030 – Chance média', ['bat1', 'bat2']),
    ('Em 2032', '2032 – Chance média', ['ocu1', 'ocu2']),
    ('Em 2033', '2033 – Chance média', ['car1', 'car2']),
    ('Em 2035', '2035 – Chance média', ['tax1', 'tax2']),
    ('Em 2040', '2040 – Chance baixa', ['chi1', 'chi2']),
    ('E', '2045 – Chance baixa', ['fus1', 'fus2']),
    ('Qual', 'COMENTA O ANO!', ['cta1', 'hook1']),
]

words = json.load(open(VOZ + '.json'))
dur_audio = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                           '-of', 'csv=p=0', VOZ + '.mp3']).decode())
total = dur_audio + 0.6

# Início de cada segmento (procura as palavras-chave em ordem)
starts, i = [], 0
for key, _, _ in SEG:
    while i < len(words) and not (words[i]['w'] == key or words[i]['w'].startswith(key + ' ')):
        i += 1
    assert i < len(words), f'não achei {key}'
    starts.append((i, 0.0 if not starts else words[i]['t']))
    i += 1
bounds = [s[1] for s in starts] + [total]

# 1) Planos: um corte para cada assunto citado na fala (palavra-âncora -> vídeo)
SHOTS = [
    ('Coisas', 'hook1'), ('criadas', 'cta1'),
    ('Em 2026', 'rob1'), ('arrumam', 'rob2'), ('dobram', 'roupa'), ('20 mil', 'dolar'),
    ('Em 2028', 'voa2'), ('levando', 'aero'), ('Brasil', 'brasil'), ('fugindo', 'transito'),
    ('No', 'lab'), ('vacina', 'vac1'), ('câncer', 'medico'), ('sob', 'vac2'), ('tumor', 'car2'),
    ('Em 2030', 'bateria'), ('carregam', 'bat1'), ('elétrico', 'bat2'), ('10 minutos', 'relogio'),
    ('Em 2032', 'ocu1'), ('tela', 'ocu2'), ('substituir', 'celular'),
    ('Em 2033', 'car2'), ('laboratório', 'lab'), ('preço', 'car1'),
    ('Em 2035', 'tax1'), ('Brasil', 'sp'), ('Estados', 'eua'), ('500 mil', 'corridas'), ('semana', 'tax2'),
    ('Em 2040', 'chi1'), ('cérebro', 'chi2'), ('mandar', 'mensagem'), ('pensamento', 'pensar'),
    ('E', 'energia'), ('estrela', 'fus1'), ('fusão', 'fus2'),
    ('Qual', 'MONTAGEM'), ('Comenta', 'hook1'),
]
MONTAGEM = ['rob1', 'voa2', 'vac1', 'bat1', 'ocu1', 'car1', 'tax1', 'chi1', 'fus1']
cuts, i = [], 0
for key, clip in SHOTS:
    while i < len(words) and words[i]['w'] != key:
        i += 1
    assert i < len(words), f'âncora não encontrada: {key}'
    cuts.append((0.0 if not cuts else max(0, words[i]['t'] - 0.08), clip)); i += 1
cuts.append((total, None))

plan = []  # (clip, duração)
for (t0, clip), (t1, _) in zip(cuts, cuts[1:]):
    d = t1 - t0
    if clip == 'MONTAGEM':
        step = d / len(MONTAGEM)
        plan += [(c, step) for c in MONTAGEM]
    elif d > 4.0:  # nenhum plano passa de 4 s
        plan += [(clip, d / 2), (clip, d / 2)]
    else:
        plan.append((clip, d))

shots, uso = [], {}
for n, (clip, d) in enumerate(plan):
    ss = 0.3 + 2.2 * uso.get(clip, 0); uso[clip] = uso.get(clip, 0) + 1
    out = f'tmp/shot_{n:03d}.mp4'
    z = 0.12 if d > 1.2 else 0.06
    vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,"
          f"scale=w='trunc(iw*(1+{z}*t/{d:.3f})/2)*2':h=-2:eval=frame,"
          f"crop={W}:{H},setsar=1,fps={FPS},format=yuv420p")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-stream_loop', '5', '-ss', f'{ss:.2f}', '-i', f'media/{clip}.mp4',
                    '-t', f'{d:.3f}', '-vf', vf, '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', out],
                   check=True)
    shots.append(out)
print(len(plan), 'planos; maior', f"{max(d for _, d in plan):.2f}s", '; média', f"{sum(d for _, d in plan)/len(plan):.2f}s")
with open('tmp/lista.txt', 'w') as f:
    f.writelines(f"file '{os.path.basename(s)}'\n" for s in shots)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', 'tmp/lista.txt', '-c', 'copy', 'tmp/base.mp4'], check=True)

# 2) Legendas (ASS): selo no topo, crédito, legenda no meio em blocos de 2 a 3 palavras
def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'

ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Selo,Anton,104,&H0015CCFA,&H00FFFFFF,&H00000000,&H00000000,0,-1,0,0,100,100,1,0,1,7,3,8,40,40,170,1
Style: Credito,Anton,34,&H0015CCFA,&H00FFFFFF,&H00000000,&H00000000,0,-1,0,0,100,100,1,0,1,3,0,8,40,40,95,1
Style: Leg,Anton,112,&H0015CCFA,&H00FFFFFF,&H00000000,&HE6000000,0,0,0,0,100,100,1,0,3,14,0,5,80,80,0,1
Style: LegB,Anton,112,&H00FFFFFF,&H00FFFFFF,&H00000000,&HE6000000,0,0,0,0,100,100,1,0,3,14,0,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
for k, (_, selo, _) in enumerate(SEG):
    ass += f"Dialogue: 0,{ts(bounds[k])},{ts(bounds[k+1])},Selo,,0,0,0,,{selo}\n"
ass += f"Dialogue: 0,{ts(0)},{ts(total)},Credito,,0,0,0,,Imagens: Pixabay\n"

# blocos de legenda: até 3 palavras, quebra em pontuação e no início de cada segmento
import re
# marca as palavras que terminam frase ou vírgula, alinhando com o texto da narração
ntoks = re.findall(r"([\wÀ-ú%]+)([,.:!?]?)", open('narracao.txt').read())
fim, k = [], 0
for wd in words:
    n = len(wd['w'].split()); k += n
    fim.append(bool(ntoks[k - 1][1]) if k - 1 < len(ntoks) else False)
blocks, cur = [], []
for idx, wd in enumerate(words):
    if cur and len(' '.join(x['w'] for x in cur + [wd]).split()) > 3:
        blocks.append(cur); cur = []
    cur.append(wd)
    if fim[idx]:
        blocks.append(cur); cur = []
if cur: blocks.append(cur)
for n, b in enumerate(blocks):
    t0 = b[0]['t'] - 0.05
    t1 = blocks[n + 1][0]['t'] - 0.05 if n + 1 < len(blocks) else total
    txt = ' '.join(x['w'] for x in b).upper()
    style = 'Leg' if any(ch.isdigit() for ch in txt) else 'LegB'  # números em amarelo
    ass += f"Dialogue: 1,{ts(t0)},{ts(t1)},{style},,0,0,0,,{{\\fscx88\\fscy88\\t(0,90,\\fscx100\\fscy100)}}{txt}\n"
open('tmp/legendas.ass', 'w').write(ass)

# 3) Junta vídeo + legendas + voz
saida = f'coisas_criadas_ate_2045_{VOZ.split("_")[-1]}.mp4'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', 'tmp/base.mp4', '-i', VOZ + '.mp3',
                '-vf', "ass=tmp/legendas.ass:fontsdir=.",
                '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
                '-c:a', 'aac', '-b:a', '192k', '-af', 'apad', '-t', f'{total:.2f}', '-movflags', '+faststart', saida], check=True)
print('pronto:', saida, f'{total:.1f}s', len(blocks), 'legendas')
