"""
生成 painting.jpg：室内场景，有门、窗户、阳光从窗户照射进来聚焦在地上
四个谜题区域（BOWL_ZONES）：
  morning (窗边)   left:25% top:15%  -> 窗户旁边的墙面/窗台区域（偏亮，近窗）
  noon    (阳光处) left:58% top:15%  -> 阳光照射到的明亮墙面（最亮）
  evening (门边)   left:58% top:52%  -> 门旁边的地面（中等亮度）
  night   (暗角)   left:25% top:52%  -> 左侧阴影区域（最暗）
"""

from PIL import Image, ImageDraw, ImageFilter
import math

W, H = 800, 600
floor_y = int(H * 0.62)  # 372

# ── 底图：墙壁 + 地板渐变 ─────────────────────────────────
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

for y in range(H):
    t = y / H
    if y < floor_y:
        r = int(175 + (158 - 175) * t)
        g = int(162 + (145 - 162) * t)
        b = int(138 + (122 - 138) * t)
    else:
        tf = (y - floor_y) / (H - floor_y)
        r = int(152 + (132 - 152) * tf)
        g = int(113 + (96  - 113) * tf)
        b = int(74  + (58  - 74 ) * tf)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# 地板木纹
for i in range(0, W, 75):
    draw.line([(i, floor_y), (i + 15, H)], fill=(118, 85, 52), width=1)
for y in range(floor_y, H, 28):
    draw.line([(0, y), (W, y)], fill=(128, 92, 58), width=1)

# 踢脚线
draw.rectangle([0, floor_y - 14, W, floor_y], fill=(168, 148, 118))
draw.line([(0, floor_y - 14), (W, floor_y - 14)], fill=(138, 118, 88), width=2)
draw.line([(0, floor_y),      (W, floor_y)],      fill=(108, 80, 48),  width=3)

# ── 窗户（左侧）──────────────────────────────────────────
win_x1, win_y1 = 55, 55
win_x2, win_y2 = 265, 320
fw = 13
mid_x = (win_x1 + win_x2) // 2
mid_y = (win_y1 + win_y2) // 2

# 窗外天空
for y in range(win_y1 + fw, win_y2 - fw):
    t = (y - (win_y1 + fw)) / (win_y2 - win_y1 - 2*fw)
    r = int(120 + (165 - 120) * t)
    g = int(185 + (205 - 185) * t)
    b = int(230 + (195 - 230) * t)
    draw.line([(win_x1 + fw, y), (win_x2 - fw, y)], fill=(r, g, b))

# 窗外树木
for tx, th in [(win_x1+25, 55), (win_x1+60, 75), (win_x1+100, 50),
               (win_x1+140, 65), (win_x1+175, 45)]:
    if win_x1 + fw < tx < win_x2 - fw:
        draw.ellipse([tx-16, win_y2-fw-th-8, tx+16, win_y2-fw-8], fill=(65, 120, 65))

# 窗框
draw.rectangle([win_x1, win_y1, win_x2, win_y2], outline=(195, 180, 150), width=fw)
draw.line([(mid_x, win_y1), (mid_x, win_y2)], fill=(195, 180, 150), width=7)
draw.line([(win_x1, mid_y), (win_x2, mid_y)], fill=(195, 180, 150), width=7)

# 窗台
draw.rectangle([win_x1-8, win_y2, win_x2+8, win_y2+16], fill=(205, 190, 160))
draw.line([(win_x1-8, win_y2), (win_x2+8, win_y2)], fill=(165, 145, 110), width=2)

# ── 门（右侧）────────────────────────────────────────────
door_x1, door_y1 = 590, 115
door_x2, door_y2 = 725, floor_y
fdw = 10

draw.rectangle([door_x1, door_y1, door_x2, door_y2], fill=(132, 95, 60))
draw.rectangle([door_x1-fdw, door_y1-fdw, door_x2+fdw, door_y2],
               outline=(105, 72, 40), width=fdw)
pm = 16
mid_door = door_y1 + (door_y2 - door_y1) // 2
draw.rectangle([door_x1+pm, door_y1+pm, door_x2-pm, mid_door-6],
               outline=(115, 80, 48), width=3)
draw.rectangle([door_x1+pm, mid_door+6, door_x2-pm, door_y2-pm],
               outline=(115, 80, 48), width=3)
kx, ky = door_x1 + 20, mid_door
draw.ellipse([kx-7, ky-7, kx+7, ky+7], fill=(175, 145, 75))
draw.ellipse([kx-5, ky-5, kx+5, ky+5], fill=(205, 170, 95))

# ── 墙上挂钟 ──────────────────────────────────────────────
# 放在 noon 区域(58%,15%)=(463,90) 右侧，避免遮挡
ccx, ccy, cr = 540, 75, 26
draw.ellipse([ccx-cr, ccy-cr, ccx+cr, ccy+cr],
             fill=(215, 200, 170), outline=(155, 135, 105), width=3)
draw.ellipse([ccx-3, ccy-3, ccx+3, ccy+3], fill=(75, 55, 35))
draw.line([(ccx, ccy), (ccx+11, ccy-7)],  fill=(55, 40, 25), width=2)
draw.line([(ccx, ccy), (ccx-4,  ccy-15)], fill=(55, 40, 25), width=2)

# ── 窗台植物 ──────────────────────────────────────────────
px, py = win_x2 + 18, win_y2 - 8
draw.polygon([(px, py+28), (px+28, py+28), (px+23, py+52), (px+5, py+52)],
             fill=(155, 95, 55))
lc = (55, 125, 55)
for ang, ln in [(105, 33), (135, 38), (165, 28), (75, 26), (45, 30)]:
    rad = math.radians(ang)
    ex = px + 14 + int(math.cos(rad) * ln)
    ey = py + 8  - int(math.sin(rad) * ln)
    draw.line([(px+14, py+8), (ex, ey)], fill=lc, width=4)
    draw.ellipse([ex-7, ey-7, ex+7, ey+7], fill=lc)

# ════════════════════════════════════════════════════════════
# ── 光照系统 ─────────────────────────────────────────────
# 光源：窗户左侧，阳光向右照射
# noon (58%,15%) = (464, 90)  → 墙面右上，最亮
# morning (25%,15%) = (200, 90) → 窗边，次亮
# evening (58%,52%) = (464, 312) → 门边地面，中等
# night (25%,52%) = (200, 312)  → 左下阴影，最暗
# ════════════════════════════════════════════════════════════

# Step 1: 整体轻微压暗
dark = Image.new('RGBA', (W, H), (0, 0, 0, 45))
img = img.convert('RGBA')
img = Image.alpha_composite(img, dark)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# Step 2: 墙面右侧阳光（noon 区域提亮）
# 从窗户右边缘向右扩散，照亮整个右侧墙面
wall_light = Image.new('RGBA', (W, H), (0, 0, 0, 0))
wl = ImageDraw.Draw(wall_light)

# 主墙面光照区域（三角形，从窗口右上角扩散到整个右侧墙面）
wl.polygon([
    (win_x2, win_y1),    # 窗口右上
    (W,      0),          # 画面右上
    (W,      floor_y),    # 画面右下（墙地交界）
    (win_x2, floor_y),    # 窗口右侧底
], fill=(255, 245, 175, 120))

# noon 区域（右上墙面 x=464, y=90）额外高亮椭圆
wl.ellipse([int(W*0.35), -60, W+80, int(H*0.55)], fill=(255, 250, 190, 90))

# noon 区域点状高亮（x=464, y=90）
wl.ellipse([int(W*0.48), 20, int(W*0.78), int(H*0.38)], fill=(255, 252, 200, 80))
# noon 中心强光点（确保 58%,15% 是最亮的墙面区域）
wl.ellipse([int(W*0.50), 30, int(W*0.70), int(H*0.28)], fill=(255, 255, 215, 130))

wall_light = wall_light.filter(ImageFilter.GaussianBlur(radius=40))
img = img.convert('RGBA')
img = Image.alpha_composite(img, wall_light)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# Step 3: 地面光柱（从窗口射向地面，清晰梯形）
src_left  = mid_x
src_right = win_x2 - fw
src_top   = win_y1 + fw

gnd_cx    = int(W * 0.50)
gnd_half  = int(W * 0.21)
gnd_left  = gnd_cx - gnd_half   # 176
gnd_right = gnd_cx + gnd_half   # 568

sun_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sun_layer)

# 主光柱
sd.polygon([
    (src_left,  src_top),
    (src_right, src_top),
    (gnd_right, floor_y),
    (gnd_left,  floor_y),
], fill=(255, 245, 180, 125))

# 光柱核心
core_cx = (src_left + src_right) // 2
sd.polygon([
    (core_cx - 10, src_top),
    (core_cx + 10, src_top),
    (gnd_cx + int(gnd_half*0.38), floor_y),
    (gnd_cx - int(gnd_half*0.38), floor_y),
], fill=(255, 252, 208, 80))

sun_layer = sun_layer.filter(ImageFilter.GaussianBlur(radius=4))
img = img.convert('RGBA')
img = Image.alpha_composite(img, sun_layer)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# Step 4: 地面光斑（聚焦高亮）
floor_light = Image.new('RGBA', (W, H), (0, 0, 0, 0))
fl = ImageDraw.Draw(floor_light)

fl.polygon([
    (gnd_left  + 5,  floor_y + 2),
    (gnd_right - 5,  floor_y + 2),
    (gnd_right + 28, H),
    (gnd_left  - 28, H),
], fill=(255, 250, 198, 115))

fl.ellipse([
    gnd_cx - int(gnd_half*0.62), int(H*0.65),
    gnd_cx + int(gnd_half*0.62), int(H*0.97),
], fill=(255, 253, 212, 85))

floor_light = floor_light.filter(ImageFilter.GaussianBlur(radius=7))
img = img.convert('RGBA')
img = Image.alpha_composite(img, floor_light)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# Step 5: 窗格十字投影到地面
cross = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cr = ImageDraw.Draw(cross)

fy_mid = floor_y + int((H - floor_y) * 0.40)
cr.polygon([
    (gnd_left,  fy_mid - 11),
    (gnd_right, fy_mid - 11),
    (gnd_right, fy_mid + 11),
    (gnd_left,  fy_mid + 11),
], fill=(0, 0, 0, 42))
cr.polygon([
    (gnd_cx - 13, floor_y),
    (gnd_cx + 13, floor_y),
    (gnd_cx + 17, H),
    (gnd_cx - 17, H),
], fill=(0, 0, 0, 42))

cross = cross.filter(ImageFilter.GaussianBlur(radius=6))
img = img.convert('RGBA')
img = Image.alpha_composite(img, cross)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# ════════════════════════════════════════════════════════════
# ── 阴影区域（night 25%,52% = x200, y312，左下地面）────────
# 左侧墙角/家具投下的大块阴影
# ════════════════════════════════════════════════════════════

shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sh = ImageDraw.Draw(shadow_layer)

# 左下角主阴影（覆盖 night 区域 x=200, y=312）
sh.polygon([
    (0,           floor_y - 15),
    (int(W*0.42), floor_y - 15),
    (int(W*0.36), H),
    (0,           H),
], fill=(0, 0, 0, 95))

# 左下角深暗角
sh.polygon([
    (0,           floor_y - 15),
    (int(W*0.24), floor_y - 15),
    (int(W*0.18), H),
    (0,           H),
], fill=(0, 0, 0, 75))

# 左侧墙面阴影（光照不到的左墙，但不要压暗 morning 区域太多）
sh.polygon([
    (0,           0),
    (int(W*0.07), 0),
    (int(W*0.07), floor_y),
    (0,           floor_y),
], fill=(0, 0, 0, 55))

shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=28))
img = img.convert('RGBA')
img = Image.alpha_composite(img, shadow_layer)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# 门底部阴影
ds = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ds_draw = ImageDraw.Draw(ds)
ds_draw.ellipse([door_x1-18, floor_y-6, door_x2+18, floor_y+22], fill=(0, 0, 0, 55))
ds = ds.filter(ImageFilter.GaussianBlur(radius=9))
img = img.convert('RGBA')
img = Image.alpha_composite(img, ds)
img = img.convert('RGB')
draw = ImageDraw.Draw(img)

# ── 整体暗角 ──────────────────────────────────────────────
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
v_draw = ImageDraw.Draw(vignette)
for i in range(65):
    alpha = int(i * 1.5)
    v_draw.rectangle([i, i, W-i, H-i], outline=(0, 0, 0, alpha))
vignette = vignette.filter(ImageFilter.GaussianBlur(radius=28))
img = img.convert('RGBA')
img = Image.alpha_composite(img, vignette)
img = img.convert('RGB')

# ── 保存 ──────────────────────────────────────────────────
img.save('D:/cat-treasure/painting.jpg', 'JPEG', quality=88)

# 验证四个区域亮度
from PIL import Image as PILImage
check = PILImage.open('D:/cat-treasure/painting.jpg')
zones = [
    ('morning 25%,15%', int(W*0.25), int(H*0.15)),
    ('noon    58%,15%', int(W*0.58), int(H*0.15)),
    ('evening 58%,52%', int(W*0.58), int(H*0.52)),
    ('night   25%,52%', int(W*0.25), int(H*0.52)),
]
print('painting.jpg saved', check.size)
for name, x, y in zones:
    r, g, b = check.getpixel((x, y))
    print('  %s  RGB(%d,%d,%d)  brightness=%.0f' % (name, r, g, b, (r+g+b)/3))
