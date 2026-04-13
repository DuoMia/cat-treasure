"""
生成 bookshelf.jpg (1200×800)
书架场景：多层书架 + 第三层中央放一个音乐盒
音乐盒三个按钮精确对应热区坐标：
  左按钮 (B/2022): x=37%, y=70%
  中按钮 (C/2024): x=48%, y=70%
  右按钮 (A/2026): x=59%, y=70%
"""

from PIL import Image, ImageDraw, ImageFilter
import math, random

W, H = 1200, 800
rng = random.Random(42)

img = Image.new('RGB', (W, H), (30, 16, 6))
draw = ImageDraw.Draw(img)

# ── 背景墙 ────────────────────────────────────────────────────
for y in range(H):
    t = y / H
    r = int(28 + (18 - 28) * t)
    g = int(14 + (8  - 14) * t)
    b = int(5  + (2  -  5) * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ── 书架整体框架（缩窄，居中，留两侧空间）────────────────────
SHELF_LEFT   = 160
SHELF_RIGHT  = W - 160
SHELF_TOP    = 50
SHELF_BOTTOM = H - 50
SHELF_W = SHELF_RIGHT - SHELF_LEFT

# 书架背板
draw.rectangle([SHELF_LEFT, SHELF_TOP, SHELF_RIGHT, SHELF_BOTTOM],
               fill=(38, 20, 8))

# 书架侧板
for x in [SHELF_LEFT, SHELF_RIGHT - 22]:
    draw.rectangle([x, SHELF_TOP, x + 22, SHELF_BOTTOM], fill=(62, 34, 12))
    # 木纹
    for i in range(0, SHELF_BOTTOM - SHELF_TOP, 18):
        draw.line([(x+3, SHELF_TOP+i), (x+19, SHELF_TOP+i+6)],
                  fill=(52, 28, 10), width=1)

# 顶板 / 底板
draw.rectangle([SHELF_LEFT, SHELF_TOP, SHELF_RIGHT, SHELF_TOP + 24], fill=(68, 38, 14))
draw.rectangle([SHELF_LEFT, SHELF_BOTTOM - 24, SHELF_RIGHT, SHELF_BOTTOM], fill=(68, 38, 14))

# 5层隔板 y 坐标
shelf_ys = [
    SHELF_TOP + 24,          # 顶板下沿
    SHELF_TOP + 24 + 148,    # 第1层底 y=196
    SHELF_TOP + 24 + 296,    # 第2层底 y=344
    SHELF_TOP + 24 + 444,    # 第3层底 y=492  ← 音乐盒在这层
    SHELF_TOP + 24 + 592,    # 第4层底 y=640
    SHELF_BOTTOM - 24,       # 底板上沿
]

def draw_shelf_board(y):
    draw.rectangle([SHELF_LEFT + 22, y, SHELF_RIGHT - 22, y + 20], fill=(72, 40, 14))
    draw.line([(SHELF_LEFT+22, y), (SHELF_RIGHT-22, y)], fill=(88, 52, 18), width=2)
    draw.line([(SHELF_LEFT+22, y+20), (SHELF_RIGHT-22, y+20)], fill=(42, 22, 6), width=2)

for y in shelf_ys[1:]:
    draw_shelf_board(y)

# ── 书本颜色表 ────────────────────────────────────────────────
BOOK_COLORS = [
    (180, 60, 40),   # 红
    (40, 80, 160),   # 蓝
    (160, 140, 50),  # 黄
    (50, 120, 60),   # 绿
    (130, 50, 140),  # 紫
    (180, 100, 40),  # 橙
    (60, 130, 140),  # 青
    (140, 80, 60),   # 棕
    (100, 60, 150),  # 深紫
    (50, 100, 80),   # 墨绿
]

def draw_books_in_shelf(shelf_idx, skip_range=None):
    """在指定层绘制书本，skip_range=(x1,x2) 跳过该区域"""
    y_top = shelf_ys[shelf_idx] + 4
    y_bot = shelf_ys[shelf_idx + 1] - 2
    shelf_h = y_bot - y_top
    x = SHELF_LEFT + 26
    right_limit = SHELF_RIGHT - 26
    ci = 0
    while x < right_limit - 10:
        if skip_range and skip_range[0] - 4 <= x <= skip_range[1] + 4:
            x = skip_range[1] + 8
            continue
        w = rng.randint(32, 58)          # 书更宽
        gap = rng.randint(4, 12)         # 书之间留间距
        if x + w > right_limit:
            break
        color = BOOK_COLORS[ci % len(BOOK_COLORS)]
        ci += 1
        h_offset = rng.randint(0, int(shelf_h * 0.18))
        bx1, by1 = x, y_top + h_offset
        bx2, by2 = x + w - 2, y_bot - 2
        draw.rectangle([bx1, by1, bx2, by2], fill=color)
        draw.line([(bx1, by1), (bx1, by2)],
                  fill=tuple(min(255, c+40) for c in color), width=2)
        draw.line([(bx2, by1), (bx2, by2)],
                  fill=tuple(max(0, c-40) for c in color), width=2)
        mid_y = (by1 + by2) // 2
        draw.line([(bx1+3, mid_y-8), (bx2-3, mid_y-8)],
                  fill=tuple(min(255, c+60) for c in color), width=1)
        draw.line([(bx1+3, mid_y+8), (bx2-3, mid_y+8)],
                  fill=tuple(min(255, c+60) for c in color), width=1)
        x += w + gap

# 第0层（顶层）书本
draw_books_in_shelf(0)
# 第1层书本
draw_books_in_shelf(1)
# 第2层书本（音乐盒层），跳过音乐盒区域
# 音乐盒区域 x: 大约 30%~62% of W
music_box_x1 = int(W * 0.30)
music_box_x2 = int(W * 0.62)
draw_books_in_shelf(2, skip_range=(music_box_x1, music_box_x2))
# 第3层书本
draw_books_in_shelf(3)
# 第4层书本
draw_books_in_shelf(4)

# ── 音乐盒（第2层，水平 30%~62%）────────────────────────────
mb_y_top = shelf_ys[2] + 8
mb_y_bot = shelf_ys[3] - 4
mb_x1 = music_box_x1
mb_x2 = music_box_x2
mb_w = mb_x2 - mb_x1
mb_h = mb_y_bot - mb_y_top

# 音乐盒主体（木质盒子）
for y in range(mb_y_top, mb_y_bot):
    t = (y - mb_y_top) / mb_h
    r = int(185 + (155 - 185) * t)
    g = int(148 + (118 - 148) * t)
    b = int(72  + (52  -  72) * t)
    draw.line([(mb_x1, y), (mb_x2, y)], fill=(r, g, b))

# 木纹
for i in range(0, mb_w, 30):
    x = mb_x1 + i
    draw.line([(x, mb_y_top+4), (x+8, mb_y_bot-4)],
              fill=(165, 128, 58), width=1)

# 盒子边框
draw.rectangle([mb_x1, mb_y_top, mb_x2, mb_y_bot],
               outline=(210, 175, 90), width=3)
# 内框装饰
draw.rectangle([mb_x1+8, mb_y_top+8, mb_x2-8, mb_y_bot-8],
               outline=(195, 158, 72), width=1)

# 盒盖铰链（顶部中央，紧贴盒子顶边内侧）
hinge_cx = (mb_x1 + mb_x2) // 2
draw.ellipse([hinge_cx-14, mb_y_top+4, hinge_cx+14, mb_y_top+18],
             fill=(200, 165, 80), outline=(160, 125, 50), width=2)

# 正面装饰：上半部分做成琴键区域
keys_y1 = mb_y_top + 14
keys_y2 = mb_y_top + mb_h * 2 // 5
keys_x1 = mb_x1 + 16
keys_x2 = mb_x2 - 16
keys_w  = keys_x2 - keys_x1

# ── 音乐盒三个按钮（位置：琴键下方，音乐盒内居中）────────────
btn_y_center = (keys_y2 + mb_y_bot) // 2
btn_xs = [mb_x1 + (mb_x2 - mb_x1) * (2*i+1) // 6 for i in range(3)]
btn_w, btn_h = 68, 36

# 琴键底板（深色）
draw.rectangle([keys_x1, keys_y1, keys_x2, keys_y2], fill=(110, 80, 28))
draw.rectangle([keys_x1, keys_y1, keys_x2, keys_y2], outline=(160, 125, 50), width=2)

# 白键
num_white = 14
wk_w = (keys_w - 2) // num_white
for i in range(num_white):
    wx1 = keys_x1 + 1 + i * wk_w
    wx2 = wx1 + wk_w - 2
    wy1 = keys_y1 + 3
    wy2 = keys_y2 - 3
    draw.rectangle([wx1, wy1, wx2, wy2], fill=(235, 225, 195), outline=(180, 155, 90), width=1)

# 黑键（每组 2+3 排列）
black_pattern = [0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1]  # 0=无黑键,1=有黑键
bk_w = int(wk_w * 0.55)
bk_h = int((keys_y2 - keys_y1) * 0.55)
for i, has_black in enumerate(black_pattern):
    if has_black and i < num_white - 1:
        bx = keys_x1 + 1 + (i + 1) * wk_w - bk_w // 2
        draw.rectangle([bx, keys_y1 + 3, bx + bk_w, keys_y1 + 3 + bk_h],
                       fill=(45, 30, 10), outline=(30, 18, 5), width=1)

# 按钮底座凹槽
for bx in btn_xs:
    draw.rectangle([bx - btn_w//2 - 4, btn_y_center - btn_h//2 - 4,
                    bx + btn_w//2 + 4, btn_y_center + btn_h//2 + 4],
                   fill=(145, 112, 48), outline=(120, 90, 35), width=2)

# 按钮本体（象牙色圆角矩形）
BTN_COLORS = [
    (220, 200, 155),  # 左：暖米色
    (215, 195, 148),  # 中：略深
    (218, 198, 152),  # 右
]
for i, bx in enumerate(btn_xs):
    bc = BTN_COLORS[i]
    x1 = bx - btn_w//2
    y1 = btn_y_center - btn_h//2
    x2 = bx + btn_w//2
    y2 = btn_y_center + btn_h//2
    # 按钮主体
    draw.rectangle([x1, y1, x2, y2], fill=bc, outline=(170, 140, 80), width=2)
    # 高光
    draw.line([(x1+3, y1+3), (x2-3, y1+3)],
              fill=tuple(min(255, c+30) for c in bc), width=2)
    # 阴影
    draw.line([(x1+3, y2-3), (x2-3, y2-3)],
              fill=tuple(max(0, c-30) for c in bc), width=2)
    # 按钮上的年份刻字（用小矩形模拟）
    labels = ['2022', '2024', '2026']
    # 刻字用细线模拟（无字体依赖）
    lx = (x1 + x2) // 2
    ly = (y1 + y2) // 2
    # 画4条短横线模拟文字
    for row in range(2):
        draw.line([(lx-14, ly-4+row*8), (lx+14, ly-4+row*8)],
                  fill=(130, 100, 50), width=1)

# 按钮下方装饰线
draw.line([(mb_x1+12, btn_y_center + btn_h//2 + 10),
           (mb_x2-12, btn_y_center + btn_h//2 + 10)],
          fill=(170, 135, 62), width=1)

# ── 暗角（四边线性渐变，不用 outline 避免中央椭圆光晕）────────
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v_pix = vignette.load()
margin = 120
for y in range(H):
    for x in range(W):
        ax = max(0, margin - x, x - (W - margin)) / margin
        ay = max(0, margin - y, y - (H - margin)) / margin
        a = min(1.0, ax + ay)
        v_pix[x, y] = (0, 0, 0, int(a * 160))
img = img.convert('RGBA')
img = Image.alpha_composite(img, vignette)
img = img.convert('RGB')

# ── 保存 ─────────────────────────────────────────────────────
out_path = 'bookshelf.jpg'
img.save(out_path, 'JPEG', quality=90)
print(f'saved {out_path}', img.size)

# 验证按钮位置像素
from PIL import Image as PILImage
check = PILImage.open(out_path)
print('Button pixel check:')
for label, x_pct, y_pct in [('B/2022', 0.37, 0.70), ('C/2024', 0.48, 0.70), ('A/2026', 0.59, 0.70)]:
    x, y = int(W * x_pct), int(H * y_pct)
    r, g, b = check.getpixel((x, y))
    print(f'  {label} ({x},{y}): RGB({r},{g},{b})')
