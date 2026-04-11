"""
生成房间俯视图，标注5个便利贴位置
便利贴位置（来自代码）：
  note1 - 主房间桌子旁  left:53% top:65%
  note2 - 窗户场景      left:30% top:8%  (窗户热区 x:35% y:20%)
  note3 - 照片墙场景    right:5% bottom:10% (照片墙热区 x:14% y:20%)
  note4 - 书架场景（解谜后获得）(书架热区 x:75% y:35%)
  note5 - 阳台场景      right:6% top:10% (阳台热区 x:0% y:0% 通过窗户进入)
"""

from PIL import Image, ImageDraw, ImageFont
import math

W, H = 900, 700

img = Image.new('RGB', (W, H), (245, 240, 230))
draw = ImageDraw.Draw(img)

# ── 房间外墙 ──────────────────────────────────────────────
MARGIN = 60
RX1, RY1 = MARGIN, MARGIN
RX2, RY2 = W - MARGIN, H - MARGIN
RW = RX2 - RX1
RH = RY2 - RY1

# 地板填充
draw.rectangle([RX1, RY1, RX2, RY2], fill=(220, 205, 180), outline=(80, 65, 45), width=4)

# 地板木纹（横向）
for y in range(RY1 + 20, RY2, 35):
    draw.line([(RX1 + 4, y), (RX2 - 4, y)], fill=(200, 185, 160), width=1)

# ── 辅助函数：房间坐标转图像坐标 ─────────────────────────
def rx(pct): return int(RX1 + RW * pct / 100)
def ry(pct): return int(RY1 + RH * pct / 100)

# ── 家具（俯视轮廓）──────────────────────────────────────
WALL_COL    = (160, 140, 110)
FURN_COL    = (140, 110, 75)
FURN_DARK   = (110, 85, 55)
FURN_LIGHT  = (185, 160, 120)
WINDOW_COL  = (160, 210, 240)
DOOR_COL    = (170, 130, 85)

# 门（左侧，x:3% y:45% w:10% h:30%）
door_x1, door_y1 = rx(3),  ry(45)
door_x2, door_y2 = rx(13), ry(75)
draw.rectangle([RX1 - 4, door_y1, door_x2, door_y2], fill=DOOR_COL, outline=(90, 65, 35), width=2)
# 门弧线（开门方向）
draw.arc([door_x2 - (door_y2-door_y1), door_y1, door_x2 + (door_y2-door_y1)*0, door_y1 + (door_y2-door_y1)*2 - (door_y2-door_y1)],
         start=270, end=360, fill=(90, 65, 35), width=2)
# 简化：画一条弧表示门的开合
arc_r = door_y2 - door_y1
draw.arc([RX1 - 4, door_y1, RX1 - 4 + arc_r*2, door_y1 + arc_r*2],
         start=270, end=360, fill=(90, 65, 35), width=2)

# 窗户（x:35% y:20% w:25% h:35%）→ 俯视图中窗户在上墙
win_x1, win_y1 = rx(35), RY1 - 4
win_x2, win_y2 = rx(60), RY1 + 18
draw.rectangle([win_x1, win_y1, win_x2, win_y2], fill=WINDOW_COL, outline=(80, 140, 180), width=2)
draw.line([(win_x1 + (win_x2-win_x1)//2, win_y1), (win_x1 + (win_x2-win_x1)//2, win_y2)],
          fill=(80, 140, 180), width=2)

# 沙发（x:15% y:65% w:30% h:20%）
sf_x1, sf_y1 = rx(15), ry(65)
sf_x2, sf_y2 = rx(45), ry(85)
draw.rectangle([sf_x1, sf_y1, sf_x2, sf_y2], fill=FURN_LIGHT, outline=FURN_DARK, width=2)
# 沙发靠背（上边）
draw.rectangle([sf_x1, sf_y1, sf_x2, sf_y1 + 14], fill=FURN_COL, outline=FURN_DARK, width=1)
# 沙发扶手
draw.rectangle([sf_x1, sf_y1, sf_x1 + 12, sf_y2], fill=FURN_COL, outline=FURN_DARK, width=1)
draw.rectangle([sf_x2 - 12, sf_y1, sf_x2, sf_y2], fill=FURN_COL, outline=FURN_DARK, width=1)
draw.text((sf_x1 + (sf_x2-sf_x1)//2, sf_y1 + (sf_y2-sf_y1)//2), '沙发',
          fill=(80, 55, 30), anchor='mm')

# 桌子（x:55% y:68% w:25% h:18%）
tb_x1, tb_y1 = rx(55), ry(68)
tb_x2, tb_y2 = rx(80), ry(86)
draw.rectangle([tb_x1, tb_y1, tb_x2, tb_y2], fill=(195, 165, 115), outline=FURN_DARK, width=2)
draw.text((tb_x1 + (tb_x2-tb_x1)//2, tb_y1 + (tb_y2-tb_y1)//2), '桌子',
          fill=(80, 55, 30), anchor='mm')

# 书架（x:75% y:35% w:12% h:30%）→ 靠右墙
bs_x1, bs_y1 = rx(75), ry(35)
bs_x2, bs_y2 = rx(87), ry(65)
draw.rectangle([bs_x1, bs_y1, bs_x2, RX2 + 4], fill=(155, 120, 75), outline=FURN_DARK, width=2)
# 书架格子
for y in range(bs_y1 + 18, bs_y2, 18):
    draw.line([(bs_x1, y), (bs_x2, y)], fill=FURN_DARK, width=1)
draw.text((bs_x1 + (bs_x2-bs_x1)//2, bs_y1 + (bs_y2-bs_y1)//2), '书架',
          fill=(240, 225, 200), anchor='mm')

# 照片墙（x:14% y:20% w:18% h:30%）→ 上墙
pw_x1, pw_y1 = rx(14), RY1 - 4
pw_x2, pw_y2 = rx(32), RY1 + 22
draw.rectangle([pw_x1, pw_y1, pw_x2, pw_y2], fill=(200, 185, 160), outline=(120, 100, 70), width=2)
draw.text(((pw_x1+pw_x2)//2, pw_y1 + 11), '照片墙', fill=(80, 55, 30), anchor='mm')

# 抽屉（x:52% y:50% w:8% h:10%）
dr_x1, dr_y1 = rx(52), ry(50)
dr_x2, dr_y2 = rx(60), ry(60)
draw.rectangle([dr_x1, dr_y1, dr_x2, dr_y2], fill=(175, 145, 95), outline=FURN_DARK, width=2)
draw.text(((dr_x1+dr_x2)//2, (dr_y1+dr_y2)//2), '抽屉', fill=(80, 55, 30), anchor='mm')

# 时钟（x:88% y:25% w:10% h:15%）→ 右墙
ck_x1, ck_y1 = RX2 - 4, ry(25)
ck_x2, ck_y2 = RX2 + 4, ry(40)
draw.rectangle([ck_x1, ck_y1, ck_x2 + 8, ck_y2], fill=(210, 195, 165), outline=(120, 100, 70), width=2)

# 食盆（x:3% y:78% w:8% h:8%）
fb_cx, fb_cy = rx(7), ry(82)
draw.ellipse([fb_cx-16, fb_cy-16, fb_cx+16, fb_cy+16], fill=(180, 160, 120), outline=FURN_DARK, width=2)
draw.text((fb_cx, fb_cy), '食盆', fill=(80, 55, 30), anchor='mm')

# 猫玩具（x:60% y:82% w:15% h:10%）
ty_x1, ty_y1 = rx(60), ry(82)
ty_x2, ty_y2 = rx(75), ry(92)
draw.rectangle([ty_x1, ty_y1, ty_x2, ty_y2], fill=(195, 175, 135), outline=FURN_DARK, width=2)
draw.text(((ty_x1+ty_x2)//2, (ty_y1+ty_y2)//2), '玩具', fill=(80, 55, 30), anchor='mm')

# 玩具箱（x:82% y:76% w:10% h:8%）
txb_x1, txb_y1 = rx(82), ry(76)
txb_x2, txb_y2 = rx(92), ry(84)
draw.rectangle([txb_x1, txb_y1, txb_x2, txb_y2], fill=(165, 130, 80), outline=FURN_DARK, width=2)
draw.text(((txb_x1+txb_x2)//2, (txb_y1+txb_y2)//2), '玩具箱', fill=(240, 225, 200), anchor='mm')

# 画框（x:60% y:18% w:8% h:20%）→ 上墙
pnt_x1, pnt_y1 = rx(60), RY1 - 4
pnt_x2, pnt_y2 = rx(68), RY1 + 16
draw.rectangle([pnt_x1, pnt_y1, pnt_x2, pnt_y2], fill=(185, 155, 105), outline=(100, 75, 40), width=2)
draw.text(((pnt_x1+pnt_x2)//2, pnt_y1 + 8), '画', fill=(80, 55, 30), anchor='mm')

# 阳台（通过窗户，画在上方外侧）
bal_x1, bal_y1 = rx(35), MARGIN - 55
bal_x2, bal_y2 = rx(60), MARGIN - 4
draw.rectangle([bal_x1, bal_y1, bal_x2, bal_y2], fill=(200, 215, 195), outline=(100, 130, 90), width=2)
draw.text(((bal_x1+bal_x2)//2, (bal_y1+bal_y2)//2), '阳台', fill=(60, 90, 55), anchor='mm')

# ── 外墙轮廓（重绘，覆盖家具溢出部分）────────────────────
draw.rectangle([RX1, RY1, RX2, RY2], outline=(80, 65, 45), width=4)

# ── 便利贴标注 ────────────────────────────────────────────
# 便利贴颜色
NOTE_COLORS = [
    (255, 230, 80),   # note1 黄
    (120, 200, 255),  # note2 蓝
    (255, 160, 120),  # note3 橙
    (140, 220, 140),  # note4 绿
    (220, 140, 220),  # note5 紫
]

notes = [
    # (id, 描述, 图像x, 图像y, 标注文字)
    # note1: 主房间桌子旁 left:53% top:65%
    ('①', '桌子旁\n(主房间)', rx(53), ry(65), NOTE_COLORS[0]),
    # note2: 窗户场景 left:30% top:8% → 窗户热区在 x:35~60%, 上墙
    #   窗户场景内 left:30% 对应窗户宽度内的30%
    ('②', '窗户旁\n(窗户场景)', rx(35) + int((rx(60)-rx(35))*0.30), RY1 + 5, NOTE_COLORS[1]),
    # note3: 照片墙场景 right:5% bottom:10% → 照片墙在 x:14~32%, 上墙
    ('③', '照片墙\n(照片墙场景)', rx(32) - int((rx(32)-rx(14))*0.05), RY1 + 5, NOTE_COLORS[2]),
    # note4: 书架场景（解谜后）→ 书架在 x:75~87%
    ('④', '书架\n(书架场景)', (bs_x1+bs_x2)//2, (bs_y1+bs_y2)//2 - 10, NOTE_COLORS[3]),
    # note5: 阳台场景 right:6% top:10% → 阳台在上方
    ('⑤', '阳台\n(阳台场景)', bal_x2 - int((bal_x2-bal_x1)*0.06), bal_y1 + int((bal_y2-bal_y1)*0.10), NOTE_COLORS[4]),
]

NOTE_R = 14  # 便利贴圆圈半径

for num, desc, nx, ny, col in notes:
    # 便利贴图标（圆形）
    draw.ellipse([nx - NOTE_R, ny - NOTE_R, nx + NOTE_R, ny + NOTE_R],
                 fill=col, outline=(60, 50, 30), width=2)
    draw.text((nx, ny), num, fill=(40, 30, 15), anchor='mm')

# ── 图例（右下角）────────────────────────────────────────
legend_x, legend_y = W - 200, H - 175
draw.rectangle([legend_x - 10, legend_y - 10, W - 10, H - 10],
               fill=(250, 245, 235), outline=(120, 100, 70), width=2)
draw.text((legend_x + 75, legend_y + 5), '便利贴位置', fill=(60, 45, 25), anchor='mm')

note_labels = [
    ('①', '桌子旁（主房间）',    NOTE_COLORS[0]),
    ('②', '窗户旁（窗户场景）',  NOTE_COLORS[1]),
    ('③', '照片墙（照片墙场景）',NOTE_COLORS[2]),
    ('④', '书架（书架场景）',    NOTE_COLORS[3]),
    ('⑤', '阳台（阳台场景）',    NOTE_COLORS[4]),
]
for i, (num, label, col) in enumerate(note_labels):
    lx = legend_x
    ly = legend_y + 22 + i * 26
    draw.ellipse([lx, ly - 10, lx + 20, ly + 10], fill=col, outline=(60, 50, 30), width=1)
    draw.text((lx + 10, ly), num, fill=(40, 30, 15), anchor='mm')
    draw.text((lx + 28, ly), label, fill=(60, 45, 25), anchor='lm')

# ── 标题 ──────────────────────────────────────────────────
draw.text((W // 2, 22), '猫咪神藏 · 房间俯视图', fill=(80, 60, 35), anchor='mm')
draw.text((W // 2, 40), '（便利贴位置标注）', fill=(130, 110, 80), anchor='mm')

# ── 指北针（左上）────────────────────────────────────────
draw.text((MARGIN + 15, MARGIN + 20), '↑ 上墙', fill=(100, 80, 55), anchor='mm')

img.save('D:/cat-treasure/room_map.png', 'PNG')
print('room_map.png saved')
