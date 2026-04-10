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
    """阳台场景 1200x800 - 傍晚暖光，石板地面，三盆植物，隐约刻纹砖块"""
    import math, random
    random.seed(7)
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#e8c88a')
    draw = ImageDraw.Draw(img)

    floor_y = _draw_balcony_base(draw, img, width, height,
        sky_colors=[(255,180,120),(210,130,160)],
        floor_color_top=(160,148,120), floor_color_bot=(130,118,95))

    # ── 共用植物/爪印/砖块 ──
    _draw_balcony_plants(draw, floor_y, width, height, random_mod=7)

    img.save('balcony.jpg', 'JPEG', quality=92)
    print("Balcony image balcony.jpg generated")


def _draw_balcony_base(draw, img, width, height, sky_colors, floor_color_top, floor_color_bot, light_overlay=None):
    """公共：天空+地板+栏杆+砖块刻纹，返回 floor_y"""
    import math, random
    random.seed(7)

    sky_h = int(height * 0.52)
    floor_y = int(height * 0.58)

    # 天空
    r0,g0,b0 = sky_colors[0]
    r1,g1,b1 = sky_colors[1]
    for y in range(sky_h):
        t = y / sky_h
        draw.line([(0,y),(width,y)], fill=(int(r0+(r1-r0)*t), int(g0+(g1-g0)*t), int(b0+(b1-b0)*t)))

    # 远山
    mountain_pts = [(0,sky_h),(120,sky_h-80),(260,sky_h-50),(400,sky_h-110),
                    (560,sky_h-60),(700,sky_h-130),(860,sky_h-70),(1000,sky_h-100),
                    (1200,sky_h-55),(1200,sky_h),(0,sky_h)]
    draw.polygon(mountain_pts, fill='#c0a070')
    for tx in [80,200,950,1080]:
        draw.rectangle([(tx-6,sky_h-90),(tx+6,sky_h-20)], fill='#7a5030')
        draw.ellipse([(tx-28,sky_h-130),(tx+28,sky_h-60)], fill='#4a7030')

    # 地板渐变
    rt,gt,bt = floor_color_top
    rb,gb,bb = floor_color_bot
    for y in range(floor_y, height):
        t = (y-floor_y)/(height-floor_y)
        draw.line([(0,y),(width,y)], fill=(int(rt+(rb-rt)*t), int(gt+(gb-gt)*t), int(bt+(bb-bt)*t)))

    # 光线叠加（可选）
    if light_overlay:
        overlay = Image.new('RGBA', (width, height), (0,0,0,0))
        od = ImageDraw.Draw(overlay)
        lx, ly, lcolor, lalpha = light_overlay
        for i in range(30):
            a = int(lalpha * (1 - i/30))
            od.polygon(lx(i), fill=(*lcolor, a))
        img.paste(Image.alpha_composite(img.convert('RGBA'), overlay).convert('RGB'))

    # 石板缝
    row_gaps = [40,48,58,70,85,105]
    cy2 = floor_y
    row_ys = [floor_y]
    for gap in row_gaps:
        cy2 += gap
        if cy2 < height:
            row_ys.append(cy2)
            draw.line([(0,cy2),(width,cy2)], fill='#9a8860', width=2)
    for i, ry in enumerate(row_ys[:-1]):
        next_ry = row_ys[i+1] if i+1 < len(row_ys) else height
        offset = (i%2)*60; col_w = 100+i*15
        for cx3 in range(offset, width+col_w, col_w):
            draw.line([(cx3,ry),(cx3,next_ry)], fill='#9a8860', width=1)
    for _ in range(600):
        nx=random.randint(0,width-1); ny=random.randint(floor_y,height-1)
        nc=random.randint(130,170)
        draw.point((nx,ny), fill=(nc,nc-10,nc-20))

    # 栏杆
    rail_y = floor_y - 8
    draw.rectangle([(0,rail_y-4),(width,rail_y+8)], fill='#5a4030')
    draw.rectangle([(0,rail_y-2),(width,rail_y+6)], fill='#7a5840')
    draw.rectangle([(0,rail_y-72),(width,rail_y-64)], fill='#5a4030')
    draw.rectangle([(0,rail_y-70),(width,rail_y-66)], fill='#7a5840')
    for x in range(16, width, 36):
        draw.rectangle([(x,rail_y-72),(x+6,rail_y+8)], fill='#6a4830')
        draw.line([(x+1,rail_y-72),(x+1,rail_y+8)], fill='#9a7858', width=1)

    return floor_y


def _draw_cat_sitting(draw, cx, cy, facing='right', fur='#d4b080', stripe='#b8905a'):
    """在 (cx,cy) 画一只坐姿猫，facing='right'或'left'，fur=毛色，stripe=条纹色"""
    import math
    f = 1 if facing == 'right' else -1
    outline = '#7a5030'

    # ── 尾巴（先画，在身体后面）──
    # 尾巴从臀部绕到身体侧面
    tail_base_x = cx - f * 28
    tail_base_y = cy + 10
    for i in range(8, 0, -1):
        t = i / 8
        tx = tail_base_x - f * int(30 * math.sin(t * math.pi * 0.7))
        ty = tail_base_y + int(35 * (1 - t))
        r = 6 + i
        draw.ellipse([(tx-r, ty-r//2), (tx+r, ty+r//2)], fill=fur)

    # ── 后腿/臀部（椭圆，两侧）──
    draw.ellipse([(cx - 32, cy - 5), (cx + 32, cy + 30)], fill=fur, outline=outline, width=1)

    # ── 身体（圆润椭圆）──
    draw.ellipse([(cx - 26, cy - 38), (cx + 26, cy + 18)], fill=fur, outline=outline, width=1)

    # ── 身体条纹 ──
    for dy in [-20, -8, 4]:
        draw.arc([(cx - 20, cy + dy - 4), (cx + 20, cy + dy + 4)],
                 180 + f * 20, 360 - f * 20, fill=stripe, width=2)

    # ── 前爪（两只，放在身体前方地面）──
    paw_y = cy + 22
    for px_off in [-10, 8]:
        paw_x = cx + f * px_off
        draw.ellipse([(paw_x - 10, paw_y - 6), (paw_x + 10, paw_y + 6)],
                     fill=fur, outline=outline, width=1)
        # 趾线
        for toe in [-5, 0, 5]:
            draw.line([(paw_x + toe, paw_y + 2), (paw_x + toe, paw_y + 7)],
                      fill=outline, width=1)

    # ── 颈部 ──
    draw.ellipse([(cx - 12, cy - 50), (cx + 12, cy - 28)], fill=fur, outline=outline, width=1)

    # ── 头部 ──
    hx = cx + f * 4
    hy = cy - 68
    draw.ellipse([(hx - 22, hy - 20), (hx + 22, hy + 20)], fill=fur, outline=outline, width=2)

    # ── 耳朵 ──
    # 外耳
    draw.polygon([(hx + f * 6, hy - 18), (hx + f * 20, hy - 38), (hx + f * 22, hy - 14)], fill=fur)
    draw.polygon([(hx - f * 6, hy - 18), (hx - f * 16, hy - 36), (hx - f * 18, hy - 14)], fill=fur)
    # 耳内粉
    draw.polygon([(hx + f * 8, hy - 18), (hx + f * 18, hy - 34), (hx + f * 19, hy - 16)], fill='#e8a0a0')
    draw.polygon([(hx - f * 8, hy - 18), (hx - f * 14, hy - 32), (hx - f * 15, hy - 16)], fill='#e8a0a0')

    # ── 头部条纹 ──
    for i, (sx, sy, ex, ey) in enumerate([
        (hx - f*2, hy - 18, hx + f*4, hy - 10),
        (hx - f*8, hy - 14, hx - f*2, hy - 6),
    ]):
        draw.line([(sx, sy), (ex, ey)], fill=stripe, width=2)

    # ── 眼睛（半闭，慵懒晒太阳）──
    eye_x = hx + f * 8
    eye_y = hy - 4
    # 眼白
    draw.ellipse([(eye_x - 6, eye_y - 4), (eye_x + 6, eye_y + 4)], fill='#f0e8d0')
    # 瞳孔（细缝）
    draw.ellipse([(eye_x - 2, eye_y - 3), (eye_x + 2, eye_y + 3)], fill='#2a1808')
    # 上眼睑（半闭）
    draw.arc([(eye_x - 6, eye_y - 4), (eye_x + 6, eye_y + 4)], 200, 340, fill=outline, width=2)

    # 另一只眼（稍远）
    eye2_x = hx - f * 4
    draw.ellipse([(eye2_x - 5, eye_y - 3), (eye2_x + 5, eye_y + 3)], fill='#f0e8d0')
    draw.ellipse([(eye2_x - 2, eye_y - 2), (eye2_x + 2, eye_y + 2)], fill='#2a1808')
    draw.arc([(eye2_x - 5, eye_y - 3), (eye2_x + 5, eye_y + 3)], 200, 340, fill=outline, width=2)

    # ── 鼻子 ──
    nx, ny = hx + f * 3, hy + 6
    draw.polygon([(nx, ny - 3), (nx - 4, ny + 3), (nx + 4, ny + 3)], fill='#e08080')

    # ── 嘴 ──
    draw.arc([(nx - 5, ny + 2), (nx + 1, ny + 8)], 0, 180, fill=outline, width=1)
    draw.arc([(nx + 1, ny + 2), (nx + 7, ny + 8)], 0, 180, fill=outline, width=1)

    # ── 胡须 ──
    for wy, wlen, wdir in [(-2, 22, 1), (3, 20, 1), (8, 18, 1)]:
        draw.line([(nx + f * 5, hy + wy), (nx + f * 5 + f * wlen, hy + wy - wdir)],
                  fill='#e8e0d0', width=1)
        draw.line([(nx - f * 5, hy + wy), (nx - f * 5 - f * wlen, hy + wy - wdir)],
                  fill='#e8e0d0', width=1)


def _draw_balcony_plants(draw, floor_y, width, height, random_mod):
    """画三盆植物（仙人掌/向日葵/绿植）和爪印，供三张阳台图共用"""
    import math, random
    random.seed(random_mod)

    # ── 爪印（先画，被植物覆盖）──
    paw_trail = [
        (230, floor_y+55), (285, floor_y+38), (340, floor_y+52),
        (395, floor_y+35), (450, floor_y+50), (490, floor_y+33),
        (660, floor_y+48), (710, floor_y+30), (760, floor_y+46),
        (810, floor_y+32), (865, floor_y+50), (910, floor_y+34),
    ]
    for i, (px, py) in enumerate(paw_trail):
        side = 1 if i % 2 == 0 else -1
        draw.ellipse([(px-10, py-7),(px+10, py+7)], fill='#7a5838')
        for dx, dy in [(-13+side*3, -14), (-4+side*3, -17), (6+side*3, -15), (side*14, -10)]:
            draw.ellipse([(px+dx-4, py+dy-3),(px+dx+4, py+dy+3)], fill='#7a5838')

    # ── 左侧：仙人掌盆 ──
    cact_x, cact_y = 90, floor_y + 15
    draw.polygon([(cact_x, cact_y+110),(cact_x+100, cact_y+110),
                  (cact_x+88, cact_y+160),(cact_x+12, cact_y+160)], fill='#b06030')
    draw.ellipse([(cact_x-4, cact_y+104),(cact_x+104, cact_y+120)], fill='#c07040')
    draw.ellipse([(cact_x+8, cact_y+108),(cact_x+92, cact_y+118)], fill='#3a2010')
    draw.rounded_rectangle([(cact_x+38, cact_y-10),(cact_x+62, cact_y+112)], radius=10, fill='#4a8a30')
    draw.rounded_rectangle([(cact_x+10, cact_y+30),(cact_x+42, cact_y+50)], radius=8, fill='#4a8a30')
    draw.rounded_rectangle([(cact_x+8, cact_y-10),(cact_x+28, cact_y+34)], radius=8, fill='#4a8a30')
    draw.rounded_rectangle([(cact_x+58, cact_y+50),(cact_x+92, cact_y+70)], radius=8, fill='#4a8a30')
    draw.rounded_rectangle([(cact_x+72, cact_y+10),(cact_x+92, cact_y+54)], radius=8, fill='#4a8a30')
    for sy in range(cact_y, cact_y+110, 18):
        draw.line([(cact_x+38, sy+4),(cact_x+30, sy)], fill='#c8d870', width=1)
        draw.line([(cact_x+62, sy+4),(cact_x+70, sy)], fill='#c8d870', width=1)

    # ── 中央：向日葵盆 ──
    sun_x, sun_y = 520, floor_y + 10
    draw.polygon([(sun_x, sun_y+130),(sun_x+120, sun_y+130),
                  (sun_x+108, sun_y+185),(sun_x+12, sun_y+185)], fill='#a05828')
    draw.ellipse([(sun_x-6, sun_y+124),(sun_x+126, sun_y+140)], fill='#b86830')
    draw.ellipse([(sun_x+8, sun_y+128),(sun_x+112, sun_y+138)], fill='#3a2010')
    draw.line([(sun_x+60, sun_y+128),(sun_x+60, sun_y-20)], fill='#3a7020', width=7)
    draw.line([(sun_x+60, sun_y+60),(sun_x+30, sun_y+30)], fill='#3a7020', width=5)
    draw.line([(sun_x+60, sun_y+80),(sun_x+90, sun_y+50)], fill='#3a7020', width=5)
    draw.ellipse([(sun_x+5, sun_y+18),(sun_x+42, sun_y+42)], fill='#4a8a28')
    draw.ellipse([(sun_x+78, sun_y+38),(sun_x+115, sun_y+62)], fill='#4a8a28')
    fcx, fcy = sun_x+60, sun_y-20
    draw.ellipse([(fcx-22, fcy-22),(fcx+22, fcy+22)], fill='#5a3010')
    for ang in range(0, 360, 30):
        px2 = fcx + int(34*math.cos(math.radians(ang)))
        py2 = fcy + int(34*math.sin(math.radians(ang)))
        draw.ellipse([(px2-10, py2-6),(px2+10, py2+6)], fill='#e8b020')

    # ── 右侧：绿植盆（宽叶）──
    grn_x, grn_y = 940, floor_y + 20
    draw.polygon([(grn_x, grn_y+120),(grn_x+130, grn_y+120),
                  (grn_x+116, grn_y+178),(grn_x+14, grn_y+178)], fill='#8a4820')
    draw.ellipse([(grn_x-5, grn_y+114),(grn_x+135, grn_y+130)], fill='#a05830')
    draw.ellipse([(grn_x+10, grn_y+118),(grn_x+120, grn_y+128)], fill='#3a2010')
    leaves = [(-20,-80,30,-20),(10,-100,70,-30),(-40,-60,-5,10),
              (50,-70,95,-10),(20,-120,80,-60),(-10,-50,50,0)]
    for lx1,ly1,lx2,ly2 in leaves:
        draw.ellipse([(grn_x+65+lx1, grn_y+120+ly1),(grn_x+65+lx2, grn_y+120+ly2)],
                     fill=random.choice(['#3a8a30','#4a9a38','#2a7028']))
        mx = (grn_x+65+lx1+grn_x+65+lx2)//2
        my = (grn_y+120+ly1+grn_y+120+ly2)//2
        draw.line([(grn_x+65, grn_y+120),(mx, my)], fill='#2a6020', width=1)

    # ── 四块刻纹砖 ──
    brick_y = int(height * 0.76)
    brick_h = int(height * 0.10)
    brick_w = int(width * 0.10)
    brick_xs = [int(width*0.18), int(width*0.34), int(width*0.50), int(width*0.66)]
    eg = '#6a5a3a'; eg2 = '#8a7858'

    bx = brick_xs[0]; cx2, cy2 = bx+brick_w//2, brick_y+brick_h//2
    R, r = 16, 10
    moon_pts = []
    for a in range(300, 421):
        moon_pts.append((cx2 + int(R*math.cos(math.radians(a))),
                         cy2 + int(R*math.sin(math.radians(a)))))
    for a in range(60, -61, -1):
        moon_pts.append((cx2 + 5 + int(r*math.cos(math.radians(a))),
                         cy2 + int(r*math.sin(math.radians(a)))))
    draw.polygon(moon_pts, fill=eg)
    draw.arc([(cx2-R, cy2-R),(cx2+R, cy2+R)], 300, 60, fill=eg2, width=1)

    bx = brick_xs[1]; cx2, cy2 = bx+brick_w//2, brick_y+brick_h//2
    draw.ellipse([(cx2-7,cy2-7),(cx2+7,cy2+7)], fill=eg)
    for ang in range(0, 360, 45):
        a = math.radians(ang)
        x1 = cx2 + int(10*math.cos(a)); y1 = cy2 + int(10*math.sin(a))
        x2 = cx2 + int(18*math.cos(a)); y2 = cy2 + int(18*math.sin(a))
        draw.line([(x1,y1),(x2,y2)], fill=eg, width=3)
        draw.ellipse([(x2-2,y2-2),(x2+2,y2+2)], fill=eg2)

    bx = brick_xs[2]; cx2, cy2 = bx+brick_w//2, brick_y+brick_h//2
    for off in [-9, 0, 9]:
        pts = []
        for t in range(0, 361, 20):
            x = cx2 - 18 + int(36 * t / 360)
            y = cy2 + off + int(7 * math.sin(math.radians(t)))
            pts.append((x, y))
        for i in range(len(pts)-1):
            draw.line([pts[i], pts[i+1]], fill=eg, width=2)

    bx = brick_xs[3]; cx2, cy2 = bx+brick_w//2, brick_y+brick_h//2
    star_pts = []
    for i in range(10):
        a = math.radians(i * 36 - 90)
        dist = 17 if i % 2 == 0 else 7
        star_pts.append((cx2 + int(dist*math.cos(a)), cy2 + int(dist*math.sin(a))))
    draw.polygon(star_pts, fill=eg)
    inner_pts = []
    for i in range(10):
        a = math.radians(i * 36 - 90)
        dist = 14 if i % 2 == 0 else 5
        inner_pts.append((cx2 + int(dist*math.cos(a)), cy2 + int(dist*math.sin(a))))
    draw.polygon(inner_pts, fill=eg2)


def create_balcony_morning_image():
    """上午10点阳台：阳光从左侧斜射，仙人掌影子向右延伸，朵朵坐在左边晒太阳"""
    import math, random
    random.seed(7)
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#e8d0a0')
    draw = ImageDraw.Draw(img)

    floor_y = _draw_balcony_base(draw, img, width, height,
        sky_colors=[(255,240,200),(220,200,160)],
        floor_color_top=(168,155,125), floor_color_bot=(138,125,100))

    # ── 上午阳光：从左上角射入，暖黄光柱 ──
    light_pts = [
        (0, 0), (320, 0), (width, floor_y+200), (width, floor_y+400), (0, floor_y+100)
    ]
    light_overlay = Image.new('RGBA', (width, height), (0,0,0,0))
    ld = ImageDraw.Draw(light_overlay)
    for i in range(12):
        alpha = int(38 * (1 - i/12))
        ld.polygon(light_pts, fill=(255, 220, 120, alpha))
    img = Image.alpha_composite(img.convert('RGBA'), light_overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    # ── 共用植物/爪印/砖块 ──
    _draw_balcony_plants(draw, floor_y, width, height, random_mod=7)

    # ── 仙人掌影子：上午光从左上，影子向右延伸 ──
    cact_x = 90
    shadow_color = (110, 98, 75, 120)
    shadow = Image.new('RGBA', (width, height), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.polygon([
        (cact_x+38, floor_y+15), (cact_x+62, floor_y+15),
        (cact_x+62+280, floor_y+160), (cact_x+38+260, floor_y+160)
    ], fill=shadow_color)
    sd.polygon([
        (cact_x+8, floor_y+30), (cact_x+42, floor_y+30),
        (cact_x+42+200, floor_y+80), (cact_x+8+190, floor_y+80)
    ], fill=shadow_color)
    sd.polygon([
        (cact_x+58, floor_y+40), (cact_x+92, floor_y+40),
        (cact_x+92+160, floor_y+100), (cact_x+58+155, floor_y+100)
    ], fill=shadow_color)
    img = Image.alpha_composite(img.convert('RGBA'), shadow).convert('RGB')
    draw = ImageDraw.Draw(img)

    # ── 朵朵：坐在阳台左边，一动不动晒太阳 ──
    _draw_cat_sitting(draw, cx=310, cy=floor_y+50, facing='right')

    img.save('balcony_10.jpg', 'JPEG', quality=92)
    print("Balcony morning image balcony_10.jpg generated")


def create_balcony_afternoon_image():
    """下午3点阳台：阳光从右侧低角度斜射，绿植影子向左延伸，朵朵坐在右侧绿植旁"""
    import math, random
    random.seed(7)
    width, height = 1200, 800
    img = Image.new('RGB', (width, height), color='#e8c890')
    draw = ImageDraw.Draw(img)

    floor_y = _draw_balcony_base(draw, img, width, height,
        sky_colors=[(255,210,140),(210,170,110)],
        floor_color_top=(162,148,118), floor_color_bot=(132,118,92))

    # ── 下午阳光：从右侧低角度射入，橙色光柱 ──
    light_pts = [
        (width, 0), (width-300, 0), (0, floor_y+300), (0, floor_y+500), (width, floor_y+150)
    ]
    light_overlay = Image.new('RGBA', (width, height), (0,0,0,0))
    ld = ImageDraw.Draw(light_overlay)
    for i in range(12):
        alpha = int(45 * (1 - i/12))
        ld.polygon(light_pts, fill=(255, 180, 80, alpha))
    img = Image.alpha_composite(img.convert('RGBA'), light_overlay).convert('RGB')
    draw = ImageDraw.Draw(img)

    # ── 共用植物/爪印/砖块 ──
    _draw_balcony_plants(draw, floor_y, width, height, random_mod=7)

    # ── 绿植影子：下午光从右，影子向左大幅延伸 ──
    grn_x, grn_y = 940, floor_y + 20
    shadow_color = (100, 90, 65, 130)
    shadow = Image.new('RGBA', (width, height), (0,0,0,0))
    sd = ImageDraw.Draw(shadow)
    sd.polygon([
        (grn_x, grn_y+120), (grn_x+130, grn_y+120),
        (grn_x+130-320, floor_y+180), (grn_x-320, floor_y+180)
    ], fill=shadow_color)
    for lx1,ly1,lx2,ly2 in [(-20,-80,30,-20),(10,-100,70,-30),(20,-120,80,-60)]:
        lmx = grn_x+65+(lx1+lx2)//2; lmy = grn_y+120+(ly1+ly2)//2
        sd.polygon([
            (lmx-20, lmy), (lmx+20, lmy),
            (lmx+20-280, floor_y+150), (lmx-20-280, floor_y+150)
        ], fill=shadow_color)
    img = Image.alpha_composite(img.convert('RGBA'), shadow).convert('RGB')
    draw = ImageDraw.Draw(img)

    # ── 朵朵：坐在右侧绿植旁，面朝左，把脸凑近叶子 ──
    _draw_cat_sitting(draw, cx=870, cy=floor_y+50, facing='left')

    img.save('balcony_15.jpg', 'JPEG', quality=92)
    print("Balcony afternoon image balcony_15.jpg generated")


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
    # 盆身（梯形，从盆口到盆底）
    bowl_top_y = bowl_cy - 150   # 盆口顶部
    bowl_top_rx = 130            # 盆口半径
    bowl_bot_y = bowl_cy         # 盆底中心y
    bowl_bot_rx = 90             # 盆底半径

    # 先画盆身侧面（梯形填充）
    draw.polygon([
        (bowl_cx - bowl_top_rx, bowl_top_y + 20),
        (bowl_cx + bowl_top_rx, bowl_top_y + 20),
        (bowl_cx + bowl_bot_rx, bowl_bot_y),
        (bowl_cx - bowl_bot_rx, bowl_bot_y),
    ], fill='#d0d0d0', outline='#909090', width=2)

    # 盆底椭圆（覆盖在梯形底部，无缝衔接）
    draw.ellipse([
        (bowl_cx - bowl_bot_rx, bowl_bot_y - 18),
        (bowl_cx + bowl_bot_rx, bowl_bot_y + 18)
    ], fill='#b8b8b8', outline='#808080', width=2)

    # 盆口椭圆
    draw.ellipse([
        (bowl_cx - bowl_top_rx, bowl_top_y),
        (bowl_cx + bowl_top_rx, bowl_top_y + 40)
    ], fill='#e8e8e8', outline='#909090', width=3)

    # 盆内猫粮（小圆粒，画在盆口椭圆内）
    import random
    random.seed(42)
    for _ in range(30):
        fx = bowl_cx + random.randint(-75, 75)
        fy = bowl_top_y + 18 + random.randint(0, 14)
        r = random.randint(4, 8)
        col = random.choice(['#c8a060', '#b08040', '#d4b070'])
        draw.ellipse([(fx-r, fy-r//2), (fx+r, fy+r//2)], fill=col)

    # 盆上的"朵朵"字样
    try:
        font = ImageFont.truetype("simhei.ttf", 20)
    except:
        font = ImageFont.load_default()
    draw.text((bowl_cx-22, bowl_top_y + 50), "朵朵", fill='#606060', font=font)

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
    # 不用 emoji，改用文字标签避免渲染乱码
    records = [
        ("早  7:00", "[晨]"),
        ("午 12:00", "[午]"),
        ("晚  6:00", "[晚]"),
        ("夜 10:00", "[夜]"),
    ]
    for i, (time_str, label) in enumerate(records):
        ty = card_y + 68 + i * 52
        draw.text((card_x+24, ty), f"{label} {time_str}", fill='#3d2f1f', font=font_body)
        draw.line([(card_x+16, ty+38), (card_x+card_w-16, ty+38)], fill='#e8d8b0', width=1)
    # 便利贴装饰（右下角）
    draw.rectangle([(card_x+card_w-50, card_y+card_h-50), (card_x+card_w-10, card_y+card_h-10)],
                   fill='#fff176', outline='#f0c040', width=1)

    img.save('food_bowl.jpg', 'JPEG', quality=92)
    print("Food bowl image food_bowl.jpg generated")


def create_painting_image():
    """画框谜题场景 1200x800 - 深色墙面，中央挂一幅草地画，四个区域有明确空间参照"""
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
    # 内框（草地底色）
    draw.rectangle([(frame_x, frame_y), (frame_x+frame_w, frame_y+frame_h)],
                   fill='#2d5a27')

    # 天空渐变（上半部分）
    for y in range(frame_y, frame_y + frame_h // 2):
        ratio = (y - frame_y) / (frame_h // 2)
        r = int(100 + (135 - 100) * ratio)
        g = int(149 + (206 - 149) * ratio)
        b = int(237 + (235 - 237) * ratio)
        draw.line([(frame_x, y), (frame_x + frame_w, y)], fill=(r, g, b))

    # 草地（下半部分）
    draw.rectangle([(frame_x, frame_y + frame_h // 2), (frame_x + frame_w, frame_y + frame_h)],
                   fill='#3a7a30')
    for gx in range(frame_x + 10, frame_x + frame_w, 20):
        gy = frame_y + frame_h // 2
        draw.line([(gx, gy), (gx - 5, gy - 20)], fill='#4a9a3a', width=2)
        draw.line([(gx, gy), (gx + 5, gy - 18)], fill='#4a9a3a', width=2)

    # ── 左上角：窗户（背对窗靠墙 = 早饭位置）──
    win_x = frame_x + 30
    win_y = frame_y + 30
    win_w, win_h = 110, 130
    draw.rectangle([(win_x, win_y), (win_x + win_w, win_y + win_h)],
                   fill='#aaddff', outline='#5a3a1a', width=4)
    draw.line([(win_x + win_w // 2, win_y), (win_x + win_w // 2, win_y + win_h)],
              fill='#5a3a1a', width=3)
    draw.line([(win_x, win_y + win_h // 2), (win_x + win_w, win_y + win_h // 2)],
              fill='#5a3a1a', width=3)
    # 窗户光晕
    for r in range(30, 5, -5):
        draw.ellipse([(win_x + win_w // 2 - r, win_y + win_h // 2 - r),
                      (win_x + win_w // 2 + r, win_y + win_h // 2 + r)],
                     outline=(180, 220, 255, 80))

    # ── 右上角：太阳（正对光 = 午饭位置）──
    sun_x = frame_x + frame_w - 90
    sun_y = frame_y + 70
    draw.ellipse([(sun_x - 40, sun_y - 40), (sun_x + 40, sun_y + 40)], fill='#ffe066')
    for angle in range(0, 360, 30):
        sx = sun_x + int(55 * math.cos(math.radians(angle)))
        sy = sun_y + int(55 * math.sin(math.radians(angle)))
        ex = sun_x + int(72 * math.cos(math.radians(angle)))
        ey = sun_y + int(72 * math.sin(math.radians(angle)))
        draw.line([(sx, sy), (ex, ey)], fill='#ffe066', width=3)
    # 阳光照射区域（右上草地泛黄）
    for lx in range(frame_x + frame_w // 2, frame_x + frame_w):
        alpha = int(40 * (lx - frame_x - frame_w // 2) / (frame_w // 2))
        draw.line([(lx, frame_y + frame_h // 2), (lx, frame_y + frame_h // 2 + 80)],
                  fill=(255, 230, 100))

    # ── 右下角：门（离门最近 = 傍晚位置）──
    door_x = frame_x + frame_w - 120
    door_y = frame_y + frame_h - 200
    door_w2, door_h2 = 90, 190
    draw.rectangle([(door_x, door_y), (door_x + door_w2, door_y + door_h2)],
                   fill='#5a3a1a', outline='#3a2010', width=4)
    # 门板纹理
    draw.line([(door_x + 15, door_y + 20), (door_x + door_w2 - 15, door_y + 20)],
              fill='#3a2010', width=2)
    draw.line([(door_x + 15, door_y + door_h2 // 2), (door_x + door_w2 - 15, door_y + door_h2 // 2)],
              fill='#3a2010', width=2)
    # 门把手
    draw.ellipse([(door_x + 12, door_y + door_h2 // 2 - 10),
                  (door_x + 24, door_y + door_h2 // 2 + 10)],
                 fill='#c8a050')

    # ── 左下角：大树树荫（最暗处 = 夜饭位置）──
    tree_x = frame_x + 80
    tree_y = frame_y + frame_h // 2 - 60
    # 树干
    draw.rectangle([(tree_x - 12, tree_y + 60), (tree_x + 12, frame_y + frame_h)],
                   fill='#4a3010')
    # 树冠（多层，营造浓密感）
    for layer, (rx, ry, rw, rh, col) in enumerate([
        (tree_x, tree_y, 90, 80, '#1a4a10'),
        (tree_x - 10, tree_y + 40, 100, 70, '#1e5a14'),
        (tree_x - 5, tree_y + 75, 85, 60, '#226018'),
    ]):
        draw.ellipse([(rx - rw // 2, ry), (rx + rw // 2, ry + rh)], fill=col)
    # 树荫暗色覆盖（左下草地变暗）
    for sx in range(frame_x, frame_x + frame_w // 3):
        shade = int(30 * (1 - (sx - frame_x) / (frame_w // 3)))
        draw.line([(sx, frame_y + frame_h // 2), (sx, frame_y + frame_h)],
                  fill=(0, max(0, 40 - shade), 0))

    # 小猫（草地中央，不遮挡四角参照物）
    cat_x = frame_x + frame_w // 2
    cat_y = frame_y + frame_h * 3 // 4
    draw.ellipse([(cat_x - 20, cat_y - 16), (cat_x + 20, cat_y + 16)],
                 fill='#c8a878', outline='#8b6914', width=2)
    draw.ellipse([(cat_x - 16, cat_y + 12), (cat_x + 16, cat_y + 40)],
                 fill='#c8a878', outline='#8b6914', width=2)
    draw.polygon([(cat_x - 16, cat_y - 16), (cat_x - 22, cat_y - 28), (cat_x - 6, cat_y - 16)],
                 fill='#c8a878')
    draw.polygon([(cat_x + 6, cat_y - 16), (cat_x + 22, cat_y - 28), (cat_x + 16, cat_y - 16)],
                 fill='#c8a878')

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
