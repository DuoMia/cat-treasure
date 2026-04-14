"""
生成 photo_wall.jpg (800×600)
三张猫咪照片 + 木质背景 + 年份文字
"""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 800, 600

# ── 背景（深棕木纹）────────────────────────────────────────────
img = Image.new('RGB', (W, H), (45, 28, 12))
draw = ImageDraw.Draw(img)

# 竖向木纹
import random
rng = random.Random(7)
for x in range(0, W, rng.randint(8, 18)):
    c = rng.randint(38, 55)
    draw.line([(x, 0), (x, H)], fill=(c, int(c*0.6), int(c*0.25)), width=rng.randint(1, 3))

# ── 照片参数 ───────────────────────────────────────────────────
PHOTOS = [
    {'file': '2021cat.jpg', 'year': '2021', 'cx': 155},
    {'file': '2024cat.jpg', 'year': '2024', 'cx': 400},
    {'file': '2026cat.jpg', 'year': '2026', 'cx': 645},
]

FRAME_W = 175
FRAME_H = 310
FRAME_TOP = 60
PHOTO_MARGIN = 10  # 相框内边距
YEAR_Y = FRAME_TOP + FRAME_H + 22

FRAME_COLOR = (160, 110, 65)
FRAME_INNER = (120, 80, 40)

script_dir = os.path.dirname(os.path.abspath(__file__))

for p in PHOTOS:
    cx = p['cx']
    fx1 = cx - FRAME_W // 2
    fx2 = cx + FRAME_W // 2
    fy1 = FRAME_TOP
    fy2 = FRAME_TOP + FRAME_H

    # 相框外边
    draw.rectangle([fx1, fy1, fx2, fy2], fill=FRAME_COLOR)
    # 相框内边（阴影感）
    draw.rectangle([fx1+6, fy1+6, fx2-6, fy2-6], fill=FRAME_INNER)

    # 贴入照片
    photo_path = os.path.join(script_dir, p['file'])
    if os.path.exists(photo_path):
        photo = Image.open(photo_path).convert('RGB')
        pw = fx2 - fx1 - PHOTO_MARGIN * 2 - 12
        ph = fy2 - fy1 - PHOTO_MARGIN * 2 - 12
        # 保持比例裁剪填满
        src_ratio = photo.width / photo.height
        dst_ratio = pw / ph
        if src_ratio > dst_ratio:
            new_h = photo.height
            new_w = int(photo.height * dst_ratio)
            left = (photo.width - new_w) // 2
            photo = photo.crop((left, 0, left + new_w, new_h))
        else:
            new_w = photo.width
            new_h = int(photo.width / dst_ratio)
            top = (photo.height - new_h) // 2
            photo = photo.crop((0, top, new_w, top + new_h))
        photo = photo.resize((pw, ph), Image.LANCZOS)
        px = fx1 + PHOTO_MARGIN + 6
        py = fy1 + PHOTO_MARGIN + 6
        img.paste(photo, (px, py))

    # 年份文字
    try:
        font = ImageFont.truetype('C:/Windows/Fonts/msyh.ttc', 28)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), p['year'], font=font)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw // 2, YEAR_Y), p['year'], fill=(200, 170, 120), font=font)

# ── 暗角 ──────────────────────────────────────────────────────
from PIL import Image as PILImage
vignette = PILImage.new('RGBA', (W, H), (0, 0, 0, 0))
v_pix = vignette.load()
margin = 100
for y in range(H):
    for x in range(W):
        ax = max(0, margin - x, x - (W - margin)) / margin
        ay = max(0, margin - y, y - (H - margin)) / margin
        a = min(1.0, ax + ay)
        v_pix[x, y] = (0, 0, 0, int(a * 140))
img = img.convert('RGBA')
img = PILImage.alpha_composite(img, vignette)
img = img.convert('RGB')

out = os.path.join(script_dir, 'photo_wall.jpg')
img.save(out, 'JPEG', quality=92)
print(f'saved {out}', img.size)
