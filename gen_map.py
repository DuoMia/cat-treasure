"""
生成 map.jpg：房间俯视图（手绘风格）
标注5个便利贴位置：
  note1 - 桌子旁 (53%, 65%)
  note2 - 照片墙旁 (14%, 20%)
  note3 - 沙发角落 (15%, 65%)
  note4 - 书架旁 (75%, 35%)
  note5 - 阳台/窗户边 (35%, 20%)
"""

from PIL import Image, ImageDraw, ImageFont
import math

W, H = 600, 500

# ── 底色：泛黄的纸张感 ────────────────────────────────────────
img = Image.new('RGB', (W, H), (245, 235, 210))
draw = ImageDraw.Draw(img)

# 纸张纹理：细微噪点
import random
random.seed(42)
for _ in range(3000):
    x = random.randint(0, W-1)
    y = random.randint(0, H-1)
    v = random.randint(-8, 8)
    px = img.getpixel((x, y))
    img.putpixel((x, y), (
        max(0, min(255, px[0] + v)),
        max(0, min(255, px[1] + v)),
        max(0, min(255, px[2] + v))
    ))
draw = ImageDraw.Draw(img)

# ── 颜色定义 ─────────────────────────────────────────────────
INK = (60, 40, 20)          # 墨水色（主线条）
INK_LIGHT = (120, 90, 60)   # 浅墨（次要线条）
WALL_FILL = (220, 205, 175) # 墙体填充
FLOOR_FILL = (235, 220, 195)# 地板
FURNITURE = (180, 155, 115) # 家具填充
FURNITURE_DARK = (140, 110, 75) # 家具阴影
NOTE_COLOR = (255, 230, 80) # 便利贴黄色
NOTE_BORDER = (200, 160, 20)

# ── 房间边界（留边距） ────────────────────────────────────────
MARGIN = 40
RX1, RY1 = MARGIN, MARGIN
RX2, RY2 = W - MARGIN, H - MARGIN
RW = RX2 - RX1
RH = RY2 - RY1

def rx(pct): return int(RX1 + RW * pct)
def ry(pct): return int(RY1 + RH * pct)

# 地板
draw.rectangle([RX1, RY1, RX2, RY2], fill=FLOOR_FILL)

# 地板木纹线（横向）
for i in range(0, RH, 18):
    y = RY1 + i
    draw.line([(RX1+2, y), (RX2-2, y)], fill=(215, 200, 175), width=1)

# 墙体（厚度12px）
WALL = 12
draw.rectangle([RX1, RY1, RX2, RY1+WALL], fill=WALL_FILL)  # 上墙
draw.rectangle([RX1, RY2-WALL, RX2, RY2], fill=WALL_FILL)  # 下墙
draw.rectangle([RX1, RY1, RX1+WALL, RY2], fill=WALL_FILL)  # 左墙
draw.rectangle([RX2-WALL, RY1, RX2, RY2], fill=WALL_FILL)  # 右墙

# 墙体外框
draw.rectangle([RX1, RY1, RX2, RY2], outline=INK, width=3)

# ── 门（左墙，y=45%~75%） ─────────────────────────────────────
door_y1 = ry(0.42)
door_y2 = ry(0.72)
# 门洞（白色覆盖左墙）
draw.rectangle([RX1-2, door_y1, RX1+WALL+2, door_y2], fill=FLOOR_FILL)
# 门弧线（开门方向）
draw.arc([RX1+WALL, door_y1, RX1+WALL+(door_y2-door_y1), door_y2],
         start=90, end=180, fill=INK_LIGHT, width=1)
# 门板
draw.line([(RX1+WALL, door_y1), (RX1+WALL, door_y2)], fill=INK, width=2)
draw.line([(RX1+WALL, door_y1), (RX1+WALL+(door_y2-door_y1), door_y1)], fill=INK, width=1)
# 标注
draw.text((RX1+WALL+4, (door_y1+door_y2)//2 - 6), '门', fill=INK, font=None)

# ── 窗户（上墙，x=35%~60%） ──────────────────────────────────
win_x1 = rx(0.35)
win_x2 = rx(0.60)
draw.rectangle([win_x1, RY1-2, win_x2, RY1+WALL+2], fill=(200, 230, 245))
draw.rectangle([win_x1, RY1, win_x2, RY1+WALL], outline=INK, width=2)
mid_win = (win_x1 + win_x2) // 2
draw.line([(mid_win, RY1), (mid_win, RY1+WALL)], fill=INK, width=1)
draw.text((win_x1 + 4, RY1 + WALL + 4), '窗', fill=INK)

# ── 阳台（上墙外，窗户延伸） ─────────────────────────────────
balcony_depth = 28
draw.rectangle([win_x1-4, RY1-balcony_depth, win_x2+4, RY1],
               fill=(210, 225, 200), outline=INK_LIGHT, width=1)
draw.text((win_x1 + 6, RY1 - balcony_depth + 6), '阳台', fill=INK_LIGHT)

# ── 辅助函数：手绘风格矩形（轻微抖动） ───────────────────────
def sketchy_rect(d, x1, y1, x2, y2, fill=None, outline=INK, width=2, label=None):
    if fill:
        d.rectangle([x1+1, y1+1, x2-1, y2-1], fill=fill)
    # 四条边各自轻微偏移，模拟手绘
    jitter = 1
    d.line([(x1+jitter, y1), (x2-jitter, y1+jitter)], fill=outline, width=width)
    d.line([(x2, y1+jitter), (x2-jitter, y2-jitter)], fill=outline, width=width)
    d.line([(x2-jitter, y2), (x1+jitter, y2-jitter)], fill=outline, width=width)
    d.line([(x1, y2-jitter), (x1+jitter, y1+jitter)], fill=outline, width=width)
    if label:
        cx = (x1 + x2) // 2
        cy = (y1 + y2) // 2
        # 估算文字宽度（每个字约8px）
        tw = len(label) * 8
        d.text((cx - tw//2, cy - 6), label, fill=INK)

# ── 沙发（左下，x=15%~45%, y=65%~85%） ──────────────────────
sx1, sy1 = rx(0.13), ry(0.63)
sx2, sy2 = rx(0.46), ry(0.86)
sketchy_rect(draw, sx1, sy1, sx2, sy2, fill=FURNITURE, label='沙发')
# 沙发靠背（上边加厚）
draw.rectangle([sx1, sy1, sx2, sy1+14], fill=FURNITURE_DARK)
draw.line([(sx1, sy1+14), (sx2, sy1+14)], fill=INK, width=1)
# 沙发扶手
draw.rectangle([sx1, sy1+14, sx1+10, sy2], fill=FURNITURE_DARK)
draw.rectangle([sx2-10, sy1+14, sx2, sy2], fill=FURNITURE_DARK)

# ── 桌子（右下，x=55%~80%, y=65%~85%） ──────────────────────
tx1, ty1 = rx(0.54), ry(0.63)
tx2, ty2 = rx(0.80), ry(0.86)
sketchy_rect(draw, tx1, ty1, tx2, ty2, fill=FURNITURE, label='桌子')
# 桌腿（四角小圆）
for cx, cy in [(tx1+6, ty1+6), (tx2-6, ty1+6), (tx1+6, ty2-6), (tx2-6, ty2-6)]:
    draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill=FURNITURE_DARK, outline=INK, width=1)

# ── 书架（右侧，x=75%~87%, y=30%~65%） ──────────────────────
bx1, by1 = rx(0.74), ry(0.28)
bx2, by2 = rx(0.87), ry(0.66)
sketchy_rect(draw, bx1, by1, bx2, by2, fill=FURNITURE, label='书架')
# 书架格子线
for i in range(1, 4):
    yy = by1 + (by2 - by1) * i // 4
    draw.line([(bx1+2, yy), (bx2-2, yy)], fill=INK_LIGHT, width=1)

# ── 照片墙（左上，x=14%~32%, y=18%~48%） ────────────────────
px1, py1 = rx(0.13), ry(0.16)
px2, py2 = rx(0.32), ry(0.50)
sketchy_rect(draw, px1, py1, px2, py2, fill=(200, 185, 160), label='照片墙')
# 小相框
for fi, (fx, fy, fw, fh) in enumerate([
    (px1+6, py1+8, 22, 16),
    (px1+32, py1+8, 18, 14),
    (px1+6, py1+28, 18, 14),
    (px1+28, py1+26, 22, 16),
]):
    draw.rectangle([fx, fy, fx+fw, fy+fh], fill=(230, 215, 190), outline=INK_LIGHT, width=1)

# ── 抽屉（中间，x=52%~60%, y=48%~58%） ──────────────────────
dx1, dy1 = rx(0.51), ry(0.46)
dx2, dy2 = rx(0.60), ry(0.58)
sketchy_rect(draw, dx1, dy1, dx2, dy2, fill=FURNITURE, label='抽屉')
# 抽屉把手
mid_d = (dx1 + dx2) // 2
draw.ellipse([mid_d-4, dy1+6, mid_d+4, dy1+12], fill=INK_LIGHT, outline=INK, width=1)

# ── 食盆（左下角，x=3%~11%, y=76%~84%） ─────────────────────
fx1, fy1 = rx(0.03), ry(0.74)
fx2, fy2 = rx(0.11), ry(0.86)
draw.ellipse([fx1, fy1, fx2, fy2], fill=(200, 185, 160), outline=INK, width=2)
draw.text((fx1+2, fy1+8), '食盆', fill=INK)

# ── 时钟（右上，x=88%~98%, y=22%~37%） ──────────────────────
ccx, ccy = rx(0.93), ry(0.29)
cr = 16
draw.ellipse([ccx-cr, ccy-cr, ccx+cr, ccy+cr], fill=(220, 205, 175), outline=INK, width=2)
draw.text((ccx-12, ccy+cr+2), '时钟', fill=INK)

# ── 画（右上，x=60%~68%, y=16%~38%） ────────────────────────
paix1, paiy1 = rx(0.59), ry(0.14)
paix2, paiy2 = rx(0.68), ry(0.40)
sketchy_rect(draw, paix1, paiy1, paix2, paiy2, fill=(195, 175, 145), label='画')

# ── 玩具箱（右下，x=82%~92%, y=74%~82%） ────────────────────
tbx1, tby1 = rx(0.81), ry(0.72)
tbx2, tby2 = rx(0.92), ry(0.84)
sketchy_rect(draw, tbx1, tby1, tbx2, tby2, fill=FURNITURE, label='玩具箱')

# ── 猫玩具（右下，x=60%~75%, y=80%~90%） ────────────────────
draw.text((rx(0.60), ry(0.82)), '🐟🔔⚽', fill=INK)

# ════════════════════════════════════════════════════════════
# ── 便利贴标注 ───────────────────────────────────────────────
# ════════════════════════════════════════════════════════════

NOTES = [
    # (id, x%, y%, 标签)
    ('①', 0.53, 0.65, '桌子旁'),
    ('②', 0.14, 0.20, '照片墙旁'),
    ('③', 0.15, 0.75, '沙发角落'),
    ('④', 0.75, 0.35, '书架旁'),
    ('⑤', 0.48, 0.10, '窗台边'),
]

for num, xp, yp, lbl in NOTES:
    nx = rx(xp)
    ny = ry(yp)
    # 便利贴小方块（带折角）
    nw, nh = 28, 26
    draw.polygon([
        (nx, ny), (nx+nw-6, ny), (nx+nw, ny+6),
        (nx+nw, ny+nh), (nx, ny+nh)
    ], fill=NOTE_COLOR, outline=NOTE_BORDER)
    # 折角
    draw.polygon([(nx+nw-6, ny), (nx+nw, ny+6), (nx+nw-6, ny+6)],
                 fill=(220, 190, 50), outline=NOTE_BORDER)
    # 编号
    draw.text((nx+8, ny+6), num, fill=(100, 70, 10))
    # 引线 + 标签
    draw.line([(nx+nw, ny+nh//2), (nx+nw+12, ny+nh//2)], fill=NOTE_BORDER, width=1)
    draw.text((nx+nw+14, ny+nh//2-6), lbl, fill=INK_LIGHT)

# ── 标题 ─────────────────────────────────────────────────────
draw.text((RX1+4, RY2+6), '朵朵的房间', fill=INK_LIGHT)

# ── 指北针（右下角） ─────────────────────────────────────────
cx, cy = W - 28, H - 28
draw.polygon([(cx, cy-14), (cx-6, cy+6), (cx, cy+2), (cx+6, cy+6)],
             fill=INK, outline=INK)
draw.text((cx-3, cy-26), 'N', fill=INK)

# ── 边框装饰线 ───────────────────────────────────────────────
draw.rectangle([4, 4, W-4, H-4], outline=INK_LIGHT, width=1)
draw.rectangle([8, 8, W-8, H-8], outline=INK_LIGHT, width=1)

# ── 保存 ─────────────────────────────────────────────────────
img.save('D:/cat-treasure/map.jpg', 'JPEG', quality=92)
print('map.jpg saved', img.size)
