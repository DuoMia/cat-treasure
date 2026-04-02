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

if __name__ == '__main__':
    create_room_background()
    create_pen_image()
    create_pen_holder_image()
    print("\nAll images generated successfully!")
