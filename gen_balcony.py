"""
重新生成 balcony.jpg，完全复刻原图风格
砖块符号放在最下方砖格（y≈722），几何图形风格
"""
from PIL import Image, ImageDraw
import math

W, H = 1200, 800
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

# ── 天空渐变（日落粉橙，从上到下）──────────────────────
SKY_H = 430
sky_colors = [
    (0,   (254, 179, 121)),
    (100, (243, 168, 129)),
    (200, (232, 155, 139)),
    (380, (210, 155, 130)),
    (430, (195, 158, 118)),
]
def lerp_color(y):
    for i in range(len(sky_colors)-1):
        y0, c0 = sky_colors[i]
        y1, c1 = sky_colors[i+1]
        if y0 <= y <= y1:
            t = (y - y0) / (y1 - y0)
            return tuple(int(c0[j] + (c1[j]-c0[j])*t) for j in range(3))
    return sky_colors[-1][1]

for y in range(SKY_H):
    draw.line([(0, y), (W, y)], fill=lerp_color(y))

# ── 远山 ─────────────────────────────────────────────────
MC = (192, 158, 112)
mountains = [
    [(0, 395), (140, 255), (310, 395)],
    [(190, 395), (410, 210), (640, 395)],
    [(490, 395), (680, 255), (870, 395)],
    [(740, 395), (950, 225), (1110, 395)],
    [(940, 395), (1100, 265), (1200, 395)],
]
for pts in mountains:
    draw.polygon(pts, fill=MC)

# ── 地板 ─────────────────────────────────────────────────
FLOOR_Y   = 435
FLOOR_COL = (138, 126, 102)
FLOOR_SEA = (120, 108, 86)
draw.rectangle([0, FLOOR_Y, W, H], fill=FLOOR_COL)

# 横向砖缝
BRICK_H = 83  # 砖高
for y in range(FLOOR_Y, H, BRICK_H):
    draw.line([(0, y), (W, y)], fill=FLOOR_SEA, width=2)
# 纵向砖缝（交错）
BRICK_W = 160
for row, y0 in enumerate(range(FLOOR_Y, H, BRICK_H)):
    offset = BRICK_W // 2 if row % 2 == 1 else 0
    for x in range(-BRICK_W + offset, W + BRICK_W, BRICK_W):
        draw.line([(x, y0), (x, y0 + BRICK_H)], fill=FLOOR_SEA, width=2)

# ── 栅栏 ─────────────────────────────────────────────────
FY1, FY2 = 398, 468
FDARK = (100, 70, 44)
FFILL = (231, 199, 138)

draw.rectangle([0, FY1, W, FY2], fill=FFILL)
draw.rectangle([0, FY1, W, FY1 + 16], fill=FDARK)
draw.rectangle([0, FY2 - 16, W, FY2], fill=FDARK)
for x in range(0, W, 54):
    draw.rectangle([x, FY1, x + 5, FY2], fill=FDARK)

# ── 树（栅栏后）──────────────────────────────────────────
TTRUNK = (91, 63, 42)
TLEAF  = (55, 120, 50)
for tx in [90, 200, 1000, 1110]:
    draw.rectangle([tx - 8, FY1 - 65, tx + 8, FY1], fill=TTRUNK)
    draw.ellipse([tx - 42, FY1 - 170, tx + 42, FY1 - 62], fill=TLEAF)

# ── 爪印 ─────────────────────────────────────────────────
PAW = (105, 90, 65)
paws = [
    (215,482),(268,472),(322,482),(376,472),
    (440,482),(502,472),(572,482),(642,472),
    (712,482),(782,472),(852,482),(912,472),
    (972,482),(1032,472),
]
for px, py in paws:
    draw.ellipse([px-11, py-9, px+11, py+9], fill=PAW)
    for dx, dy in [(-9,-13),(-3,-15),(3,-15),(9,-13)]:
        draw.ellipse([px+dx-4, py+dy-4, px+dx+4, py+dy+4], fill=PAW)

# ── 花盆 ─────────────────────────────────────────────────
PCOL  = (176, 95, 48)
PDARK = (130, 62, 28)
PSOIL = (65, 40, 20)

def pot(cx, py, pw=112, ph=82):
    draw.polygon([
        (cx-pw//2, py),(cx+pw//2, py),
        (cx+pw//2-14, py+ph),(cx-pw//2+14, py+ph),
    ], fill=PCOL, outline=PDARK)
    draw.ellipse([cx-pw//2-6, py-9, cx+pw//2+6, py+9], fill=PCOL, outline=PDARK)
    draw.ellipse([cx-pw//2+6, py-5, cx+pw//2-6, py+5], fill=PSOIL)

# ── 仙人掌 ───────────────────────────────────────────────
CC  = (74, 139, 49)
CD  = (50, 108, 32)
cx  = 120
pot(cx, 592)
draw.rectangle([cx-18, FLOOR_Y, cx+18, 597], fill=CC, outline=CD)
draw.rectangle([cx-58, 472, cx-18, 492], fill=CC, outline=CD)
draw.rectangle([cx-68, FLOOR_Y+5, cx-46, 492], fill=CC, outline=CD)
draw.rectangle([cx+18, 502, cx+58, 522], fill=CC, outline=CD)
draw.rectangle([cx+46, FLOOR_Y+25, cx+68, 522], fill=CC, outline=CD)
for sy in range(448, 592, 26):
    draw.line([(cx-18, sy),(cx-27, sy-7)], fill=CD, width=2)
    draw.line([(cx+18, sy),(cx+27, sy-7)], fill=CD, width=2)

# ── 向日葵 ───────────────────────────────────────────────
sx = 560
pot(sx, 622)
draw.rectangle([sx-8, 482, sx+8, 627], fill=(75, 130, 38))
draw.ellipse([sx-48, 542, sx-6, 574], fill=(62, 138, 44))
draw.ellipse([sx+6, 558, sx+48, 590], fill=(62, 138, 44))
PETAL = (218, 172, 28)
for i in range(12):
    a = math.radians(i*30)
    ex = sx + int(math.cos(a)*54)
    ey = 462 + int(math.sin(a)*54)
    draw.ellipse([ex-19, ey-13, ex+19, ey+13], fill=PETAL)
draw.ellipse([sx-34, 428, sx+34, 496], fill=(62, 32, 10))
draw.ellipse([sx-25, 437, sx+25, 487], fill=(85, 52, 18))

# ── 绿植 ─────────────────────────────────────────────────
bx = 1020
pot(bx, 612)
BU = (58, 139, 47)
draw.ellipse([bx-58, 492, bx+58, 617], fill=BU)
draw.ellipse([bx-74, 512, bx+8,  604], fill=BU)
draw.ellipse([bx+8,  512, bx+78, 604], fill=BU)
draw.ellipse([bx-42, 482, bx+42, 544], fill=BU)

# ── 猫咪 ─────────────────────────────────────────────────
CAT  = (195, 168, 118)
CATD = (158, 132, 88)
CATP = (228, 158, 158)
cx_cat, cy_cat = 270, 510

draw.ellipse([cx_cat-40, cy_cat-22, cx_cat+40, cy_cat+58], fill=CAT)
draw.ellipse([cx_cat-34, cy_cat-72, cx_cat+34, cy_cat+6],  fill=CAT)
draw.polygon([(cx_cat-30,cy_cat-64),(cx_cat-44,cy_cat-92),(cx_cat-14,cy_cat-70)], fill=CAT)
draw.polygon([(cx_cat+30,cy_cat-64),(cx_cat+44,cy_cat-92),(cx_cat+14,cy_cat-70)], fill=CAT)
draw.polygon([(cx_cat-28,cy_cat-66),(cx_cat-40,cy_cat-88),(cx_cat-16,cy_cat-70)], fill=CATP)
draw.polygon([(cx_cat+28,cy_cat-66),(cx_cat+40,cy_cat-88),(cx_cat+16,cy_cat-70)], fill=CATP)
draw.ellipse([cx_cat-19,cy_cat-50,cx_cat-7, cy_cat-38], fill=(55,40,22))
draw.ellipse([cx_cat+7, cy_cat-50,cx_cat+19,cy_cat-38], fill=(55,40,22))
draw.polygon([(cx_cat,cy_cat-30),(cx_cat-5,cy_cat-24),(cx_cat+5,cy_cat-24)], fill=CATP)
for dx in [-1,1]:
    draw.line([(cx_cat+dx*5,cy_cat-26),(cx_cat+dx*30,cy_cat-22)], fill=CATD, width=1)
    draw.line([(cx_cat+dx*5,cy_cat-24),(cx_cat+dx*28,cy_cat-28)], fill=CATD, width=1)
draw.arc([cx_cat+22,cy_cat+12,cx_cat+82,cy_cat+72], start=180, end=360, fill=CAT, width=10)

# ── 砖块谜题符号（最下方砖格，y中心≈722）────────────────
# 砖格: FLOOR_Y=435, BRICK_H=83 → 行: 435,518,601,684,767
# 第4行格子中心 y = 684 + 83//2 = 725
SYM_Y = 725
SYM_C = (105, 95, 75)   # 比地板深，低调

# x 对应 data.js BRICK_POSITIONS: 21% 36% 52% 68%
sxs = [int(W * p) for p in [0.21, 0.36, 0.52, 0.68]]

# 1. 月牙 moon
cx = sxs[0]
draw.ellipse([cx-17, SYM_Y-17, cx+17, SYM_Y+17], fill=SYM_C)
draw.ellipse([cx-5,  SYM_Y-17, cx+27, SYM_Y+17], fill=FLOOR_COL)

# 2. 太阳 sun
cx = sxs[1]
draw.ellipse([cx-11, SYM_Y-11, cx+11, SYM_Y+11], fill=SYM_C)
for i in range(8):
    a = math.radians(i*45)
    draw.line([
        (cx+int(math.cos(a)*14), SYM_Y+int(math.sin(a)*14)),
        (cx+int(math.cos(a)*22), SYM_Y+int(math.sin(a)*22)),
    ], fill=SYM_C, width=3)

# 3. 波浪 wave
cx = sxs[2]
for i in range(3):
    ox = cx - 21 + i*15
    draw.arc([ox,   SYM_Y-11, ox+14, SYM_Y+1],  start=0,   end=180, fill=SYM_C, width=3)
    draw.arc([ox+7, SYM_Y-1,  ox+21, SYM_Y+11], start=180, end=360, fill=SYM_C, width=3)

# 4. 星星 star
cx = sxs[3]
pts = []
for i in range(10):
    a = math.radians(i*36 - 90)
    r = 17 if i%2==0 else 7
    pts.append((cx+int(math.cos(a)*r), SYM_Y+int(math.sin(a)*r)))
draw.polygon(pts, fill=SYM_C)

img.save('balcony.jpg', quality=95)
print('done')
