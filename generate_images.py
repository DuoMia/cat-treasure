from PIL import Image, ImageDraw, ImageFont
import os

# 创建背景图 (room.jpg) - 1200x800
def create_room_background():
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#2c2416')
    draw = ImageDraw.Draw(img)

    # 绘制地板
    draw.rectangle([(0, height*0.6), (width, height)], fill='#3d2f1f')

    # 绘制墙壁纹理
    for i in range(0, width, 40):
        draw.line([(i, 0), (i, height*0.6)], fill='#332818', width=1)

    # 门 (左侧 3%, 45%, 10%x30%)
    door_x = int(width * 0.03)
    door_y = int(height * 0.45)
    door_w = int(width * 0.10)
    door_h = int(height * 0.30)
    draw.rectangle([(door_x, door_y), (door_x+door_w, door_y+door_h)],
                   fill='#4a3520', outline='#2a1810', width=3)
    # 门把手
    handle_x = door_x + door_w - 15
    handle_y = door_y + door_h // 2
    draw.ellipse([(handle_x-5, handle_y-8), (handle_x+5, handle_y+8)],
                 fill='#8b7355')

    # 窗户 (中上 35%, 20%, 25%x35%)
    win_x = int(width * 0.35)
    win_y = int(height * 0.20)
    win_w = int(width * 0.25)
    win_h = int(height * 0.35)
    draw.rectangle([(win_x, win_y), (win_x+win_w, win_y+win_h)],
                   fill='#87ceeb', outline='#4a3520', width=4)
    # 窗框
    draw.line([(win_x+win_w//2, win_y), (win_x+win_w//2, win_y+win_h)],
              fill='#4a3520', width=4)
    draw.line([(win_x, win_y+win_h//2), (win_x+win_w, win_y+win_h//2)],
              fill='#4a3520', width=4)

    # 沙发 (左下 15%, 65%, 30%x20%)
    sofa_x = int(width * 0.15)
    sofa_y = int(height * 0.65)
    sofa_w = int(width * 0.30)
    sofa_h = int(height * 0.20)
    # 沙发主体
    draw.rectangle([(sofa_x, sofa_y+20), (sofa_x+sofa_w, sofa_y+sofa_h)],
                   fill='#8b4513', outline='#654321', width=2)
    # 沙发靠背
    draw.rectangle([(sofa_x, sofa_y), (sofa_x+sofa_w, sofa_y+40)],
                   fill='#a0522d', outline='#654321', width=2)
    # 沙发扶手
    draw.rectangle([(sofa_x-10, sofa_y), (sofa_x+10, sofa_y+sofa_h)],
                   fill='#8b4513')
    draw.rectangle([(sofa_x+sofa_w-10, sofa_y), (sofa_x+sofa_w+10, sofa_y+sofa_h)],
                   fill='#8b4513')

    # 桌子 (右下 55%, 68%, 25%x18%)
    table_x = int(width * 0.55)
    table_y = int(height * 0.68)
    table_w = int(width * 0.25)
    table_h = int(height * 0.18)
    # 桌面
    draw.rectangle([(table_x, table_y), (table_x+table_w, table_y+30)],
                   fill='#8b7355', outline='#654321', width=3)
    # 桌腿
    leg_w = 10
    draw.rectangle([(table_x+20, table_y+30), (table_x+20+leg_w, table_y+table_h)],
                   fill='#654321')
    draw.rectangle([(table_x+table_w-20-leg_w, table_y+30), (table_x+table_w-20, table_y+table_h)],
                   fill='#654321')

    # 时钟 (右上 88%, 25%, 10%x15%)
    clock_x = int(width * 0.88)
    clock_y = int(height * 0.25)
    clock_r = int(min(width * 0.05, height * 0.075))
    clock_cx = clock_x + clock_r
    clock_cy = clock_y + clock_r
    # 时钟外框
    draw.ellipse([(clock_cx-clock_r, clock_cy-clock_r),
                  (clock_cx+clock_r, clock_cy+clock_r)],
                 fill='#f5deb3', outline='#8b7355', width=3)
    # 时钟刻度
    for i in range(12):
        angle = i * 30 - 90
        import math
        x1 = clock_cx + int((clock_r-10) * math.cos(math.radians(angle)))
        y1 = clock_cy + int((clock_r-10) * math.sin(math.radians(angle)))
        x2 = clock_cx + int((clock_r-5) * math.cos(math.radians(angle)))
        y2 = clock_cy + int((clock_r-5) * math.sin(math.radians(angle)))
        draw.line([(x1, y1), (x2, y2)], fill='#000000', width=2)
    # 时针和分针
    draw.line([(clock_cx, clock_cy), (clock_cx+clock_r//3, clock_cy-clock_r//3)],
              fill='#000000', width=3)
    draw.line([(clock_cx, clock_cy), (clock_cx+clock_r//2, clock_cy-clock_r//2)],
              fill='#000000', width=2)

    # 抽屉 (中右 52%, 50%, 8%x10%)
    drawer_x = int(width * 0.52)
    drawer_y = int(height * 0.50)
    drawer_w = int(width * 0.08)
    drawer_h = int(height * 0.10)
    draw.rectangle([(drawer_x, drawer_y), (drawer_x+drawer_w, drawer_y+drawer_h)],
                   fill='#8b7355', outline='#654321', width=2)
    # 抽屉把手
    handle_y = drawer_y + drawer_h // 2
    draw.rectangle([(drawer_x+drawer_w//3, handle_y-3),
                    (drawer_x+2*drawer_w//3, handle_y+3)],
                   fill='#4a3520')

    # 照片墙 (左上 14%, 20%, 18%x30%)
    pw_x = int(width * 0.14)
    pw_y = int(height * 0.20)
    pw_w = int(width * 0.18)
    pw_h = int(height * 0.30)
    # 三个相框
    frame_w = int(pw_w * 0.28)
    frame_h = int(pw_h * 0.55)
    frame_gap = int((pw_w - frame_w * 3) / 4)
    for i in range(3):
        fx = pw_x + frame_gap + i * (frame_w + frame_gap)
        fy = pw_y + int(pw_h * 0.15)
        draw.rectangle([(fx, fy), (fx+frame_w, fy+frame_h)],
                       fill='#c8b89a', outline='#6b4c2a', width=3)
        # 相框内猫咪简笔（小圆头+身体）
        cx, cy = fx + frame_w//2, fy + frame_h//2 - 5
        draw.ellipse([(cx-10, cy-8), (cx+10, cy+8)], outline='#4a3020', width=2)
        draw.ellipse([(cx-7, cy+6), (cx+7, cy+18)], outline='#4a3020', width=2)
        # 耳朵
        draw.line([(cx-7, cy-8), (cx-10, cy-16), (cx-2, cy-8)], fill='#4a3020', width=2)
        draw.line([(cx+2, cy-8), (cx+10, cy-16), (cx+7, cy-8)], fill='#4a3020', width=2)

    # 猫玩具 (地板 60%, 82%, 15%x10%)
    toy_x = int(width * 0.60)
    toy_y = int(height * 0.82)
    toy_w = int(width * 0.15)
    toy_h = int(height * 0.10)
    # 毛线球（左）
    ball1_cx = toy_x + int(toy_w * 0.18)
    ball1_cy = toy_y + toy_h // 2
    draw.ellipse([(ball1_cx-14, ball1_cy-14), (ball1_cx+14, ball1_cy+14)], fill='#e05050', outline='#a03030', width=2)
    draw.arc([(ball1_cx-10, ball1_cy-10), (ball1_cx+10, ball1_cy+10)], start=30, end=210, fill='#c04040', width=2)
    draw.arc([(ball1_cx-6, ball1_cy-12), (ball1_cx+6, ball1_cy+12)], start=270, end=90, fill='#c04040', width=2)
    # 铃铛球（中）
    ball2_cx = toy_x + int(toy_w * 0.50)
    ball2_cy = toy_y + toy_h // 2 + 4
    draw.ellipse([(ball2_cx-12, ball2_cy-12), (ball2_cx+12, ball2_cy+12)], fill='#f0c030', outline='#b08020', width=2)
    draw.ellipse([(ball2_cx-3, ball2_cy-3), (ball2_cx+3, ball2_cy+3)], fill='#b08020')
    # 小鱼（右）
    fish_x = toy_x + int(toy_w * 0.78)
    fish_y = toy_y + toy_h // 2
    draw.ellipse([(fish_x-16, fish_y-7), (fish_x+8, fish_y+7)], fill='#60a0d0', outline='#3070a0', width=2)
    draw.polygon([(fish_x+8, fish_y), (fish_x+20, fish_y-8), (fish_x+20, fish_y+8)], fill='#60a0d0')

    img.save('room.jpg', 'JPEG', quality=95)
    print("Background image room.jpg generated")

# 创建钢笔贴图 (pen.png) - 透明背景
def create_pen_image():
    width, height = 200, 60
    img = Image.new('RGBA', (width, height), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 笔尖 (左侧)
    tip_points = [(10, height//2), (40, height//2-8), (40, height//2+8)]
    draw.polygon(tip_points, fill='#c0c0c0', outline='#808080')

    # 笔身 (中间)
    body_x1 = 40
    body_x2 = 160
    body_y1 = height//2 - 6
    body_y2 = height//2 + 6
    draw.rectangle([(body_x1, body_y1), (body_x2, body_y2)],
                   fill='#1a1a1a', outline='#000000', width=1)

    # 笔身装饰条纹
    for i in range(3):
        x = body_x1 + 30 + i * 20
        draw.line([(x, body_y1), (x, body_y2)], fill='#ffd700', width=2)

    # 笔夹 (上方)
    clip_x = body_x1 + 20
    draw.rectangle([(clip_x, body_y1-10), (clip_x+3, body_y1)],
                   fill='#c0c0c0')
    draw.ellipse([(clip_x-2, body_y1-15), (clip_x+5, body_y1-10)],
                 fill='#c0c0c0')

    # 笔帽 (右侧)
    cap_x1 = body_x2
    cap_x2 = 190
    draw.rectangle([(cap_x1, body_y1), (cap_x2, body_y2)],
                   fill='#2a2a2a', outline='#000000', width=1)
    # 笔帽顶部
    draw.ellipse([(cap_x2-5, body_y1), (cap_x2+5, body_y2)],
                 fill='#2a2a2a', outline='#000000')

    img.save('pen.png', 'PNG')
    print("Pen image pen.png generated")

# 创建笔筒贴图 (pen_holder.png) - 透明背景
def create_pen_holder_image():
    width, height = 100, 120
    img = Image.new('RGBA', (width, height), color=(0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 笔筒底部椭圆
    holder_x = 20
    holder_y = 10
    draw.ellipse([(holder_x, holder_y+95), (holder_x+60, holder_y+110)],
                 fill='#4a4a4a', outline='#2a2a2a', width=2)

    # 笔筒主体
    draw.rectangle([(holder_x, holder_y+15), (holder_x+60, holder_y+100)],
                   fill='#5a5a5a', outline='#2a2a2a', width=2)

    # 笔筒顶部椭圆
    draw.ellipse([(holder_x, holder_y+10), (holder_x+60, holder_y+20)],
                 fill='#6a6a6a', outline='#2a2a2a', width=2)

    # 笔筒里的钢笔（露出一部分）
    pen_x = holder_x + 25
    pen_y = holder_y + 5
    # 笔帽
    draw.rectangle([(pen_x, pen_y), (pen_x+10, pen_y+30)],
                   fill='#2a2a2a', outline='#000000', width=1)
    # 笔夹
    draw.rectangle([(pen_x+3, pen_y-5), (pen_x+5, pen_y)],
                   fill='#c0c0c0')
    draw.ellipse([(pen_x+1, pen_y-8), (pen_x+7, pen_y-5)],
                 fill='#c0c0c0')

    img.save('pen_holder.png', 'PNG')
    print("Pen holder image pen_holder.png generated")

def create_sofa_corner_image():
    """创建沙发角落特写图片 1200x800"""
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#1e1208')
    draw = ImageDraw.Draw(img)

    # 地板（纯色）
    draw.rectangle([(0, int(height * 0.58)), (width, height)], fill='#2e1f0e')

    # 墙壁（纯色，略深）
    draw.rectangle([(0, 0), (width, int(height * 0.58))], fill='#1a1008')

    # 沙发主体
    sofa_x = int(width * 0.05)
    sofa_y = int(height * 0.38)
    sofa_w = int(width * 0.90)
    sofa_h = int(height * 0.62)
    arm_w = int(width * 0.10)

    # 沙发座垫
    draw.rectangle([(sofa_x, sofa_y + 90), (sofa_x + sofa_w, sofa_y + sofa_h)],
                   fill='#7a3a18', outline='#5a2a10', width=3)

    # 沙发靠背
    draw.rectangle([(sofa_x, sofa_y), (sofa_x + sofa_w, sofa_y + 95)],
                   fill='#8b4513', outline='#5a2a10', width=3)

    # 沙发左扶手
    draw.rectangle([(sofa_x, sofa_y - 15), (sofa_x + arm_w, sofa_y + sofa_h)],
                   fill='#8b4513', outline='#5a2a10', width=3)

    # 沙发右扶手
    draw.rectangle([(sofa_x + sofa_w - arm_w, sofa_y - 15), (sofa_x + sofa_w, sofa_y + sofa_h)],
                   fill='#8b4513', outline='#5a2a10', width=3)

    # 右侧座垫上的凸起（约 x:62%~70%, y:58%~72%）
    # 用接近座垫的颜色，只有轻微阴影，不易察觉
    bump_cx = int(width * 0.66)
    bump_cy = int(height * 0.65)
    bump_rx, bump_ry = 38, 14
    # 底部阴影（比座垫略深）
    draw.ellipse([(bump_cx - bump_rx + 4, bump_cy - bump_ry + 6),
                  (bump_cx + bump_rx + 4, bump_cy + bump_ry + 6)],
                 fill='#5a2808')
    # 凸起主体（与座垫色接近，仅略浅）
    draw.ellipse([(bump_cx - bump_rx, bump_cy - bump_ry),
                  (bump_cx + bump_rx, bump_cy + bump_ry)],
                 fill='#7e3c1a')

    # 边缘暗角（RGBA 叠加，平滑渐变）
    from PIL import Image as PILImage
    vignette = PILImage.new('RGBA', (width, height), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    steps = 20
    for i in range(steps):
        alpha = int(140 * (1 - i / steps) ** 2)
        w = int(width * 0.22 * (steps - i) / steps)
        vdraw.rectangle([(0, 0), (w, height)], fill=(0, 0, 0, alpha))
        vdraw.rectangle([(width - w, 0), (width, height)], fill=(0, 0, 0, alpha))
        h = int(height * 0.15 * (steps - i) / steps)
        vdraw.rectangle([(0, 0), (width, h)], fill=(0, 0, 0, alpha))
    img = PILImage.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')
    draw = ImageDraw.Draw(img)

    # 沙发内衬上的4道爪痕（凸起左侧，划过座垫面料）
    scratch_color = '#4a1a08'
    scratch_x = int(width * 0.52)
    scratch_y = int(height * 0.55)
    for i in range(4):
        sx = scratch_x + i * 14
        draw.line([(sx, scratch_y), (sx + 8, scratch_y + 55)], fill=scratch_color, width=3)

    img.save('sofa_corner.jpg', 'JPEG', quality=90)
    print("Sofa corner image sofa_corner.jpg generated")


def create_drawer_background():
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='#2a1a0a')
    draw = ImageDraw.Draw(img)

    # 抽屉内部木质底板
    draw.rectangle([(0, 0), (width, height)], fill='#3d2510')

    # 木纹纹理
    for i in range(0, height, 18):
        draw.line([(0, i), (width, i)], fill='#2e1c0c', width=1)
    for i in range(0, width, 60):
        draw.line([(i, 0), (i, height)], fill='#2e1c0c', width=1)

    # 抽屉边框
    draw.rectangle([(10, 10), (width-10, height-10)],
                   outline='#1a0e05', width=6)

    # 日记本（居中偏左）
    diary_x, diary_y = int(width * 0.30), int(height * 0.25)
    diary_w, diary_h = int(width * 0.28), int(height * 0.45)
    # 封面
    draw.rectangle([(diary_x, diary_y), (diary_x+diary_w, diary_y+diary_h)],
                   fill='#5c3317', outline='#3a1f0a', width=3)
    # 书脊
    draw.rectangle([(diary_x, diary_y), (diary_x+18, diary_y+diary_h)],
                   fill='#3a1f0a')
    # 书页侧面
    draw.rectangle([(diary_x+diary_w, diary_y+4), (diary_x+diary_w+8, diary_y+diary_h-4)],
                   fill='#e8dcc8')
    # 封面文字区域（装饰线）
    for i in range(3):
        y = diary_y + 40 + i * 22
        draw.line([(diary_x+28, y), (diary_x+diary_w-12, y)],
                  fill='#7a4a28', width=2)
    # 封面小猫爪印装饰
    paw_cx, paw_cy = diary_x + diary_w//2, diary_y + diary_h//2 + 10
    draw.ellipse([(paw_cx-12, paw_cy-10), (paw_cx+12, paw_cy+10)], fill='#7a4a28')
    for dx, dy in [(-10, -16), (0, -18), (10, -16)]:
        draw.ellipse([(paw_cx+dx-5, paw_cy+dy-5), (paw_cx+dx+5, paw_cy+dy+5)], fill='#7a4a28')

    # 右侧散落的小物件（增加场景感）
    # 一支铅笔
    pencil_x = int(width * 0.72)
    pencil_y = int(height * 0.35)
    draw.rectangle([(pencil_x, pencil_y), (pencil_x+8, pencil_y+120)],
                   fill='#d4a017', outline='#a07010', width=1)
    draw.polygon([(pencil_x, pencil_y+120), (pencil_x+8, pencil_y+120), (pencil_x+4, pencil_y+135)],
                 fill='#f0c060')

    # 暗角效果
    from PIL import Image as PILImage
    vignette = PILImage.new('RGBA', (width, height), (0, 0, 0, 0))
    vdraw = ImageDraw.Draw(vignette)
    steps = 16
    for i in range(steps):
        alpha = int(120 * (1 - i / steps) ** 2)
        w = int(width * 0.25 * (steps - i) / steps)
        vdraw.rectangle([(0, 0), (w, height)], fill=(0, 0, 0, alpha))
        vdraw.rectangle([(width - w, 0), (width, height)], fill=(0, 0, 0, alpha))
        h = int(height * 0.18 * (steps - i) / steps)
        vdraw.rectangle([(0, 0), (width, h)], fill=(0, 0, 0, alpha))
        vdraw.rectangle([(0, height - h), (width, height)], fill=(0, 0, 0, alpha))
    img = PILImage.alpha_composite(img.convert('RGBA'), vignette).convert('RGB')

    img.save('drawer.jpg', 'JPEG', quality=90)
    print("Drawer image drawer.jpg generated")


def create_window_close_background():
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='#87ceeb')
    draw = ImageDraw.Draw(img)

    # 天空渐变（简单模拟）
    for y in range(height):
        ratio = y / height
        r = int(135 + (180 - 135) * ratio)
        g = int(206 + (220 - 206) * ratio)
        b = int(235 + (240 - 235) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # 窗框
    frame_color = '#4a3520'
    draw.rectangle([(0, 0), (width, height)], outline=frame_color, width=20)
    # 中间竖框
    draw.rectangle([(width//2 - 8, 0), (width//2 + 8, height)], fill=frame_color)
    # 中间横框
    draw.rectangle([(0, height//2 - 8), (width, height//2 + 8)], fill=frame_color)

    # 玻璃反光效果
    draw.rectangle([(25, 25), (width//2 - 14, height//2 - 14)],
                   fill='#a8d8f0', outline=None)
    draw.rectangle([(width//2 + 14, 25), (width - 25, height//2 - 14)],
                   fill='#a8d8f0', outline=None)
    draw.rectangle([(25, height//2 + 14), (width//2 - 14, height - 25)],
                   fill='#a8d8f0', outline=None)
    draw.rectangle([(width//2 + 14, height//2 + 14), (width - 25, height - 25)],
                   fill='#a8d8f0', outline=None)

    # 窗台猫咪坐姿剪影（头朝右侧，即时钟方向）
    cat_color = '#2a1a0a'
    # 窗台底部
    draw.rectangle([(0, height - 60), (width, height - 20)], fill='#5a4030')
    # 猫身体（椭圆）
    body_cx, body_cy = 300, height - 100
    draw.ellipse([(body_cx - 45, body_cy - 35), (body_cx + 45, body_cy + 35)], fill=cat_color)
    # 猫头（圆，偏右）
    head_cx, head_cy = body_cx + 40, body_cy - 40
    draw.ellipse([(head_cx - 28, head_cy - 28), (head_cx + 28, head_cy + 28)], fill=cat_color)
    # 猫耳（三角，朝上）
    draw.polygon([(head_cx + 5, head_cy - 28), (head_cx + 20, head_cy - 50), (head_cx + 28, head_cy - 20)], fill=cat_color)
    draw.polygon([(head_cx - 15, head_cy - 28), (head_cx - 5, head_cy - 50), (head_cx + 5, head_cy - 28)], fill=cat_color)
    # 猫尾巴（弯曲，向左）
    tail_pts = [(body_cx - 45, body_cy + 10), (body_cx - 80, body_cy + 30), (body_cx - 90, body_cy - 10), (body_cx - 70, body_cy - 20)]
    for i in range(len(tail_pts) - 1):
        draw.line([tail_pts[i], tail_pts[i+1]], fill=cat_color, width=10)
    # 猫眼（朝右看）
    draw.ellipse([(head_cx + 8, head_cy - 8), (head_cx + 16, head_cy + 2)], fill='#ffcc00')
    # 猫爪印（窗台上散落几个）
    paw_color = '#c8a060'
    for px, py in [(120, height - 45), (180, height - 50), (240, height - 42)]:
        draw.ellipse([(px-6, py-5), (px+6, py+5)], fill=paw_color)
        for dx, dy in [(-5, -9), (-1, -11), (3, -10), (7, -8)]:
            draw.ellipse([(px+dx-3, py+dy-3), (px+dx+3, py+dy+3)], fill=paw_color)

    # 玻璃上的轻微污迹/水珠效果
    import random
    random.seed(42)
    for _ in range(30):
        rx = random.randint(30, width - 30)
        ry = random.randint(30, height - 30)
        rr = random.randint(2, 6)
        draw.ellipse([(rx-rr, ry-rr), (rx+rr, ry+rr)],
                     fill='#b8d8ee')

    img.save('window_close.jpg', 'JPEG', quality=90)
    print("Window close image window_close.jpg generated")


def create_photo_wall_image():
    width, height = 800, 600
    img = Image.new('RGB', (width, height), color='#2a1f14')
    draw = ImageDraw.Draw(img)

    # 木墙纹理
    for i in range(0, width, 30):
        draw.line([(i, 0), (i, height)], fill='#251a10', width=1)

    # 相框参数：留上下边距，三张均匀排列
    frame_margin = 16        # 相框边框厚度
    frame_w = 190
    frame_h = 320
    top_y = int(height * 0.12)
    gap = (width - frame_w * 3) // 4

    photos = [
        ('2022cat.jpg', '2022'),
        ('2024cat.jpg', '2024'),
        ('2026cat.jpg', '2026'),
    ]

    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except:
        font = ImageFont.load_default()

    for i, (photo_file, year) in enumerate(photos):
        fx = gap + i * (frame_w + gap)
        fy = top_y

        # 相框外边（深木色）
        draw.rectangle([(fx, fy), (fx + frame_w, fy + frame_h)],
                       fill='#5a3a1a', outline='#8b6040', width=frame_margin)

        # 照片区域内边界
        inner_x1 = fx + frame_margin
        inner_y1 = fy + frame_margin
        inner_x2 = fx + frame_w - frame_margin
        inner_y2 = fy + frame_h - frame_margin
        inner_w = inner_x2 - inner_x1
        inner_h = inner_y2 - inner_y1

        # 嵌入真实照片，居中裁剪填满相框内区域
        try:
            cat_img = Image.open(photo_file).convert('RGB')
            # 等比缩放：短边对齐内框，长边裁剪
            src_w, src_h = cat_img.size
            scale = max(inner_w / src_w, inner_h / src_h)
            new_w = int(src_w * scale)
            new_h = int(src_h * scale)
            cat_img = cat_img.resize((new_w, new_h), Image.LANCZOS)
            # 居中裁剪
            crop_x = (new_w - inner_w) // 2
            crop_y = (new_h - inner_h) // 2
            cat_img = cat_img.crop((crop_x, crop_y, crop_x + inner_w, crop_y + inner_h))
            img.paste(cat_img, (inner_x1, inner_y1))
        except Exception as e:
            # 照片加载失败时填充占位色
            draw.rectangle([(inner_x1, inner_y1), (inner_x2, inner_y2)], fill='#e8dcc8')
            print(f"Warning: could not load {photo_file}: {e}")

        # 年份标签（相框下方）
        label_y = fy + frame_h + 8
        draw.text((fx + frame_w // 2 - 22, label_y), year, fill='#c8a878', font=font)

    img.save('photo_wall.jpg', 'JPEG', quality=92)
    print("Photo wall image photo_wall.jpg generated")


if __name__ == '__main__':
    create_room_background()
    create_pen_image()
    create_pen_holder_image()
    create_sofa_corner_image()
    create_drawer_background()
    create_window_close_background()
    create_photo_wall_image()
    print("\nAll images generated successfully!")
