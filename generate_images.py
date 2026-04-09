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

    # 书架 (右侧 75%, 35%, 12%x30%)
    bs_x = int(width * 0.75)
    bs_y = int(height * 0.35)
    bs_w = int(width * 0.12)
    bs_h = int(height * 0.30)
    # 书架外框
    draw.rectangle([(bs_x, bs_y), (bs_x+bs_w, bs_y+bs_h)],
                   fill='#5c3a1e', outline='#3a2010', width=3)
    # 书架隔板（3层）
    shelf_gap = bs_h // 4
    for i in range(1, 4):
        sy = bs_y + shelf_gap * i
        draw.rectangle([(bs_x+2, sy-3), (bs_x+bs_w-2, sy)], fill='#3a2010')
    # 书本（第一层）
    book_colors = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad']
    bx = bs_x + 6
    for i, col in enumerate(book_colors):
        bw = bs_w // 6
        draw.rectangle([(bx, bs_y+4), (bx+bw-2, bs_y+shelf_gap-4)], fill=col)
        bx += bw
    # 书本（第二层）
    book_colors2 = ['#1abc9c', '#e74c3c', '#3498db', '#e67e22']
    bx = bs_x + 6
    for i, col in enumerate(book_colors2):
        bw = bs_w // 5
        draw.rectangle([(bx, bs_y+shelf_gap+4), (bx+bw-2, bs_y+shelf_gap*2-4)], fill=col)
        bx += bw
    # 音乐盒（第三层，金色小盒子）
    mb_x = bs_x + bs_w//4
    mb_y = bs_y + shelf_gap*2 + 6
    mb_w = bs_w // 2
    mb_h = shelf_gap - 12
    draw.rectangle([(mb_x, mb_y), (mb_x+mb_w, mb_y+mb_h)],
                   fill='#c8960c', outline='#f0c040', width=2)
    # 音乐盒装饰线
    draw.line([(mb_x+4, mb_y+mb_h//2), (mb_x+mb_w-4, mb_y+mb_h//2)],
              fill='#f0c040', width=1)

    # 食盆 (沙发左侧 3%, 78%, 8%x8%)
    fb_x = int(width * 0.03)
    fb_y = int(height * 0.78)
    fb_w = int(width * 0.08)
    fb_h = int(height * 0.08)
    fb_cx = fb_x + fb_w // 2
    fb_cy = fb_y + fb_h // 2
    # 盆底椭圆
    draw.ellipse([(fb_cx-fb_w//2, fb_cy-fb_h//4), (fb_cx+fb_w//2, fb_cy+fb_h//4)],
                 fill='#c0c0c0', outline='#808080', width=2)
    # 盆口
    draw.ellipse([(fb_cx-fb_w//2-4, fb_cy-fb_h//2-4), (fb_cx+fb_w//2+4, fb_cy-fb_h//4+4)],
                 fill='#d8d8d8', outline='#909090', width=2)

    # 画框 (书架左侧墙面 60%, 18%, 8%x20%)
    pf_x = int(width * 0.60)
    pf_y = int(height * 0.18)
    pf_w = int(width * 0.08)
    pf_h = int(height * 0.20)
    # 画框外框
    draw.rectangle([(pf_x, pf_y), (pf_x+pf_w, pf_y+pf_h)],
                   fill='#8b6914', outline='#f0c040', width=3)
    # 画框内容（草地小景）
    draw.rectangle([(pf_x+4, pf_y+4), (pf_x+pf_w-4, pf_y+pf_h-4)],
                   fill='#4a9a3a')
    draw.rectangle([(pf_x+4, pf_y+4), (pf_x+pf_w-4, pf_y+pf_h//2)],
                   fill='#87ceeb')

    # 玩具箱 (桌子右侧 82%, 76%, 10%x8%)
    tb_x = int(width * 0.82)
    tb_y = int(height * 0.76)
    tb_w = int(width * 0.10)
    tb_h = int(height * 0.08)
    draw.rectangle([(tb_x, tb_y), (tb_x+tb_w, tb_y+tb_h)],
                   fill='#6b4423', outline='#3a2010', width=2)
    # 木箱盖分割线
    draw.line([(tb_x+2, tb_y+tb_h//3), (tb_x+tb_w-2, tb_y+tb_h//3)],
              fill='#3a2010', width=2)
    # 锁扣
    lk_x = tb_x + tb_w//2
    lk_y = tb_y + tb_h//3 + 4
    draw.rectangle([(lk_x-5, lk_y), (lk_x+5, lk_y+8)], fill='#c8a060')

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


    img.save('photo_wall.jpg', 'JPEG', quality=92)
    print("Photo wall image photo_wall.jpg generated")


def create_bookshelf_image():
    """书架特写场景 1200x800 - 暖色木质书架，中央音乐盒"""
    import math
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#2c1a0e')
    draw = ImageDraw.Draw(img)

    # 背景墙纸纹理
    for i in range(0, width, 60):
        draw.line([(i, 0), (i, height)], fill='#331a0a', width=1)
    for j in range(0, height, 60):
        draw.line([(0, j), (width, j)], fill='#331a0a', width=1)

    # 书架主体（居中，占画面大部分）
    bs_x, bs_y = 100, 60
    bs_w, bs_h = 1000, 680
    # 书架背板
    draw.rectangle([(bs_x, bs_y), (bs_x+bs_w, bs_y+bs_h)],
                   fill='#4a2e14', outline='#2a1508', width=6)
    # 书架侧板加厚
    draw.rectangle([(bs_x, bs_y), (bs_x+30, bs_y+bs_h)], fill='#3a2010')
    draw.rectangle([(bs_x+bs_w-30, bs_y), (bs_x+bs_w, bs_y+bs_h)], fill='#3a2010')
    # 顶板底板
    draw.rectangle([(bs_x, bs_y), (bs_x+bs_w, bs_y+28)], fill='#3a2010')
    draw.rectangle([(bs_x, bs_y+bs_h-28), (bs_x+bs_w, bs_y+bs_h)], fill='#3a2010')

    # 4层隔板
    shelf_h = (bs_h - 56) // 4
    shelves_y = []
    for i in range(5):
        sy = bs_y + 28 + shelf_h * i
        shelves_y.append(sy)
        if i < 4:
            draw.rectangle([(bs_x+30, sy+shelf_h-12), (bs_x+bs_w-30, sy+shelf_h)],
                           fill='#3a2010')

    # 第一层：书本
    book_data = [
        ('#c0392b', 55), ('#2980b9', 70), ('#27ae60', 48), ('#f39c12', 62),
        ('#8e44ad', 55), ('#1abc9c', 45), ('#e74c3c', 68), ('#3498db', 52),
        ('#e67e22', 60), ('#16a085', 50),
    ]
    bx = bs_x + 40
    row_y = shelves_y[0] + 8
    row_bot = shelves_y[0] + shelf_h - 16
    for col, bw in book_data:
        draw.rectangle([(bx, row_y), (bx+bw-4, row_bot)], fill=col, outline='#00000033', width=1)
        # 书脊装饰线
        draw.line([(bx+bw//2, row_y+6), (bx+bw//2, row_bot-6)], fill='#ffffff33', width=1)
        bx += bw

    # 第二层：书本 + 小摆件
    book_data2 = [
        ('#d35400', 60), ('#2c3e50', 75), ('#7f8c8d', 50), ('#c0392b', 55),
        ('#27ae60', 65), ('#8e44ad', 48),
    ]
    bx = bs_x + 40
    row_y = shelves_y[1] + 8
    row_bot = shelves_y[1] + shelf_h - 16
    for col, bw in book_data2:
        draw.rectangle([(bx, row_y), (bx+bw-4, row_bot)], fill=col, outline='#00000033', width=1)
        draw.line([(bx+bw//2, row_y+6), (bx+bw//2, row_bot-6)], fill='#ffffff33', width=1)
        bx += bw
    # 小猫摆件
    fig_x = bx + 20
    fig_y = row_bot - 50
    draw.ellipse([(fig_x-15, fig_y-20), (fig_x+15, fig_y)], fill='#c8a878', outline='#8b6914', width=2)
    draw.ellipse([(fig_x-12, fig_y-4), (fig_x+12, fig_y+30)], fill='#c8a878', outline='#8b6914', width=2)
    draw.polygon([(fig_x-12, fig_y-20), (fig_x-18, fig_y-32), (fig_x-5, fig_y-20)], fill='#c8a878')
    draw.polygon([(fig_x+5, fig_y-20), (fig_x+18, fig_y-32), (fig_x+12, fig_y-20)], fill='#c8a878')

    # 第三层：音乐盒（主角，居中突出）
    row_y3 = shelves_y[2] + 10
    row_bot3 = shelves_y[2] + shelf_h - 14
    mb_h = row_bot3 - row_y3
    mb_w = 320
    mb_x = bs_x + (bs_w - mb_w) // 2
    # 音乐盒主体
    draw.rectangle([(mb_x, row_y3), (mb_x+mb_w, row_bot3)],
                   fill='#8B6914', outline='#f0c040', width=4)
    # 金色渐变效果（用多条线模拟）
    for i in range(0, mb_w, 4):
        alpha = int(40 * abs(math.sin(i / mb_w * math.pi)))
        shade = f'#{min(0xC8+alpha,0xFF):02x}{min(0x96+alpha//2,0xFF):02x}{min(0x0C+alpha//4,0xFF):02x}'
        draw.line([(mb_x+i, row_y3+4), (mb_x+i, row_bot3-4)], fill=shade, width=3)
    # 音乐盒盖子分割线
    lid_y = row_y3 + mb_h // 3
    draw.line([(mb_x+4, lid_y), (mb_x+mb_w-4, lid_y)], fill='#f0c040', width=2)
    # 盖子上的装饰花纹
    cx = mb_x + mb_w // 2
    cy = row_y3 + mb_h // 6
    draw.ellipse([(cx-20, cy-12), (cx+20, cy+12)], outline='#f0c040', width=2)
    draw.line([(cx-30, cy), (cx+30, cy)], fill='#f0c040', width=1)
    draw.line([(cx, cy-18), (cx, cy+18)], fill='#f0c040', width=1)
    # 三个按钮
    btn_labels = ['2022', '2024', '2026']
    btn_y = row_y3 + mb_h * 2 // 3 + 4
    btn_spacing = mb_w // 4
    for i, lbl in enumerate(btn_labels):
        bx2 = mb_x + btn_spacing * (i+1) - 30
        draw.rectangle([(bx2, btn_y), (bx2+60, btn_y+24)],
                       fill='#a07010', outline='#f0c040', width=2)
        try:
            font_small = ImageFont.truetype("arial.ttf", 12)
        except:
            font_small = ImageFont.load_default()
        draw.text((bx2+8, btn_y+5), lbl, fill='#fff8e0', font=font_small)
    # 两侧书本（衬托）
    for col, bw in [('#2c3e50', 55), ('#7f8c8d', 45)]:
        draw.rectangle([(bs_x+40, row_y3), (bs_x+40+bw, row_bot3)], fill=col)
        draw.rectangle([(bs_x+bs_w-40-bw, row_y3), (bs_x+bs_w-40, row_bot3)], fill=col)

    # 第四层：杂物
    book_data4 = [('#95a5a6', 50), ('#bdc3c7', 65), ('#7f8c8d', 45), ('#ecf0f1', 55)]
    bx = bs_x + 40
    row_y4 = shelves_y[3] + 8
    row_bot4 = shelves_y[3] + shelf_h - 16
    for col, bw in book_data4:
        draw.rectangle([(bx, row_y4), (bx+bw-4, row_bot4)], fill=col)
        bx += bw
    # 小花瓶
    vx = bx + 30
    vy = row_bot4 - 60
    draw.ellipse([(vx-15, vy+30), (vx+15, vy+60)], fill='#5b8a6e', outline='#3a6a4e', width=2)
    draw.rectangle([(vx-8, vy), (vx+8, vy+35)], fill='#5b8a6e')
    draw.ellipse([(vx-12, vy-5), (vx+12, vy+5)], fill='#5b8a6e', outline='#3a6a4e', width=2)

    img.save('bookshelf.jpg', 'JPEG', quality=92)
    print("Bookshelf image bookshelf.jpg generated")


def create_balcony_image():
    """阳台场景 1200x800 - 明亮户外感，爪印+花盆"""
    import math
    width, height = 1200, 800
    # 天空渐变
    img = Image.new('RGB', (width, height), color='#87ceeb')
    draw = ImageDraw.Draw(img)

    # 天空渐变（从上到下）
    for y in range(int(height * 0.55)):
        ratio = y / (height * 0.55)
        r = int(135 + (176 - 135) * ratio)
        g = int(206 + (224 - 206) * ratio)
        b = int(235 + (230 - 235) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # 远处建筑轮廓
    buildings = [(0, 320, 180, 480), (160, 280, 320, 480), (300, 300, 420, 480),
                 (800, 260, 960, 480), (940, 300, 1100, 480), (1080, 280, 1200, 480)]
    for bx1, by1, bx2, by2 in buildings:
        draw.rectangle([(bx1, by1), (bx2, by2)], fill='#b0c4d8')
        # 窗户
        for wx in range(bx1+15, bx2-10, 30):
            for wy in range(by1+15, by2-10, 25):
                draw.rectangle([(wx, wy), (wx+14, wy+16)], fill='#d4e8f0')

    # 地板（阳台地砖）
    floor_y = int(height * 0.60)
    for y in range(floor_y, height, 2):
        ratio = (y - floor_y) / (height - floor_y)
        r = int(180 + (140 - 180) * ratio)
        g = int(160 + (120 - 160) * ratio)
        b = int(130 + (90 - 130) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    # 地砖缝
    for x in range(0, width, 80):
        draw.line([(x, floor_y), (x, height)], fill='#a09070', width=1)
    for y in range(floor_y, height, 60):
        draw.line([(0, y), (width, y)], fill='#a09070', width=1)

    # 栏杆
    rail_y = floor_y - 10
    draw.rectangle([(0, rail_y), (width, rail_y+12)], fill='#c8b89a')
    draw.rectangle([(0, rail_y-60), (width, rail_y-56)], fill='#c8b89a')
    for x in range(20, width, 40):
        draw.rectangle([(x, rail_y-60), (x+8, rail_y+12)], fill='#b8a88a')

    # 爪印（从左向右延伸到花盆方向）
    paw_positions = [
        (200, floor_y+40), (260, floor_y+55), (330, floor_y+45),
        (400, floor_y+60), (470, floor_y+50), (540, floor_y+65),
        (620, floor_y+55), (700, floor_y+70), (760, floor_y+60),
    ]
    for px, py in paw_positions:
        # 主掌垫
        draw.ellipse([(px-10, py-8), (px+10, py+8)], fill='#8b6a4a', outline='#6b4a2a', width=1)
        # 四个趾垫
        for angle, dist in [((-25, -18), 9), ((0, -20), 9), ((25, -18), 9), ((-12, -22), 7)]:
            tx = px + angle[0]
            ty = py + angle[1]
            draw.ellipse([(tx-4, ty-4), (tx+4, ty+4)], fill='#8b6a4a')

    # 花盆（右侧，爪印终点）
    pot_x, pot_y = 820, floor_y + 30
    pot_w, pot_h = 160, 180
    # 花盆主体（梯形）
    draw.polygon([
        (pot_x + 20, pot_y),
        (pot_x + pot_w - 20, pot_y),
        (pot_x + pot_w, pot_y + pot_h),
        (pot_x, pot_y + pot_h)
    ], fill='#8B4513', outline='#5C2E00', width=3)
    # 花盆边沿
    draw.ellipse([(pot_x+10, pot_y-10), (pot_x+pot_w-10, pot_y+10)],
                 fill='#a05020', outline='#5C2E00', width=2)
    # 土壤
    draw.ellipse([(pot_x+22, pot_y-4), (pot_x+pot_w-22, pot_y+8)],
                 fill='#4a2e14')
    # 植物
    stem_x = pot_x + pot_w // 2
    stem_y = pot_y - 5
    draw.line([(stem_x, stem_y), (stem_x-20, stem_y-60)], fill='#2d7a2d', width=3)
    draw.line([(stem_x, stem_y), (stem_x+15, stem_y-50)], fill='#2d7a2d', width=3)
    draw.line([(stem_x, stem_y), (stem_x, stem_y-80)], fill='#2d7a2d', width=3)
    # 叶子
    for lx, ly, lw, lh in [
        (stem_x-40, stem_y-80, 40, 20),
        (stem_x+5, stem_y-65, 35, 18),
        (stem_x-20, stem_y-100, 45, 22),
    ]:
        draw.ellipse([(lx, ly), (lx+lw, ly+lh)], fill='#3a9a3a', outline='#2d7a2d', width=1)

    # 另一个小花盆（左侧装饰）
    sp_x, sp_y = 150, floor_y + 80
    draw.polygon([
        (sp_x+10, sp_y), (sp_x+80, sp_y),
        (sp_x+90, sp_y+90), (sp_x, sp_y+90)
    ], fill='#a05020', outline='#5C2E00', width=2)
    draw.ellipse([(sp_x+5, sp_y-6), (sp_x+85, sp_y+6)], fill='#b06030', outline='#5C2E00', width=2)
    draw.ellipse([(sp_x+12, sp_y-2), (sp_x+78, sp_y+6)], fill='#4a2e14')
    # 小草
    for gx in range(sp_x+20, sp_x+75, 12):
        draw.line([(gx, sp_y-2), (gx-5, sp_y-30)], fill='#3a9a3a', width=2)
        draw.line([(gx, sp_y-2), (gx+5, sp_y-28)], fill='#3a9a3a', width=2)

    # 阳光光晕
    for r in range(80, 0, -10):
        alpha = int(15 * (1 - r/80))
        draw.ellipse([(width//2-r*3, -r*2), (width//2+r*3, r*2)],
                     fill=(255, 255, 200))

    img.save('balcony.jpg', 'JPEG', quality=92)
    print("Balcony image balcony.jpg generated")


def create_food_bowl_image():
    """食盆场景 1200x800 - 温暖地板，食盆+喂食记录卡"""
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#3d2f1f')
    draw = ImageDraw.Draw(img)

    # 地板纹理
    for i in range(0, width, 80):
        draw.line([(i, 0), (i, height)], fill='#4a3828', width=1)
    for j in range(0, height, 80):
        draw.line([(0, j), (width, j)], fill='#4a3828', width=1)

    # 沙发底部（上方）
    draw.rectangle([(0, 0), (width, 120)], fill='#5c3a1e')
    draw.rectangle([(0, 115), (width, 130)], fill='#3a2010')

    # 食盆（居中偏左）
    bowl_cx, bowl_cy = 420, 520
    # 盆底
    draw.ellipse([(bowl_cx-100, bowl_cy-30), (bowl_cx+100, bowl_cy+30)], fill='#c0c0c0', outline='#808080', width=3)
    # 盆身（梯形）
    draw.polygon([
        (bowl_cx-100, bowl_cy-30),
        (bowl_cx+100, bowl_cy-30),
        (bowl_cx+130, bowl_cy-120),
        (bowl_cx-130, bowl_cy-120)
    ], fill='#d0d0d0', outline='#909090')
    # 盆口
    draw.ellipse([(bowl_cx-130, bowl_cy-140), (bowl_cx+130, bowl_cy-100)], fill='#e0e0e0', outline='#909090', width=3)
    # 盆内猫粮（小圆粒）
    import random
    random.seed(42)
    for _ in range(30):
        fx = bowl_cx + random.randint(-80, 80)
        fy = bowl_cy - 125 + random.randint(0, 20)
        r = random.randint(4, 8)
        col = random.choice(['#c8a060', '#b08040', '#d4b070'])
        draw.ellipse([(fx-r, fy-r//2), (fx+r, fy+r//2)], fill=col)
    # 盆上的"朵朵"字样
    try:
        font = ImageFont.truetype("simhei.ttf", 20)
    except:
        font = ImageFont.load_default()
    draw.text((bowl_cx-22, bowl_cy-80), "朵朵", fill='#606060', font=font)

    # 喂食记录卡（右侧）
    card_x, card_y = 680, 340
    card_w, card_h = 360, 300
    # 卡片背景
    draw.rectangle([(card_x, card_y), (card_x+card_w, card_y+card_h)],
                   fill='#fffde7', outline='#c8a060', width=3)
    # 卡片标题
    try:
        font_title = ImageFont.truetype("simhei.ttf", 22)
        font_body = ImageFont.truetype("simhei.ttf", 18)
    except:
        font_title = ImageFont.load_default()
        font_body = font_title
    draw.text((card_x+20, card_y+16), "朵朵喂食记录", fill='#5c3a1e', font=font_title)
    draw.line([(card_x+16, card_y+50), (card_x+card_w-16, card_y+50)], fill='#c8a060', width=2)
    records = [
        ("早  7:00", "🌅"),
        ("午 12:00", "☀️"),
        ("晚  6:00", "🌆"),
        ("夜 10:00", "🌙"),
    ]
    for i, (time_str, icon) in enumerate(records):
        ty = card_y + 68 + i * 52
        draw.text((card_x+24, ty), f"{icon} {time_str}", fill='#3d2f1f', font=font_body)
        draw.line([(card_x+16, ty+38), (card_x+card_w-16, ty+38)], fill='#e8d8b0', width=1)
    # 便利贴装饰（右下角）
    draw.rectangle([(card_x+card_w-50, card_y+card_h-50), (card_x+card_w-10, card_y+card_h-10)],
                   fill='#fff176', outline='#f0c040', width=1)

    img.save('food_bowl.jpg', 'JPEG', quality=92)
    print("Food bowl image food_bowl.jpg generated")


def create_painting_image():
    """画框谜题场景 1200x800 - 深色墙面，中央挂一幅草地画，四周有方向标记"""
    import math
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#1a1a2e')
    draw = ImageDraw.Draw(img)

    # 墙纸纹理
    for i in range(0, width, 50):
        draw.line([(i, 0), (i, height)], fill='#1e1e35', width=1)
    for j in range(0, height, 50):
        draw.line([(0, j), (width, j)], fill='#1e1e35', width=1)

    # 画框（居中）
    frame_x, frame_y = 300, 120
    frame_w, frame_h = 600, 560
    # 外框
    draw.rectangle([(frame_x-12, frame_y-12), (frame_x+frame_w+12, frame_y+frame_h+12)],
                   fill='#8b6914', outline='#f0c040', width=4)
    # 内框
    draw.rectangle([(frame_x, frame_y), (frame_x+frame_w, frame_y+frame_h)],
                   fill='#2d5a27')
    # 草地（下半部分）
    draw.rectangle([(frame_x, frame_y+frame_h//2), (frame_x+frame_w, frame_y+frame_h)],
                   fill='#3a7a30')
    # 草地纹理
    for gx in range(frame_x+10, frame_x+frame_w, 20):
        gy = frame_y + frame_h//2
        draw.line([(gx, gy), (gx-5, gy-20)], fill='#4a9a3a', width=2)
        draw.line([(gx, gy), (gx+5, gy-18)], fill='#4a9a3a', width=2)
    # 天空（上半部分）
    for y in range(frame_y, frame_y+frame_h//2):
        ratio = (y - frame_y) / (frame_h//2)
        r = int(100 + (135-100)*ratio)
        g = int(149 + (206-149)*ratio)
        b = int(237 + (235-237)*ratio)
        draw.line([(frame_x, y), (frame_x+frame_w, y)], fill=(r,g,b))
    # 太阳
    sun_x, sun_y = frame_x + frame_w*3//4, frame_y + 80
    draw.ellipse([(sun_x-35, sun_y-35), (sun_x+35, sun_y+35)], fill='#ffe066')
    for angle in range(0, 360, 30):
        sx = sun_x + int(50*math.cos(math.radians(angle)))
        sy = sun_y + int(50*math.sin(math.radians(angle)))
        ex = sun_x + int(65*math.cos(math.radians(angle)))
        ey = sun_y + int(65*math.sin(math.radians(angle)))
        draw.line([(sx, sy), (ex, ey)], fill='#ffe066', width=2)
    # 小猫（草地上）
    cat_x, cat_y = frame_x + frame_w//3, frame_y + frame_h*3//4
    draw.ellipse([(cat_x-20, cat_y-16), (cat_x+20, cat_y+16)], fill='#c8a878', outline='#8b6914', width=2)
    draw.ellipse([(cat_x-16, cat_y+12), (cat_x+16, cat_y+40)], fill='#c8a878', outline='#8b6914', width=2)
    draw.polygon([(cat_x-16, cat_y-16), (cat_x-22, cat_y-28), (cat_x-6, cat_y-16)], fill='#c8a878')
    draw.polygon([(cat_x+6, cat_y-16), (cat_x+22, cat_y-28), (cat_x+16, cat_y-16)], fill='#c8a878')

    # 四个方向标记（画框四周，用虚线框标出热点位置）
    directions = [
        ('↑', frame_x+frame_w//2-30, frame_y-70, 60, 50),
        ('→', frame_x+frame_w+20, frame_y+frame_h//2-25, 60, 50),
        ('←', frame_x-80, frame_y+frame_h//2-25, 60, 50),
        ('↓', frame_x+frame_w//2-30, frame_y+frame_h+20, 60, 50),
    ]
    try:
        font_arrow = ImageFont.truetype("arial.ttf", 28)
    except:
        font_arrow = ImageFont.load_default()
    for arrow, dx, dy, dw, dh in directions:
        draw.rectangle([(dx, dy), (dx+dw, dy+dh)],
                       fill='rgba(200,160,80,0)', outline='#c8a050', width=2)
        draw.text((dx+dw//2-10, dy+dh//2-14), arrow, fill='#c8a050', font=font_arrow)

    img.save('painting.jpg', 'JPEG', quality=92)
    print("Painting image painting.jpg generated")


def create_toy_box_image():
    """玩具箱场景 1200x800 - 木质地板，中央小木箱+图案锁"""
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#2a1e0e')
    draw = ImageDraw.Draw(img)

    # 地板纹理
    for i in range(0, width, 100):
        draw.line([(i, 0), (i, height)], fill='#332510', width=1)
    for j in range(0, height, 60):
        draw.line([(0, j), (width, j)], fill='#332510', width=1)

    # 桌子底部（上方）
    draw.rectangle([(0, 0), (width, 80)], fill='#5c3a1e')
    draw.rectangle([(0, 75), (width, 90)], fill='#3a2010')
    # 桌腿
    draw.rectangle([(100, 80), (130, 300)], fill='#4a2e14')
    draw.rectangle([(width-130, 80), (width-100, 300)], fill='#4a2e14')

    # 木箱（居中）
    box_x, box_y = 350, 280
    box_w, box_h = 500, 320
    # 箱体
    draw.rectangle([(box_x, box_y), (box_x+box_w, box_y+box_h)],
                   fill='#6b4423', outline='#3a2010', width=4)
    # 木纹
    for i in range(box_y+20, box_y+box_h, 40):
        draw.line([(box_x+8, i), (box_x+box_w-8, i)], fill='#5a3818', width=1)
    # 箱盖分割线
    lid_y = box_y + box_h//3
    draw.line([(box_x+4, lid_y), (box_x+box_w-4, lid_y)], fill='#3a2010', width=3)
    # 铰链
    for hx in [box_x+80, box_x+box_w//2, box_x+box_w-80]:
        draw.rectangle([(hx-8, lid_y-6), (hx+8, lid_y+6)], fill='#c8a060', outline='#8b6914', width=1)
    # 锁扣（中央）
    lock_x = box_x + box_w//2
    lock_y = lid_y + 20
    draw.rectangle([(lock_x-30, lock_y), (lock_x+30, lock_y+40)],
                   fill='#c8a060', outline='#8b6914', width=2)
    draw.arc([(lock_x-18, lock_y-20), (lock_x+18, lock_y+10)], start=180, end=0, fill='#8b6914', width=4)

    # 图案锁按钮区域（箱盖下方）
    btn_y = lid_y + 80
    btn_labels = ['🐟', '🐾', '🔔', '⚽']
    btn_spacing = box_w // 5
    try:
        font_emoji = ImageFont.truetype("seguiemj.ttf", 36)
    except:
        try:
            font_emoji = ImageFont.truetype("arial.ttf", 28)
        except:
            font_emoji = ImageFont.load_default()
    for i, lbl in enumerate(btn_labels):
        bx = box_x + btn_spacing*(i+1) - 35
        draw.rectangle([(bx, btn_y), (bx+70, btn_y+60)],
                       fill='#4a2e14', outline='#8b6914', width=2)
        draw.text((bx+10, btn_y+8), lbl, fill='#c8a060', font=font_emoji)

    # 爪印装饰（地板上）
    paw_positions = [(200, 650), (280, 680), (360, 660), (440, 690)]
    for px, py in paw_positions:
        draw.ellipse([(px-8, py-6), (px+8, py+6)], fill='#5c3a1e')
        for angle, dist in [(-20, 12), (0, 14), (20, 12)]:
            tx = px + angle
            ty = py - dist
            draw.ellipse([(tx-4, ty-3), (tx+4, ty+3)], fill='#5c3a1e')

    img.save('toy_box.jpg', 'JPEG', quality=92)
    print("Toy box image toy_box.jpg generated")


if __name__ == '__main__':
    create_room_background()
    create_pen_image()
    create_pen_holder_image()
    create_sofa_corner_image()
    create_drawer_background()
    create_window_close_background()
    create_photo_wall_image()
    create_bookshelf_image()
    create_balcony_image()
    create_food_bowl_image()
    create_painting_image()
    create_toy_box_image()
    print("\nAll images generated successfully!")
