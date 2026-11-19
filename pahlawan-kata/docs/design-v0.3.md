# 词语勇士 Pahlawan Kata — 游戏设计文档 v0.3

> 手机上的 Bahasa Melayu 生字学习 RPG，内容对接 **KSSR Bahasa Melayu Tahun 4 SJK** 课本。
> v0.3：加入**三个难度（词包 A / B / C）**、**积分与掌握度**、**阶级外观**、**中文 / 英文双语支持**，并确定**自由跳 Tema**和**武器分阶段解锁**。标有 **【待定】** 的地方需要你拍板。

---

## 0. 版本变化

### v0.2 → v0.3

| 项目 | v0.2 | v0.3 |
|---|---|---|
| 生字数量 | 每个 Unit 10–12 个 | **三个难度**：初级 12 / 中级 24 / 高级 36（词包 A / B / C） |
| 高级的第三包 | — | **不是加更多名词**，而是 A 包词的词族、谚语和近义 / 反义词 |
| 题目难度 | 一种 | 三级：时间、题型、造句方式都不同 |
| 分数 | 只有 XP | **积分（奖励多玩）** 和 **掌握度 %（反映真实学习）** 分开 |
| 角色外观 | 只有衣柜 | 加上**阶级标记**：见习勇士（铜）/ 骑士（银）/ 传奇勇者（金） |
| Tema 解锁 | 按顺序（待定） | **8 个 Tema 一开始全开放**，可以自由跳 |
| 武器类型 | 4 种同时开放 | 开局二选一（剑 / 法杖），**弓 Lv 5、锤 Lv 10 解锁** |
| 语言 | 只有中文说明 | **界面和解释可以选中文或英文**，生字意思可以显示双语（第 7 节） |

### v0.1 → v0.2（摘要）

- 1 个 Tema = 1 个王国（8 个），每个王国 3 个区域（= 3 个 Unit）。
- 每个 Unit 4 关：认字、测验、**语法**、造句，另有可选的 **Seni Bahasa 秘境**。
- 复习 Boss 改为每个 Tema 一次，对应课本 4P。
- 新增**换装系统**：装备（能力）和外观（样子）分开。

---

## 1. 课本分析

**课本**：Bahasa Melayu Tahun 4 SJK，KSSR Semakan 2017，DBP 2019 出版，共 168 页（PDF 有文字层，不需要 OCR）。

### 1.1 结构

- **8 个 Tema × 3 个 Unit = 24 个 Unit**
- 每个 Unit 固定 5 页，每页练一项技能：

| 技能 | 课本代码 | 课本里的样子 | 游戏里对应 |
|---|---|---|---|
| 听与说 Mendengar dan Bertutur | 1.x | 对话、海报、情景 | 认字关的发音 + 听音题 |
| 阅读 Membaca | 2.x | 短文、网页、海报、故事 | 认字关的生字来源 + 例句 |
| 写作 Menulis | 3.x | 写句子、填空、改句子、写短文 | 造句关 |
| 语言艺术 Seni Bahasa | 4.x | 谚语故事、诗歌、歌曲、改编、爪夷文 | Seni Bahasa 秘境（可选关） |
| 语法 Tatabahasa | 5.x | 每个 Unit 一个语法点（看页上的 Celik Bahasa 框） | 语法关 |

- 每个 Tema 结束有 **4P**：Pemulihan（补救）、Pengukuhan（巩固）、Pengayaan（加深）、Penilaian（评估）。Tema 4–8 还有一页 Bacaan Luas（课外阅读）。

### 1.2 发现，以及对游戏设计的影响

1. **课本没有生字表。** 生字都在课文里，要由我们来挑。每个 Unit 有多少词可以挑，见 1.3。
2. **语法是最清楚的一条主线。** 24 个 Unit 刚好 24 个语法点，从词类 → 构词 → 句型，由浅入深。→ 每个 Unit 有一个**语法关**。
3. **Seni Bahasa 有 4 种形式**：谚语 / 成语故事、诗歌、歌曲、改编练习、爪夷文。24 个 Unit 里有 22 个有（Unit 7 和 Unit 15 没有）。→ 做成**可选的秘境关**。
4. **4P 本身就是游戏结构**：补救、练习场、挑战关、Tema Boss。
5. **课本里已经有游戏玩法**：坐标格找字（p.6）、找 10 个不同（p.18）、骰子造句（Tema 7 Pengayaan）、走格子桌游（Tema 8 Pengayaan）。
6. **课本有固定人物**：Chun Han、Aidil、Dinesh、Najwa、Mei Fung、Gauri、Jofri、Norah。→ 当 **NPC 向导**，画风用我们自己的。
7. **版权**：课本版权属于 KPM / DBP。
   - **可以用**：Tema / Unit 名称、语法点、生字、主题。
   - **不能直接复制**：课文、诗歌、歌词、插图。所有例句和短文都要**自己写**。

### 1.3 每个 Unit 有多少词可以挑（v0.3 新增）

统计方法：去掉功能词、人名，再把前缀、后缀还原成词根。

| 情况 | 每个 Unit 的数量 |
|---|---|
| 只在这个 Unit 才有的词根 | 68–162 个（中位数 109） |
| 其中出现 2 次以上、真正是这课重点的词 | **16–48 个（中位数 31）** |

**结论**：

- **12 个**：每个 Unit 都够，而且全是重点词。
- **24 个**：大部分 Unit 够。Unit 1、2、10、15、22 这 5 个要用到一些只出现一次的词。
- **36 个**：只有 5 个 Unit 的重点词超过 40 个。其余的要补进图片里顺带出现的词，学了意义不大。全年 36 × 24 = 864 个字，对把国语当第二语言的四年级孩子来说太多。
- **所以高级的第三包要换个做法**，见第 4 节。

---

## 2. 评估 v0.1 的章节设计

| v0.1 的做法 | 问题 | 现在的做法 |
|---|---|---|
| 1 个 Unit = 1 个王国 | 24 个王国，太长；学校是按 Tema 教 | 1 Tema = 1 王国，共 8 个 |
| 每个 Unit 都打复习 Boss | 太重复 | 每个 Tema 一次，混合 3 个 Unit 的内容 |
| 没有语法 | 语法占课本 1/5，也是考试重点 | 每个 Unit 有语法关 |
| 没有 Seni Bahasa | 谚语、爪夷文都会考 | 有秘境关 |
| 示例词是随便放的 | 跟课本对不上 | 用课本里真的出现的词 |

---

## 3. 章节结构

```
世界：Tahun 4（以后 Tahun 5、Tahun 6 就是新世界）
└── 王国 × 8（= Tema，一开始全开放）
    ├── 区域 A（= Unit）
    │   ├── ① 认字 Kenal Kata      按难度：A 包（+ B 包）（+ C 包），每包 12 个字
    │   ├── ② 测验 Kuiz            战斗，每个词包一轮 10 题
    │   ├── ③ 语法 Tatabahasa      战斗，本 Unit 的语法点
    │   ├── ④ 造句 Bina Ayat       按难度：排词块 / 填空 / 自己造句
    │   └── ✦ 秘境 Seni Bahasa     可选：谚语配对 / 改编填空 / 爪夷文 → 奖励外观
    ├── 区域 B、区域 C ……
    └── Tema 结局（= 4P）
        ├── 补救 Pemulihan         弱字 ≥ 5 个才出现，Boss 前建议先打，不扣分
        ├── ⑤ 练习场 Pengukuhan    3 个 Unit 混合练习，可以无限重玩
        ├── ⑥ Tema Boss Penilaian  3 个阶段（生字 → 语法 → 造句）
        └── ✦ 挑战 Pengayaan       找不同 / 限时赛
```

**词包怎么分轮**：中级在认字和测验关各多一轮（B 包），高级再多一轮（C 包）。语法关和造句关所有难度都只打一轮，只是题目难度不同。

**自由跳 Tema（已决定）**：

- 8 个 Tema 一开始全开放，孩子可以先玩任何一个。
- Tema 里面的 4 关照顺序玩；3 个 Unit 都完成后才能打 Tema Boss。
- **成长靠积分，不靠 Tema 顺序**：等级、商店物品、新武器类型都用等级解锁。
- **学校进度加成**：家长标记"学校正在教 Tema N"，那个 Tema 的积分 ×2。孩子可以自由跳，但会被引导先跟上学校。

---

## 4. 难度与词包（v0.3 新增）

### 4.1 三个难度

| 难度 | 阶级名称 | 词包 | 每个 Unit 字数 | 全年字数 |
|---|---|---|---|---|
| 初级 | 见习勇士 | A 核心包 | 12 | 288 |
| 中级 | 骑士 | A + B 扩展包 | 24 | 576 |
| 高级 | 传奇勇者 | A + B + C 挑战包 | 36 | 864 个条目（但 C 包大多和 A 包同词根，真正的新词根约 600 个） |

**名称不用"简单 / 困难"**，选初级的孩子不会觉得丢脸。

### 4.2 三个词包的内容

| 词包 | 内容 | 例子（Tema 2 · Unit 4） |
|---|---|---|
| **A 核心包** | 课文里出现 2 次以上、考试一定会考的词 | kesihatan、penyakit、pemakanan、gigi |
| **B 扩展包** | 课文里出现的其他实用词 | postur、serat、vitamin、musim panas |
| **C 挑战包** | **A 包词的词族**（前缀 / 后缀变化）+ 相关谚语、成语 + 近义 / 反义词 | sihat → kesihatan、menyihatkan；sakit ↔ sihat；cegah sebelum terlambat |

**为什么 C 包这样做**：

- 配合 Tema 5–6 的前缀、后缀（imbuhan）语法，考试也常考。
- 词族可以共用同一张图，制作量大约是初级的 **2.3 倍**，不是 3 倍。
- 孩子记的是"一个词根 + 变化"，比 36 个不相关的新词好记。

### 4.3 题目难度

| | 初级 | 中级 | 高级 |
|---|---|---|---|
| 每题时间 | 20 秒 | 15 秒 | 12 秒 |
| 测验题型 | 4 选 1，有图片提示 | 4 选 1，没有图片 | 拼写题、听音打字 |
| 语法题 | 选词 | 选词 + 分类 | 分类 + 改写句子 |
| 造句 | 排词块 | 句子填空 | 自己造句（AI 检查，v2） |
| 每个 Unit 大约 | 20 分钟 | 30 分钟 | 40 分钟 |

### 4.4 怎么选难度

1. **分级小测验**：第一次进游戏时做 3 分钟、15 题，系统**建议**一个难度（孩子和家长可以改）。
2. **每个 Tema 都可以重新选**，换难度不会丢失进度（已学的字、星星都保留）。
3. **升阶邀请**：初级的字掌握了 90%，系统邀请孩子"升阶挑战"，解锁下一个词包。
4. **家长可以设最低难度**（例如至少中级）。**【待定】**

---

## 5. 积分与掌握度（v0.3 新增）

两个数字，各管各的：

| | 积分（XP） | 掌握度 % |
|---|---|---|
| 用途 | 奖励努力 → 升级、解锁 | 反映真实学习 → 给家长看 |
| 多玩会不会变高 | 会，玩越多越多 | 不会，只有不用提示答对才算掌握 |
| 显示在 | 角色等级、结算画面 | 家长面板、王国页 |

### 5.1 积分算法

| 项目 | 分数 |
|---|---|
| 每答对一题 | 10 |
| 不用提示答对 | +5 |
| 连对 3 题起 | 每题 +2 |
| 难度倍数 | 初级 ×1、中级 ×1.5、高级 ×2 |
| 学校进度加成 | 家长标记的 Tema ×2 |

### 5.2 多玩多分，但不鼓励刷分

| 情况 | 积分 |
|---|---|
| 同一关，每天前 3 次 | 全分 |
| 同一关，每天第 4 次起 | 半分 |
| 复习到期的字、弱字 | **每次都全分**（引导孩子多复习） |
| 每日任务、连续登录 | 额外奖励 |

### 5.3 星星和徽章

- **星星门槛三个难度都一样**（按百分比算），初级的孩子一样可以拿 3 星。
- **完成一个 Tema**：初级 → 铜徽章，中级 → 银徽章，高级 → 金徽章。
- 徽章显示在地图的王国上和"徽章墙"上。之后用更高难度重打可以升级徽章。

---

## 6. 阶级外观（v0.3 新增）

### 6.1 三个阶级

| 阶级 | 胸前徽章 | 名字框 | 额外 | 特效 |
|---|---|---|---|---|
| 见习勇士 | 铜 | 铜框 | — | 没有 |
| 骑士 | 银 | 银框 | 肩甲 | 进战斗时脚下有蓝光 |
| 传奇勇者 | 金 | 金框 | 头盔金冠 | 金色光点、出场动画 |

### 6.2 规则

1. **阶级标记是加在角色身上的，不替换衣服**，衣柜换的装照样看得到。
2. **要完成 Tema 才拿得到，选了难度不会直接给。** 第一次用中级完成任何一个 Tema → 解锁骑士标记；用高级完成 → 解锁传奇标记。否则孩子会为了金色外观硬选高级，然后打不过就放弃。
3. 拿到之后可以自己选显示哪个阶级（例如有金色但想显示银色）。
4. 登入画面和家长面板的头像框也显示阶级。

---

## 7. 多语言支持（v0.3 新增）

游戏**要学的语言永远是国语**。中文和英文是**帮助孩子理解的语言**：界面、意思、规则、反馈都可以用。

### 7.1 三种语言各管什么

| 内容 | 语言 | 说明 |
|---|---|---|
| 生字、例句、题目里的国语句子 | 永远是**国语** | 这是要学的东西，不翻译 |
| 生字的意思 | **中文 / 英文 / 双语** | 认字卡背面、结算、复习时显示 |
| 例句的翻译 | 中文 / 英文 | 认字卡、造句题下面的小字 |
| 语法规则（像 Celik Bahasa 框） | 中文 / 英文 | 每题答完后显示 |
| 界面：按钮、菜单、装备名称、对话 | 中文 / 英文 | 跟着界面语言 |
| 家长面板 | 中文 / 英文 | 家长自己选，可以和孩子不同 |
| 发音 | 生字一律国语发音 | 题目说明的语音（给比较小的孩子听）跟着界面语言 |

### 7.2 怎么设定

- **每个孩子档案各自设定**：例如哥哥用英文，妹妹用中文。
- 创建角色时选一次，之后在设定里随时可以改。
- **"意思显示"有三个选项**：只显示中文、只显示英文、中英双语（建议双语，同时也能学英文）。
- **自动建议**：家长账号的手机语言是中文就默认中文，其他默认英文。

### 7.3 防止"看翻译就知道答案"

- **"看意思选字"题**：用孩子选的语言出题（例如"「干净」的马来文是？"或 "Which word means *clean*?"），选项永远是国语。
- **高级难度**：一部分题目不显示翻译，只给图片或国语解释（例如 *tempat untuk memasak* → dapur），慢慢减少对翻译的依赖。**【待定】**
- 结算画面显示的"需复习"字，意思用孩子选的语言。

### 7.4 词库格式

每个生字、题目、规则都同时存中文和英文：

```json
{
  "word": "berus gigi",
  "pack": "A",
  "meaning": { "zh": "牙刷", "en": "toothbrush" },
  "example": {
    "ms": "Ali membeli dua batang berus gigi.",
    "zh": "Ali 买了两支牙刷。",
    "en": "Ali bought two toothbrushes."
  },
  "audio": "berus_gigi.mp3",
  "image": "berus_gigi.png"
}
```

- 界面文字放在独立的语言文件（`zh.json`、`en.json`），不写死在画面里。
- 以后要加淡米尔文（给 SJK(T) 的孩子），只要加一个 `ta` 栏和一个语言文件。**【待定：要不要列入 v2】**

### 7.5 制作量

- 每个条目多写一份英文意思和翻译，用 AI 先翻，再人工检查，大约**多 15–20% 的内容工作**。
- 中文用 Noto Sans SC，英文和国语用 Baloo 2。两种界面都要检查**文字长度**：英文按钮通常比中文长 1.5–2 倍，按钮和卡片要留空间。

### 7.6 以后可以学别的语言

内容层和玩法层是分开的，同一套游戏以后也可以加"科目"：例如用同样的玩法学**华文生字**或**英文生字**。这不在目前范围内，但数据格式已经预留了位置。

## 8. 8 个王国

| Tema | 王国 | 场景 | Tema Boss | 套装外观 |
|---|---|---|---|---|
| 1 Harmoni Sentiasa | 和谐村 Kampung Harmoni | 住宅区、社区活动 | 吵架怪 Raksasa Sengketa | 社区英雄套装 |
| 2 Kebersihan dan Kesihatan | 清洁城 Bandar Bersih | 诊所、厨房、食堂 | 蚊子王 Raja Aedes | 白衣卫士套装 |
| 3 Waspada Pasti Selamat | 安全堡垒 Kubu Selamat | 学校、马路、厨房 | 火焰怪 Raksasa Api | 消防英雄套装 |
| 4 Indahnya Budaya, Halusnya Seni | 文化谷 Lembah Budaya | 节庆、工艺坊 | 褪色怪 Raksasa Pudar | 马来西亚传统服饰外观 |
| 5 Alam Bersih Hidup Sejahtera | 绿森林 Hutan Hijau | 河流、森林、回收站 | 垃圾怪 Raksasa Sampah | 森林守护套装 |
| 6 Malaysia Bumi Bertuah | 国旗之城 Kota Gemilang | 广场、码头 | 海盗船长 Kapten Lanun | Jalur Gemilang 披风 |
| 7 Kuasai Sains, Teknologi dan Inovasi | 科技塔 Menara Sains | 实验室、发明工坊 | 生锈机器人 Robot Karat | 科学家实验袍 + 机甲 |
| 8 Bijak Belanja Celik Wang | 金币市集 Pasar Syiling | 市集、银行 | 浪费鬼 Hantu Boros | 小老板套装 + 金币剑外观 |

---

## 9. 课本内容对照表（24 个 Unit）

下表的示例生字都已核对过，确实出现在该 Unit 里，可以作为 **A 包候选**。正式词库按第 4 节补齐 A / B / C 三包。页码是课本页码。

### Tema 1 · Harmoni Sentiasa（p.1–20）

| Unit | 语法关 | 秘境 Seni Bahasa | 示例生字 |
|---|---|---|---|
| 1 Tiga Sahabat（p.2） | Kata nama am | 谚语故事：bagai isi dengan kuku、bagai aur dengan tebing | pertandingan 比赛、berkumpulan 分组、berlatih 练习、persediaan 准备、bersetuju 同意、penduduk 居民、suasana 气氛、meriah 热闹、bekerjasama 合作、sahabat 好朋友 |
| 2 Jiran Sepakat（p.7） | Kata nama khas | 诗歌：berganding bahu、seia sekata | jiran 邻居、lorong 小巷、bergotong-royong 齐心劳动、kebersihan 清洁、komuniti 社区、kejiranan 邻里、menghias 装饰、seikhlas hati 真心、buah tangan 伴手礼 |
| 3 Misi Mulia（p.12） | Kata ganti nama（beta / patik / tuanku；sini / situ / sana） | 歌曲 | orang kurang upaya 残障人士、laluan 通道、mengubah suai 改装、pesakit 病人、menghiburkan 逗乐、kerja amal 慈善工作、kraf tangan 手工艺、hajat 心愿、berkongsi 分享 |

### Tema 2 · Kebersihan dan Kesihatan（p.21–40）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 4 Kesihatan Harus Dijaga（p.22） | Penjodoh bilangan | 改编诗歌 | postur 姿势、kesihatan 健康、pemakanan 饮食、penyakit 疾病、serat 纤维、gigi 牙齿、musim panas 炎热季节、vitamin 维生素 |
| 5 Bersihnya Kami（p.27） | Kata kerja aktif transitif / tak transitif | 改编故事 | berus gigi 牙刷、nyamuk 蚊子、denggi 骨痛热症、air bertakung 积水、mengelap 擦、berpenutup 有盖的、pencuci 清洁剂、gerai 摊位、periuk 锅 |
| 6 Amalan Bersih dan Sihat（p.32） | Kata kerja pasif | 改编歌曲 | berkhasiat 有营养、hidangan 餐点、stoking 袜子、jadual 时间表、kurangkan 减少、gula 糖、makanan ringan 零食、risiko 风险 |

### Tema 3 · Waspada Pasti Selamat（p.41–59）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 7 Waspada Amalan Kita（p.42） | Kata adjektif cara + jarak | — | kebakaran 火灾、bomba 消防员、pelan 平面图、ular 蛇、dapur 厨房、menelefon 打电话、berkumpul 集合、waspada 警惕 |
| 8 Sekolah Kami Selamat（p.46） | Kata adjektif ukuran | 爪夷文："Malaysia" | tangga 楼梯、laluan 通道、keselamatan 安全、berhati-hati 小心、memakai 穿戴、topi 帽子、kebun sekolah 学校园圃、sarung tangan 手套 |
| 9 Kamu Mampu Mengubahnya（p.51） | Kata adjektif perasaan | 谚语故事：malang tidak berbau、biar lambat asalkan selamat、lepas tangan、ambil berat | lampu isyarat 红绿灯、melintas 过马路、pejalan kaki 行人、kenderaan 车辆、topi keledar 安全帽、berhenti 停、jalan raya 马路 |

### Tema 4 · Indahnya Budaya, Halusnya Seni（p.60–80）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 10 Hidup Berbudaya（p.61） | Kata adjektif pancaindera | 诗歌 | budaya 文化、perayaan 节庆、adat 习俗、warisan 遗产、masyarakat 社会、kaum 种族、upacara 仪式、menghormati 尊敬 |
| 11 Seni Penyeri Kehidupan（p.66） | Kata hubung | 歌曲 | gamelan 甘美兰、ukiran kayu 木雕、kraf 工艺、perhiasan 饰品、tarian 舞蹈、topeng 面具、terompah 木屐、motif 图案 |
| 12 Cantik Menawan（p.71） | Kata sendi nama | 改编诗歌 | tempurung kelapa 椰壳、pakaian tradisional 传统服装、busana 服饰、majlis perkahwinan 婚礼、hiasan 装饰、bakul 篮子、bunga manggar 椰花装饰 |

### Tema 5 · Alam Bersih Hidup Sejahtera（p.81–100）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 13 Prihatin akan Alam（p.82） | Kata nafi（tidak / bukan） | 改编故事 | sukarelawan 志愿者、sampah 垃圾、kitar semula 回收、sisa 废料、perangkap sampah 垃圾拦截网、tong 桶、plastik 塑料、pepejal 固体 |
| 14 Bersikap Mesra Alam（p.87） | Kata bilangan | 改编歌曲 | mesra alam 环保、mengurangkan 减少、tisu 纸巾、kertas 纸、penebangan 砍伐、tadahan air hujan 雨水收集、pembuangan 丢弃 |
| 15 Selamatkan Alam Kita（p.92） | Kata berimbuhan awalan + akhiran | — | panel solar 太阳能板、tenaga 能源、elektrik 电、kumbahan 污水、asap 烟、udara 空气、teknologi hijau 绿色科技 |

### Tema 6 · Malaysia Bumi Bertuah（p.101–121）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 16 Bangganya Kami（p.102） | Kata berimbuhan apitan | 爪夷文：Jata Negara 的 "Bersekutu Bertambah Mutu" | Jalur Gemilang 国旗、bendera 旗帜、Jata Negara 国徽、kontinjen 代表团、mengibarkan 挥旗、rakyat 人民、maruah 尊严 |
| 17 Malaysia Tercinta（p.107） | Kata majmuk bebas | 谚语故事：hujan emas di negeri orang…、bagai ikan pulang ke lubuk、masuk kandang kambing mengembek…、bulat hati、anak jati | patriotik 爱国的、semangat 精神、anggota 成员、perairan 水域、lanun 海盗、negeri 州、berbakti 奉献 |
| 18 Negaraku Hebat（p.112） | Kata majmuk mantap | 诗歌 | pasport 护照、warganegara 公民、MyKid / MyKad 身份证、kemudahan 设施、rawatan 治疗、antarabangsa 国际、jabatan 部门、bertuah 幸运 |

### Tema 7 · Kuasai Sains, Teknologi dan Inovasi（p.122–141）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 19 Cerdik Sains（p.123） | Kata ganda penuh / separa | 歌曲 | magnet 磁铁、berkarat 生锈、rantai 链子、cuaca 天气、akar 根、udara 空气、peti sejuk 冰箱、terdedah 暴露 |
| 20 Mesra Teknologi（p.128） | Ayat tunggal / ayat majmuk | 改编诗歌 | pintar 智能、tablet 平板、pembersih vakum 吸尘器、peranti 设备、ciptaan 发明、canggih 先进、mesin 机器、imbas 扫描 |
| 21 Rekaan Inovatif（p.133） | Ayat penyata | 改编故事 | inovasi 创新、terarium 玻璃生态瓶、balang kaca 玻璃罐、menghalau 驱赶、kalis 防（水）、perabot 家具、kreativiti 创造力、alat 工具 |

### Tema 8 · Bijak Belanja Celik Wang（p.142–160）

| Unit | 语法关 | 秘境 | 示例生字 |
|---|---|---|---|
| 22 Belanja Berhemat（p.143） | Ayat tanya | 改编歌曲 | berbelanja 花钱、berjimat 节省、perbelanjaan 开销、barangan 物品、bekal 便当、cermat 谨慎、simpan 储存、menjahit 缝 |
| 23 Maju dan Berjaya（p.148） | Ayat aktif | 谚语故事：melentur buluh biarlah daripada rebungnya、berat sama dipikul…、di mana ada kemahuan…、ringan tulang | usahawan 企业家、perniagaan 生意、pelanggan 顾客、gerai 摊位、berjaya 成功、taska 托儿所、karnival 嘉年华 |
| 24 Bijak Kewangan（p.153） | Ayat susunan biasa / songsang | 爪夷文："Bank Negara Malaysia"、"Ringgit Malaysia" | bank 银行、akaun 账户、wang saku 零用钱、waranti 保修、ringgit 令吉、ganjaran 奖励、simpanan 储蓄 |

---

## 10. 语法关的玩法

| 玩法 | 怎么玩 | 用在哪些语法点 |
|---|---|---|
| **分类战**（两扇门） | 词或句子飞过来，拖进左门或右门 | Kata nama am / khas；transitif / tak transitif；ayat tunggal / majmuk；kata ganda penuh / separa；susunan biasa / songsang；majmuk bebas / mantap |
| **选词攻击** | 句子有一个空格，从 4 个选项里选 | Penjodoh bilangan、kata ganti nama、5 种 kata adjektif、kata hubung、kata sendi nama、kata nafi、kata bilangan |
| **锻造炉**（铁匠铺） | 词根 + 词缀 = 新词 | Imbuhan awalan / akhiran / apitan |
| **句子工坊** | 把句子改造成指定句型 | Aktif → pasif；penyata → tanya；ayat aktif；biasa → songsang |

每题答完都显示一句规则（像课本的 Celik Bahasa 框），错了也会解释原因。

---

## 11. 换装系统

### 11.1 两层：装备 vs 外观

- **装备** = 能力（生命、时间、提示、暂停、护盾、复活）
- **外观** = 样子（不影响能力）
- **外观覆盖**：打开"只换样子"，可以用史诗剑的能力，看起来却是木剑。

### 11.2 可以换的部位

| 部位 | 装备（影响能力） | 外观选项 | 怎么拿到 |
|---|---|---|---|
| 发型 / 发色 | — | 发型、颜色 | 创建角色、商店 |
| 头 | 头盔：提示 | 头盔、帽子、头巾、发饰 | 宝箱、Tema 套装 |
| 身体 | 铠甲：生命 | 战袍 | 宝箱、Tema 套装、商店 |
| 手 | 手套：暂停 | 手套外观 | 宝箱 |
| 脚 | 靴子：时间 | 鞋子外观 | 宝箱 |
| 副手 | 盾牌：护盾 | 盾牌外观 | 宝箱 |
| 主手 | 武器（见 11.3） | 武器外观 | 宝箱、Tema 套装 |
| 饰品 | 护身符：复活 | — | Boss 宝箱 |
| 背部 | — | 披风 | 秘境、Tema 套装、商店 |
| 宠物 | — | 小宠物（Lv 10 解锁） | 商店、成就 |
| 头像框 | — | 框 | 成就、阶级（第 6 节） |

### 11.3 武器类型：分阶段解锁（已决定）

| 武器 | 特性 | 什么时候拿到 | 适合谁 |
|---|---|---|---|
| ⚔️ 剑 Pedang | 连对 3 题起，积分 +50% | 创建角色时二选一 | 有信心、喜欢拼速度 |
| 🪄 法杖 Tongkat | +1 次提示，提示更强 | 创建角色时二选一 | 需要帮忙、刚开始学 |
| 🏹 弓 Busur | 每题 +3 秒 | Lv 5 解锁 | 读得慢、听音题多 |
| 🔨 锤 Tukul | 每场开局自带 1 次护盾 | Lv 10 解锁 | 怕答错、容易紧张 |

- 开局只有两个选择，9 岁的孩子容易决定。
- 每隔一段时间解锁新武器，有东西可以期待；解锁时有一场小教学战。
- **换武器不用钱、不限次数**，鼓励孩子自己试。
- 每种武器都有 普通 → 稀有 → 史诗 → 传说 四个等级。

### 11.4 出战组合

- 可以存 3 套组合。进关卡前的准备画面显示题型，推荐一套，点一下就换上。
- 装备只能让题目更从容，**不能减少题数**。

### 11.5 Tema 套装

- 每个 Tema 一套 4 件外观，只影响样子，不加能力。
- 集齐一套 → 称号 + 头像框。

### 11.6 Tema 4 的传统服饰外观

以马来西亚各族传统服饰为灵感，男女都有，设计时尊重、准确，每件附一句文化介绍。**【待定】**

### 11.7 公平

外观不卖真钱，只能用游戏金币或关卡奖励换。

---

## 12. 沿用 v0.1 的部分

- **登入**：家长账号 + 孩子档案（头像 + 图案密码）
- **选择角色**：男 / 女、名字、颜色，**加上选武器（剑 / 法杖）和说明语言（中文 / English）**
- **战斗**：生命、计时、道具栏（提示 / 暂停 / 护盾 / 药水）
- **升级**：Lv 1–30，属性点分配给体力 / 专注 / 智慧
- **防止靠装备跳过学习**：题数固定；用提示答对的字标记为"需复习"
- **间隔重复**：Leitner 5 盒，首页显示"今日待复习"
- **家长面板**：学习时间、掌握度、最弱的字、每日时间上限、**学校进度设定、最低难度设定**
- **商店**：只卖消耗品和外观，不设真钱购买

---

## 13. 内容制作量

| 每个 Unit | 初级 | 中级 | 高级 |
|---|---|---|---|
| 生字条目（图片、发音、意思、例句） | 12 | 24 | 36（C 包大多共用 A 包的图） |
| 语法题 | 15 | 20 | 25 |
| 造句题 | 6 | 8 | 10 |
| 秘境题 | 5–8 | 5–8 | 5–8 |

**全年合计（做齐三个难度）**：864 个生字条目（约 600 张图）、约 480 道语法题、约 240 个句子、20 多个谚语 / 成语、约 10 个爪夷文词。

**建议流程**：
1. 从课本挑 A / B 包的词（人工）
2. 用程序找出 A 包词的词族，作为 C 包候选
3. 用 AI 生成例句、题目
4. 由你或老师审核
5. 存成 JSON：`Tema → Unit → { packA[], packB[], packC[], 语法题[], 造句[], 秘境[] }`

---

## 14. 画面清单（原型共 21 个画面）

| # | 画面 | 状态 |
|---|---|---|
| 1 | 登入 / 选择孩子 | 沿用 |
| 2 | 创建角色 | 沿用 |
| 3 | 世界地图：8 个 Tema 王国 | v0.2 |
| 4 | Tema 王国：3 个 Unit + Tema 结局 | v0.2 |
| 5 | 认字 · 翻卡 | 沿用 |
| 6 | 测验 · 战斗 | 沿用 |
| 7 | 时间暂停 + 提示 | 沿用 |
| 8 | 造句 · 词块排序 | 沿用 |
| 9 | Tema Boss 战 | 沿用 |
| 10 | 结算 | 沿用 |
| 11 | 开宝箱 | 沿用 |
| 12 | 升级 · 分配属性点 | 沿用 |
| 13 | 装备背包 | v0.2 |
| 14 | 商店 | 沿用 |
| 15 | 家长面板 | 沿用 |
| 16 | 出战准备 · 换组合 | v0.2 |
| 17 | 语法关 · Penjodoh bilangan | v0.2 |
| 18 | 秘境 · 谚语配对 | v0.2 |
| 19 | 衣柜 · 换装 | v0.2 |
| 20 | 分级测验结果 · 选择难度（可切换中文 / English） | **v0.3 新增** |
| 21 | 阶级外观 · 徽章墙 | **v0.3 新增** |

---

## 15. 开发阶段

| 阶段 | 内容 |
|---|---|
| MVP | 登入、选角色（含剑 / 法杖）、**中文 + 英文界面和意思**、**Tema 1 完整，初级 + 中级**、分级测验、升级、基本装备、衣柜、积分与掌握度 |
| v1 | Tema 1–8 全部、高级（C 包）、阶级外观、徽章墙、间隔重复、家长面板、出战组合、弓和锤 |
| v2 | AI 造句检查、Tahun 5 / Tahun 6、宠物、成就 |

---

## 16. 决定记录

### 已决定

| 问题 | 决定 |
|---|---|
| 语言 | Bahasa Melayu，对接 Tahun 4 SJK 课本 |
| 每个 Unit 的生字数 | 三个难度：12 / 24 / 36（第 4 节） |
| Tema 解锁 | 一开始全开放，可以自由跳；成长靠积分 |
| 武器类型 | 4 种，分阶段解锁：剑 / 法杖开局，弓 Lv 5，锤 Lv 10 |
| 说明语言 | 中文和英文，每个孩子各自设定；意思可以显示双语（第 7 节） |

### 还要决定

1. **最低难度**：家长可以设定"至少中级"吗？
2. **外观覆盖**：要不要？（建议要）
3. **Tema 4 传统服饰外观**：这个方向可以吗？
4. **AI 检查自由造句**：高级的造句要等 v2 才有 AI 检查。MVP 的高级先用"句子填空 + 改写句子"代替，可以吗？
5. **高级难度减少翻译**：高级有一部分题不显示中文 / 英文，只给图片或国语解释，可以吗？
6. **淡米尔文**：要不要列入 v2？
7. **兄弟姐妹排行榜**：要不要？如果要，建议比"本周积分"（努力），不比"掌握度"，避免难度不同的孩子互相比较。
