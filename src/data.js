// ===================== 谜题配置 =====================

export const PUZZLES = {
    // 铁盒密码
    password: { answer: 'clock' },
    // 抽屉密码
    drawer: { answer: '543' },
    // 书架5本书顺序（按朵朵照片排序）
    bookOrder: ['book1', 'book2', 'book3', 'book4', 'book5'],
    // 音乐盒正确顺序：初来乍到(A) → 慵懒少女(B) → 老猫时光(C)
    musicBoxOrder: ['A', 'B', 'C'],
    // 阳台砖块顺序
    brickOrder: ['moon', 'sun', 'wave', 'star'],
    // 画框食盆区域顺序
    bowlOrder: ['morning', 'noon', 'evening', 'night'],
    // 玩具箱图案锁顺序：球→鱼→铃铛→爪
    toyLockOrder: ['ball', 'fish', 'bell', 'paw'],
};

// ===================== 谜题常量 =====================

export const BOOK_CONFIG = [
    { id: 'book3', label: '中书',   width: '7%',   left: '10%', color: '#27ae60' },
    { id: 'book5', label: '薄书②', width: '4%',   left: '20%', color: '#8e44ad' },
    { id: 'book1', label: '厚书①', width: '10%',  left: '28%', color: '#c0392b' },
    { id: 'book4', label: '薄书①', width: '5.5%', left: '41%', color: '#f39c12' },
    { id: 'book2', label: '厚书②', width: '8.5%', left: '50%', color: '#2980b9' },
];

export const MUSIC_BOX_PHASES = [
    { id: 'btn-phase-b', label: '慵懒少女', key: 'B', x: '32.2%', y: '57%' },
    { id: 'btn-phase-c', label: '老猫时光', key: 'C', x: '43%', y: '57%' },
    { id: 'btn-phase-a', label: '初来乍到', key: 'A', x: '53.6%', y: '57%' },
];

export const BOWL_ZONES = [
    { id: 'morning', left: '54.5%', top: '77%',   width: '8%', height: '8%', symbol: '🌸', label: '毯子边' },
    { id: 'noon',    left: '19%',   top: '71%',   width: '8%', height: '8%', symbol: '☀️', label: '阳光处' },
    { id: 'evening', left: '56.9%', top: '61%',   width: '8%', height: '8%', symbol: '🌿', label: '门边' },
    { id: 'night',   left: '70%',   top: '67%',   width: '8%', height: '8%', symbol: '🌙', label: '暗处' },
    { id: 'night2',  left: '91%',   top: '79%',   width: '8%', height: '8%', symbol: '🌙', label: '暗处2' },
];

export const BRICK_LABELS = { moon: '🌙', sun: '☀️', wave: '🌊', star: '⭐' };

export const BRICK_POSITIONS = [
    { key: 'star',  left: '18%', top: '76%' },
    { key: 'sun',   left: '34%', top: '76%' },
    { key: 'moon',  left: '50%', top: '76%' },
    { key: 'wave',  left: '66%', top: '76%' },
];

// ===================== 热区位置 =====================

export const ROOM_HOTSPOTS = [
    { id: 'door',       x: '3%',  y: '45%', width: '10%', height: '30%', label: '门' },
    { id: 'window',     x: '35%', y: '20%', width: '25%', height: '35%', label: '窗户' },
    { id: 'sofa',       x: '15%', y: '65%', width: '30%', height: '20%', label: '沙发' },
    { id: 'table',      x: '55%', y: '68%', width: '25%', height: '18%', label: '桌子' },
    { id: 'clock',      x: '88%', y: '25%', width: '10%', height: '15%', label: '时钟' },
    { id: 'drawer',     x: '52%', y: '50%', width: '8%',  height: '10%', label: '抽屉' },
    { id: 'photo-wall',  x: '14%', y: '20%', width: '18%', height: '30%', label: '照片墙' },
    { id: 'toys',        x: '60%', y: '82%', width: '15%', height: '10%', label: '猫玩具' },
    { id: 'bookshelf',   x: '75%', y: '35%', width: '12%', height: '30%', label: '书架' },
    { id: 'food-bowl',   x: '3%',  y: '78%', width: '8%',  height: '8%',  label: '食盆' },
    { id: 'painting',    x: '60%', y: '18%', width: '8%',  height: '20%', label: '画' },
    { id: 'toy-box',     x: '82%', y: '76%', width: '10%', height: '8%',  label: '玩具箱' },
];

// ===================== 便利贴文本 =====================

export const STICKY_NOTE_TEXTS = {
    note1: '朵朵，你知道吗，第一次见到你的时候，我就知道你会是我最好的朋友。',
    note2: '你总是在这里等我回家，每次开门都能看到你的小脑袋。',
    note3: '2021年，你来了。2023年，你长大了。2026年，你还是那么爱赖着我。',
    note4: '你的项圈我一直留着，那是你来的第一天戴上的。',
    note5: '如果有一天你找到了这里，希望你知道，我永远爱你。'
};

// ===================== 记忆碎片文本 =====================

export const MEMORY_FRAGMENT_TEXTS = [
    '2021年8月29日，朵朵第一次来家。她躲在角落里，用那双琥珀色的眼睛打量着这个陌生的地方。我把项圈轻轻套上，她没有挣扎，只是回头看了我一眼。',
    '有一个下午，阳光从窗户斜射进来，朵朵第一次跳上窗台。她坐在那里，望着远处，尾巴轻轻摇摆。我没有打扰她，只是静静地看着。',
    '每天喂食的时候，她都有自己的仪式。先闻一闻，再用爪子轻轻碰一下，铃铛响了，才肯低头吃。我不知道这是从哪里学来的，但我每次都会等她完成。',
    '最后一次玩玩具是一个傍晚。她把毛线球、铃铛球和小鱼都推到了我脚边，然后坐下来看着我。我想，也许她知道我要离开了。',
    '我离开的那天，朵朵坐在窗台上，一直看着我。我没有回头，但我知道她在。这个房间里的每一件东西，都是我们在一起的证明。'
];

// ===================== 画框谜题提示 =====================

export const PAINTING_HINTS = [
    '点击画面把食盆对准画里朵朵早饭的位置……',
    '对准她中午吃饭的地方……',
    '对准傍晚她打盹的角落……',
    '最后，找到她夜里躲着吃饭的暗处……'
];

// ===================== 真结局五幕 =====================

export const ENDING_ACTS = [
    {
        title: '第一幕',
        text: '时钟的背面有一道细缝。\n\n你用指甲轻轻撬开，里面是一个小小的夹层——一张折叠的纸，和一张照片。'
    },
    {
        title: '第二幕',
        text: '照片里，一个人坐在沙发上，朵朵趴在他的腿上，两个人都在看向窗外的阳光。\n\n照片背面用钢笔写着：\n\n"谢谢你陪我走过这些年。\n\n2022—2026"'
    },
    {
        title: '第三幕',
        text: '你展开那张折叠的纸。\n\n"如果你走到了这里，说明你已经重新经历了我们在一起的每一段时光。\n\n书架上的项圈，是她来的第一天。\n音乐盒里的回忆，是她陪我走过的岁月。\n食盆旁的记录，是她每天的仪式。\n玩具箱里的图案，是她最后一次玩耍。\n阳台花盆下的信，是我离开前的道别。\n\n这些不是谜题，是记忆。\n\n——主人"'
    },
    {
        title: '第四幕',
        text: '你放下纸，抬起头。\n\n朵朵不知道什么时候从沙发角落走了出来，她蹭了蹭你的腿，然后跳上窗台，坐在那里，望向远处。\n\n尾巴轻轻摇摆，像是在等什么，又像是什么都不在等。'
    },
    {
        title: '第五幕',
        text: '你把时钟轻轻放回墙上。\n\n指针重新开始走动。\n\n你走向门口，回头看了一眼——朵朵还坐在窗台上，没有回头。\n\n你轻轻关上门。\n\n不是逃离，是带着这份记忆，离开。'
    }
];
