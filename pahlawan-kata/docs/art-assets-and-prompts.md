# 词语勇士 Pahlawan Kata — 美术资源清单与 Codex 提示词

> 用法：把第 1 节的**总指令**贴给 Codex，再按第 3–12 节分批生成。
> 每个最终提示词 = **【STYLE】+【SPEC（按资源类型）】+【该项目的 Prompt】**。
> 提示词用英文（图像模型对英文最稳定），说明用中文。
> 生成后按第 13 节的文件夹和 manifest 格式交回，我就能直接组装进原型和游戏。

---

## 0. 资源总数

| 类别 | 数量 | 节 |
|---|---|---|
| 主角底模（男 / 女 × 3 种肤色） | 6 | 3 |
| 发型（含头巾 tudung） | 7 | 3 |
| 能力装备（6 种 × 4 稀有度） | 24 | 4 |
| 武器（4 类 × 4 稀有度） | 16 | 4 |
| 基本战袍 + 单品外观 | 8 | 5 |
| Tema 套装（8 套，Tema 4 有多款传统服饰） | 40 | 5 |
| 阶级标记 | 11 | 6 |
| 宠物 | 4 | 7 |
| NPC（8 位朋友 × 全身 + 头像，+ 猫 Si Gebu） | 17 | 8 |
| 怪物（通用 4 + 每个 Tema 小怪 8） | 12 | 9 |
| Tema Boss（8 个 × 战斗 / 被打败两种状态） | 16 | 9 |
| 道具、宝箱 | 11 | 10 |
| 徽章（8 个 Tema 图案 + 3 种金属外框） | 11 | 10 |
| 背景与地图 | 19 | 11 |
| 界面图标（可选） | 10 | 12 |
| 生字卡图片 | 模板（以后按词库批量） | 12 |
| **合计** | **约 212 张**（不含生字卡） | |

**每件可穿戴的物品要两张图**：
- **图标 icon**：放在背包、商店、衣柜格子里
- **穿戴层 layer**：叠在角色身上

所以实际文件数大约是 300 个。

---

## 1. 交给 Codex 的总指令（先贴这一段）

```
You are producing 2D game art for "Pahlawan Kata", a Malaysian mobile RPG that teaches
Bahasa Melayu vocabulary to children aged 9–12. I will send prompts in batches.

Rules for every image:
1. Always prepend the STYLE block and the SPEC block for that asset type.
2. First generate the STYLE ANCHOR SHEET (prompt A0). After I approve it, attach it as a
   reference image to EVERY later generation so the style stays identical.
3. For wearable layers, attach the approved base template (B-BOY-1) as a positioning
   reference and draw ONLY the item, aligned exactly where it is worn. Everything else
   must be transparent.
4. Never add text, letters, numbers, watermarks or logos inside images.
5. Save files with the exact filename given, into the folder structure in section 13,
   and update manifest.json after every batch.
6. Do not copy any existing textbook illustration, brand, real logo, real banknote or
   protected emblem (e.g. Red Cross, Bomba logo, police badge, Jata Negara).
```

---

## 2. 共用区块

### 2.1 STYLE（每个提示词都放在最前面）

```
STYLE: Bright, friendly 2D cartoon game art for children aged 9–12. Chibi proportions
(head about 40% of body height), big expressive eyes, rounded shapes. Clean bold outlines
in dark navy (#1E2033), flat cel shading with one soft shadow tone and one small highlight.
Cheerful saturated palette built on navy #232A5C, amber #FFB020, teal #1FA39A,
coral #E5533D, blue #2F7DE1, purple #8B4FD8, cream #FFF6E5. Malaysian setting and
culture, warm and inclusive. Cute rather than scary. No text, no letters, no logos.
```

### 2.2 SPEC 规格（按资源类型选一个）

| SPEC | 用在 | 内容（贴在 STYLE 后面） |
|---|---|---|
| **SPEC-LAYER** | 角色底模、发型、所有穿戴层 | `SPEC: 1024x1024 PNG, fully transparent background. Front view, paper-doll template: character centered on x=512, soles of feet on y=980, top of head about y=90. Light A-pose, arms relaxed slightly away from body, fists closed. Weapon hand is on the viewer's RIGHT at about (700,640); shield hand on the viewer's LEFT at about (324,640). Boy and girl bases share the IDENTICAL body silhouette, so every clothing layer fits both.` |
| **SPEC-ICON** | 背包 / 商店 / 衣柜图标 | `SPEC: 512x512 PNG, transparent background. Single item, centered, slight 3/4 view, about 10% padding on all sides, soft drop shadow under the item. No character.` |
| **SPEC-SPRITE** | NPC 全身、怪物、宠物 | `SPEC: 1024x1024 PNG, transparent background. Full body, centered, feet on y=980. Monsters face the viewer's LEFT (toward the hero). NPCs face the viewer, slight 3/4 turn.` |
| **SPEC-BOSS** | Tema Boss | `SPEC: 1536x1536 PNG, transparent background. Full body, centered, facing the viewer's LEFT, fills about 80% of the canvas height. Big, impressive but cute, never gory or frightening.` |
| **SPEC-PORTRAIT** | NPC 对话头像 | `SPEC: 512x512 PNG, transparent background. Head and shoulders, facing viewer, friendly smile, centered.` |
| **SPEC-BG** | 战斗背景 | `SPEC: 1080x1350 PNG (4:5), full-bleed illustrated background, no characters, clear empty ground area in the lower 40% for battle sprites, slightly softer detail than characters so sprites stand out.` |
| **SPEC-CARD** | 生字卡图片 | `SPEC: 768x768 PNG, plain cream background (#FFF6E5), ONE clear object or action centered, no text, simple enough for a 9-year-old to recognise instantly.` |

### 2.3 稀有度描述（装备和武器用）

把 `{TIER}` 换成下面这一列的英文：

| 稀有度 | `{TIER}` 替换文字 |
|---|---|
| 普通 common | `common tier: plain iron, wood and leather, simple shape, grey (#8A8F98) accents` |
| 稀有 rare | `rare tier: polished steel with blue (#2F7DE1) trim and one small blue gem` |
| 史诗 epic | `epic tier: ornate design with purple (#8B4FD8) trim, two glowing purple gems, soft purple glow` |
| 传说 legendary | `legendary tier: gold (#E0A200) ornate design, warm golden glow and a few tiny sparkles` |

---

## 3. 主角（纸娃娃底模 + 发型）

### A0 画风定稿图（**第一张，先做这张**）

| 文件名 | Prompt |
|---|---|
| `style/a0_style_anchor.png`（2048x1024，可以有背景） | `Style anchor sheet on a cream background: a chibi boy hero and girl hero standing side by side in blue tunics, one simple sword icon, one cute green slime monster, and one treasure chest. Show the final art style for the whole game.` |

### 3.1 底模（SPEC-LAYER）

底模只穿**中性的打底衣**（深蓝紧身衣 + 短裤 / 长裤），方便叠战袍。

| ID | 文件名 | Prompt |
|---|---|---|
| B-BOY-1 | `layers/base/base_boy_skin1.png` | `Base paper-doll body of a 10-year-old Malaysian boy, light skin tone, bald head (hair is a separate layer), friendly smile, wearing a plain dark navy fitted undershirt and shorts, bare simple shoes.` |
| B-BOY-2 | `layers/base/base_boy_skin2.png` | `Same as B-BOY-1 but medium tan skin tone. Identical pose and silhouette.` |
| B-BOY-3 | `layers/base/base_boy_skin3.png` | `Same as B-BOY-1 but deep brown skin tone. Identical pose and silhouette.` |
| B-GIRL-1 | `layers/base/base_girl_skin1.png` | `Base paper-doll body of a 10-year-old Malaysian girl, light skin tone, bald head (hair is a separate layer), friendly smile, plain dark navy fitted undershirt and leggings, simple shoes. Silhouette IDENTICAL to the boy base.` |
| B-GIRL-2 | `layers/base/base_girl_skin2.png` | `Same as B-GIRL-1 but medium tan skin tone.` |
| B-GIRL-3 | `layers/base/base_girl_skin3.png` | `Same as B-GIRL-1 but deep brown skin tone.` |

> 先只做 B-BOY-1，确认位置和比例后，**所有其他图都用它当参考**。

### 3.2 发型（SPEC-LAYER，只画头发）

发色用深棕色生成，其他颜色由程序换色。

| ID | 文件名 | Prompt |
|---|---|---|
| H-B1 | `layers/hair/hair_boy_spiky.png` | `Only the hair layer: short spiky boy hairstyle, dark brown.` |
| H-B2 | `layers/hair/hair_boy_neat.png` | `Only the hair layer: neat short side-parted boy hairstyle, dark brown.` |
| H-B3 | `layers/hair/hair_boy_curly.png` | `Only the hair layer: short curly boy hairstyle, dark brown.` |
| H-G1 | `layers/hair/hair_girl_ponytails.png` | `Only the hair layer: two side ponytails with small red hair ties, dark brown.` |
| H-G2 | `layers/hair/hair_girl_bob.png` | `Only the hair layer: short bob with fringe, dark brown.` |
| H-G3 | `layers/hair/hair_girl_braid.png` | `Only the hair layer: long single braid over one shoulder, dark brown.` |
| H-G4 | `layers/hair/hair_girl_tudung.png` | `Only the headwear layer: a neat light-blue school-style tudung (Malaysian headscarf) framing the face and covering the hair and neck.` |

> **头巾和头盔**：选了 tudung 时，帽子和头盔一样叠在上面。请把所有帽子 / 头盔画成**能戴在 tudung 上面**的样子（不露头发）。

---

## 4. 能力装备与武器（每项都要 icon + layer）

### 4.1 防具（6 种 × 4 稀有度 = 24 项）

**生成方法**：同一个 Prompt 跑 4 次，把 `{TIER}` 换成 2.3 节的 4 种描述。
**文件名规则**：`icons/gear/{id}_{tier}.png` 和 `layers/gear/{id}_{tier}.png`。id 用小写（例如 `g-helm`），tier 填 common / rare / epic / legendary。武器放 `icons/weapons/`、`layers/weapons/`。

| ID | 中文 | 能力 | Prompt |
|---|---|---|---|
| G-HELM | 智慧头盔 | 提示 | `A kid-sized knight helmet with an open face and a small crest shaped like an open book, {TIER}.` |
| G-ARMOR | 勇气铠甲 | 生命 | `A rounded chest armor with shoulder guards and a small heart emblem in the middle, {TIER}.` |
| G-SHIELD | 守护盾 | 护盾 | `A round shield with a curved shield-shaped emblem in the center, {TIER}.` |
| G-GLOVES | 时光手套 | 暂停 | `A pair of gauntlet gloves, each with a small clock face on the back of the hand, {TIER}.` |
| G-BOOTS | 疾风靴 | 时间 | `A pair of boots with small wing shapes on the ankles, {TIER}.` |
| G-AMULET | 复活护符 | 复活 | `A pendant amulet shaped like a small phoenix feather on a cord, {TIER}.` |

> layer 版本多加一句：`Draw it worn on the character, aligned to the base template.`
> 护符 layer 只画挂在胸前的部分。

### 4.2 武器（4 类 × 4 稀有度 = 16 项）

layer 版本拿在**画面右手边**（约 700,640）。

| ID | 中文 | 能力 | Prompt |
|---|---|---|---|
| W-SWORD | 剑 · 词语之剑 | 连击加成 | `A short kid-friendly sword with a rounded tip and a guard shaped like an open book, {TIER}.` |
| W-STAFF | 法杖 · 星光法杖 | 多提示 | `A magic staff topped with a five-pointed star crystal, {TIER}.` |
| W-BOW | 弓 · 晨风之弓 | 每题多时间 | `A compact curved bow with a feather motif on the grip, {TIER}. No arrow needed.` |
| W-HAMMER | 锤 · 守护之锤 | 开局护盾 | `A chunky friendly war hammer with a shield emblem on the head, {TIER}.` |

---

## 5. 外观（只改样子，不加能力）

### 5.1 基本战袍和单品（icon + layer）

| ID | 中文 | 文件名（layer / icon 同名） | Prompt |
|---|---|---|---|
| C-ROBE-BLUE | 蓝色战袍 | `robe_blue.png` | `A simple adventurer tunic in blue (#2F7DE1) with a navy belt, short sleeves, unisex.` |
| C-ROBE-GREEN | 森林绿袍 | `robe_green.png` | `Same tunic design in teal green (#1FA39A).` |
| C-ROBE-RED | 红色战袍 | `robe_red.png` | `Same tunic design in coral red (#E5533D).` |
| C-ROBE-PURPLE | 紫色战袍 | `robe_purple.png` | `Same tunic design in purple (#8B4FD8).` |
| C-CAPE-RED | 红色披风 | `cape_red.png` | `A short red cape attached at the shoulders, hanging behind the body (back layer).` |
| C-CAPE-STAR | 星空披风 | `cape_starry.png` | `A short cape with a night-sky pattern of small yellow stars on deep purple (back layer).` |
| C-HAT-BAND | 红头巾 | `hat_red_headband.png` | `A red cloth headband tied at the side with two short trailing ends.` |
| C-WPN-WOOD | 木剑（武器外观） | `wskin_wooden_sword.png` | `A cute wooden practice sword with visible wood grain and a cloth-wrapped handle.` |

> 披风是**背后层**（z 最低），只画从肩膀露出来的部分和身后的布。

### 5.2 Tema 套装（每套 4 件：头 / 身体 / 武器外观 / 披风）

**文件名**：`layers/sets/t{N}_{piece}.png` 和 `icons/sets/t{N}_{piece}.png`，piece = head / body / weapon / cape。

| Tema | 套装 | 头 | 身体 | 武器外观 | 披风 |
|---|---|---|---|---|---|
| 1 和谐村 | 社区英雄 | `A green volunteer cap with a small handshake emblem.` | `A friendly neighbourhood-volunteer vest over a light shirt, green and amber, with many small helper pockets.` | `A sword whose guard is made of two clasped hands, green and amber.` | `A patchwork cape made of many colourful fabric squares sewn together (harmony).` |
| 2 清洁城 | 白衣卫士 | `A white cap with a small teal leaf-and-heart emblem (NOT a red cross).` | `A clean white tunic with teal trim and a teal sash.` | `A funny giant toothbrush shaped like a sword, white and teal bristles.` | `A cape that looks like it is made of shiny soap bubbles.` |
| 3 安全堡垒 | 消防英雄 | `A yellow firefighter-style helmet with a short brim, no real logo.` | `Firefighter-inspired protective jacket in navy with reflective yellow stripes, no real logo.` | `A sword-shaped water nozzle sending a little splash of water.` | `A short orange reflective safety cape with lime-yellow reflective stripes.` |
| 4 文化谷 | 传统服饰 | 两张：`t4_head_boy` → `A black songkok.`；`t4_head_girl` → `A gold floral hair ornament.` | 见 5.3（多款） | `A gamelan mallet styled as a hammer, wooden handle and padded golden head.` | `A cape with a batik pattern in amber, teal and coral.` |
| 5 绿森林 | 森林守护 | `A crown woven from green leaves and small white flowers.` | `Light armor made of overlapping green leaves with a bark-brown belt.` | `A bamboo bow wrapped with vines.` | `A cape made of large green leaves.` |
| 6 国旗之城 | 国旗之城 | `A navy-blue naval captain style cap with a gold band (no real insignia).` | `A smart navy and yellow parade jacket with gold buttons.` | `A sword with a red hibiscus (bunga raya) flower guard.` | `A cape featuring the Jalur Gemilang design: red and white stripes with a blue canton containing a yellow crescent and 14-point star, drawn accurately and respectfully, flowing behind.` |
| 7 科技塔 | 科学家 | `Round science goggles with teal lenses pushed up on the forehead.` | `A white lab coat over a small blue robot chest-plate with glowing lights.` | `A big horseshoe magnet styled as a hammer, red and silver.` | `A compact jetpack with two small blue flame jets (worn on the back instead of a cape).` |
| 8 金币市集 | 小老板 | `A smart little merchant cap in maroon with a gold button.` | `A sharp maroon waistcoat over a white shirt with a small gold pocket watch chain.` | `A sword made of stacked gold coins (generic coins, NOT real ringgit designs).` | `A golden cape with a pattern of generic round coins (no real currency).` |

### 5.3 Tema 4 传统服饰（身体层，男女各一款）

> 请找熟悉该文化的人审核。要**尊重、准确、不搞笑化**。每款附一句文化介绍（游戏里显示）。

| ID | 文件名 | Prompt |
|---|---|---|
| T4-MELAYU-B | `layers/sets/t4_body_melayu_boy.png` | `A traditional Malay baju Melayu outfit for a boy: loose shirt and trousers in teal, with a short songket sampin wrapped at the waist, gold accents.` |
| T4-MELAYU-G | `layers/sets/t4_body_melayu_girl.png` | `A traditional Malay baju kurung for a girl: long loose blouse and long skirt in soft pink with a subtle floral print.` |
| T4-CINA-B | `layers/sets/t4_body_cina_boy.png` | `A traditional Chinese changshan-style jacket for a boy: mandarin collar, frog-knot buttons, deep red with gold pattern.` |
| T4-CINA-G | `layers/sets/t4_body_cina_girl.png` | `A child's cheongsam-inspired outfit for a girl: mandarin collar, knee-length with trousers underneath, red with gold floral pattern, modest cut.` |
| T4-INDIA-B | `layers/sets/t4_body_india_boy.png` | `A traditional Indian kurta set for a boy: long cream kurta with gold embroidery on the collar and loose trousers.` |
| T4-INDIA-G | `layers/sets/t4_body_india_girl.png` | `A traditional pattu pavadai for a girl: silk skirt in green with a wide gold border and a matching blouse.` |
| T4-BORNEO-B | `layers/sets/t4_body_borneo_boy.png` | `A boy's outfit inspired by Sarawak and Sabah traditional attire: black vest with red, yellow and white beadwork patterns, simple woven sash.` |
| T4-BORNEO-G | `layers/sets/t4_body_borneo_girl.png` | `A girl's outfit inspired by Sarawak and Sabah traditional attire: black top and skirt with colourful beadwork, silver-coloured coin-like decorations along the hem (generic, no real currency).` |

---

## 6. 阶级标记（叠在角色上的额外层）

| ID | 文件名 | 规格 | Prompt |
|---|---|---|---|
| R-BADGE-B | `layers/rank/badge_bronze.png` | LAYER | `Only a small round bronze badge pinned on the centre of the chest.` |
| R-BADGE-S | `layers/rank/badge_silver.png` | LAYER | `Only a small round silver badge pinned on the centre of the chest.` |
| R-BADGE-G | `layers/rank/badge_gold.png` | LAYER | `Only a small round gold badge with a tiny star, pinned on the centre of the chest.` |
| R-PAD-S | `layers/rank/shoulder_silver.png` | LAYER | `Only a pair of rounded silver shoulder pads sitting on both shoulders.` |
| R-PAD-G | `layers/rank/shoulder_gold.png` | LAYER | `Only a pair of rounded gold shoulder pads with small engraved swirls.` |
| R-CROWN | `layers/rank/crown_gold.png` | LAYER | `Only a small gold crown-shaped crest sitting on top of the head (fits over hair, helmets and tudung).` |
| R-AURA-S | `layers/rank/aura_silver.png` | LAYER | `Only a soft blue glowing oval of light on the ground under the feet, semi-transparent.` |
| R-AURA-G | `layers/rank/aura_gold.png` | LAYER | `Only a warm golden glow on the ground under the feet with a few floating gold sparkles around the body, semi-transparent.` |
| R-FRAME-B | `ui/frame_bronze.png` | ICON | `A rounded rectangular name-tag frame in bronze, empty inside, transparent centre.` |
| R-FRAME-S | `ui/frame_silver.png` | ICON | `A rounded rectangular name-tag frame in silver, empty inside, transparent centre.` |
| R-FRAME-G | `ui/frame_gold.png` | ICON | `A rounded rectangular name-tag frame in gold with tiny star corners, transparent centre.` |

---

## 7. 宠物（SPEC-SPRITE + SPEC-ICON）

| ID | 中文 | 文件名 | Prompt |
|---|---|---|---|
| P-DRAGON | 小龙 | `sprites/pets/pet_dragon.png` | `A tiny friendly teal baby dragon with small wings, sitting, big happy eyes.` |
| P-KANCIL | 鼠鹿 | `sprites/pets/pet_kancil.png` | `A tiny clever mousedeer (kancil) from Malay folk tales, standing alert, cute.` |
| P-HORNBILL | 犀鸟 | `sprites/pets/pet_hornbill.png` | `A small cute rhinoceros hornbill (kenyalang) with a big orange casque, perched.` |
| P-KITTEN | 小猫 | `sprites/pets/pet_kitten.png` | `A small orange tabby kitten sitting, curious expression.` |

---

## 8. NPC 向导（课本里的朋友）

> 名字取自课本，**造型是我们自己设计的**，不参考课本插图。
> 种族和造型是我的建议，**【可改】**。
> 每位做两张：全身（SPEC-SPRITE）`sprites/npc/{id}_full.png` 和头像（SPEC-PORTRAIT）`sprites/npc/{id}_portrait.png`。

| ID | 名字 | 负责 Tema | Prompt |
|---|---|---|---|
| N-CHUNHAN | Chun Han | 1 和谐村 | `A cheerful Chinese-Malaysian boy, 10, short neat black hair, green t-shirt with a guitar pick pendant, holding a song sheet, natural leader energy.` |
| N-DINESH | Dinesh | 2 清洁城 | `A cheerful Indian-Malaysian boy, 10, curly black hair, white t-shirt and teal shorts, holding a toothbrush and a water bottle, energetic.` |
| N-AIDIL | Aidil | 3 安全堡垒 | `A sporty Malay boy, 10, short black hair, yellow jacket with reflective strip, holding a bicycle helmet, brave and careful look.` |
| N-MEIFUNG | Mei Fung | 4 文化谷 | `An artistic Chinese-Malaysian girl, 10, black bob hair with a red flower clip, coral dress, holding a paintbrush and a paper lantern.` |
| N-NORAH | Norah | 5 绿森林 | `A nature-loving girl from Sabah, 10, long black hair in a low ponytail, green outdoor shirt, holding a recycling bag and a small plant.` |
| N-JOFRI | Jofri | 6 国旗之城 | `A proud boy from Sarawak, 10, short black hair, navy shirt, holding a small Jalur Gemilang flag, big smile.` |
| N-GAURI | Gauri | 7 科技塔 | `A smart Indian-Malaysian girl, 10, long black braid, purple top with a small science badge, holding a tablet and a magnet.` |
| N-NAJWA | Najwa | 8 金币市集 | `A kind Malay girl, 10, wearing a light-blue tudung and a pink baju kurung, holding a small piggy bank, gentle smile.` |
| N-GEBU | Si Gebu（猫） | 吉祥物 | `Si Gebu, a fluffy pure-white cat with fur like cotton, round blue eyes, sitting proudly with a tiny bell collar.`（只做全身） |

---

## 9. 怪物与 Boss

### 9.1 通用怪物（SPEC-SPRITE）

| ID | 中文 | 出现在 | 文件名 | Prompt |
|---|---|---|---|---|
| M-SLIME | 遗忘史莱姆 | 测验关 | `sprites/monsters/m_forget_slime.png` | `A round green slime monster with a dizzy confused face and little question-mark shaped bubbles floating from its head (bubbles only, no actual text).` |
| M-IMP | 量词小妖 | 语法关 | `sprites/monsters/m_counter_imp.png` | `A small purple imp with stubby horns, mischievous grin, holding a blank yellow sign.` |
| M-GUARD | 句子守卫 | 造句关 | `sprites/monsters/m_sentence_guardian.png` | `A friendly stone golem guardian made of stacked puzzle-like word blocks (blank blocks, no letters), glowing amber eyes, holding a big blank stone tablet.` |
| M-REVIEW | 复习魔王 | 每日复习 | `sprites/monsters/m_review_lord.png` | `A purple round blob monster lord wearing a small golden crown, mischievous eyebrows, a stack of floating blank cards orbiting it.` |

### 9.2 每个 Tema 的小怪（SPEC-SPRITE）

| Tema | 中文 | 文件名 | Prompt |
|---|---|---|---|
| 1 | 嘀咕云 | `sprites/monsters/m_t1_grumble_cloud.png` | `A small grumpy grey storm cloud with folded arms and a pouting face, tiny lightning sparks.` |
| 2 | 细菌团 | `sprites/monsters/m_t2_germ.png` | `A cute fuzzy green germ blob with many tiny wiggly arms and a sneaky grin.` |
| 3 | 小火花 | `sprites/monsters/m_t3_spark_imp.png` | `A small orange flame imp with a cheeky face, flickering edges, harmless and cartoonish.` |
| 4 | 偷色蛾 | `sprites/monsters/m_t4_colour_moth.png` | `A grey moth whose wings are half drained of colour, carrying a little paint bucket full of stolen colours.` |
| 5 | 塑料袋鬼 | `sprites/monsters/m_t5_plastic_ghost.png` | `A floating ghost made of a crumpled plastic bag with handle-ears, silly face.` |
| 6 | 海盗蟹 | `sprites/monsters/m_t6_pirate_crab.png` | `A red crab wearing a tiny pirate hat and eyepatch, waving one claw.` |
| 7 | 故障小机器人 | `sprites/monsters/m_t7_glitch_bot.png` | `A small boxy robot with a glitchy screen face showing a zig-zag pattern, one antenna bent.` |
| 8 | 购物车捣蛋鬼 | `sprites/monsters/m_t8_cart_gremlin.png` | `A small gremlin riding a shopping trolley overflowing with random toys and snacks, greedy grin.` |

### 9.3 Tema Boss（SPEC-BOSS，每个做两种状态）

- **战斗状态**：`sprites/bosses/boss_t{N}_battle.png`
- **被打败状态**：`sprites/bosses/boss_t{N}_defeated.png`，同一角色变友善，表示"被打败后改过"

| Tema | Boss | 战斗状态 Prompt | 被打败状态 Prompt |
|---|---|---|---|
| 1 | 吵架怪 Raksasa Sengketa | `A big two-headed purple monster whose two heads are arguing with each other, puffing steam from ears.` | `The same two-headed monster, both heads now smiling and hugging each other, steam gone.` |
| 2 | 蚊子王 Raja Aedes | `A giant cartoon mosquito king with black-and-white striped legs, a small crown, sitting on a dirty old tyre full of water.` | `The same mosquito king looking sheepish, crown tilted, the tyre now empty and clean.` |
| 3 | 火焰怪 Raksasa Api | `A large blazing fire monster with a mischievous face, made of orange and red flames, standing near a kitchen stove.` | `The same fire monster shrunk to a small friendly candle flame, smiling, safe inside a lantern.` |
| 4 | 褪色怪 Raksasa Pudar | `A tall grey shadowy creature draining the colour from a batik cloth and a wau kite into its body, sad and greedy.` | `The same creature now bursting with bright batik colours, happily flying a colourful wau kite.` |
| 5 | 垃圾怪 Raksasa Sampah | `A huge monster made of piled trash: plastic bottles, bags and cans, with a grumpy face.` | `The same monster neatly sorted into three recycling bins (blue, brown, orange), smiling.` |
| 6 | 海盗船长 Kapten Lanun | `A big cartoon pirate captain on a small boat, bushy beard, pirate hat, waving a wooden sword.` | `The same pirate captain saluting respectfully, hat in hand, his boat now flying a white peace flag.` |
| 7 | 生锈机器人 Robot Karat | `A large clunky robot covered in orange rust patches, creaky joints, one eye flickering.` | `The same robot polished shiny and silver, oil can beside it, giving a thumbs up.` |
| 8 | 浪费鬼 Hantu Boros | `A floating ghost throwing generic gold coins into the air, wearing many shopping bags, wasteful grin.` | `The same ghost hugging a piggy bank and holding a neat shopping list, content smile.` |

---

## 10. 道具、宝箱、徽章（SPEC-ICON）

| ID | 中文 | 文件名 | Prompt |
|---|---|---|---|
| I-POT-HINT | 提示药水 | `icons/items/potion_hint.png` | `A round glass potion bottle filled with glowing amber liquid, a tiny lightbulb shape floating inside.` |
| I-POT-TIME | 时间药水 | `icons/items/potion_time.png` | `A round glass potion bottle filled with light-blue liquid, a tiny clock shape floating inside.` |
| I-POT-LIFE | 生命药水 | `icons/items/potion_life.png` | `A round glass potion bottle filled with coral-red liquid, a tiny heart shape floating inside.` |
| I-CHEST-{T} | 宝箱（4 稀有度 × 关 / 开） | `icons/chests/chest_{tier}_closed.png`、`chest_{tier}_open.png` | 关：`A treasure chest, {TIER}, closed with a lock.` 开：`The same treasure chest, open, light shining out, empty inside.` |
| MD-RIM-{M} | 徽章外框（铜 / 银 / 金） | `icons/medals/rim_{bronze/silver/gold}.png` | `An empty round medal rim with a short ribbon, {bronze / silver / gold} metal, transparent centre for an emblem.` |
| MD-T{N} | 8 个 Tema 图案 | `icons/medals/emblem_t{N}.png`（256x256） | T1 `two clasped hands`；T2 `a toothbrush and water droplet`；T3 `a helmet with a small shield`；T4 `a wau kite`；T5 `a green leaf with recycling arrows`；T6 `a red hibiscus flower`；T7 `a magnet and a light bulb`；T8 `a piggy bank with a coin`。前面加：`A simple flat emblem icon of` |

> 徽章 = 外框 + 图案，由程序组合，所以 8 × 3 = 24 种只需要 11 张图。

---

## 11. 背景与地图

| ID | 中文 | 文件名 | 规格 | Prompt |
|---|---|---|---|---|
| BG-MAP | 世界地图 | `bg/world_map.png` | 1080x2340 竖向 | `A vertical illustrated fantasy map of a Malaysian-inspired island world, eight distinct regions connected by a winding dotted path from bottom to top: a friendly village, a clean town with a clinic, a fortress with a fire station, a cultural valley with longhouses and lanterns, a green rainforest with a river, a flag city by the harbour, a science tower, and a market town. No text.` |
| BG-NODE-T{N} | 8 个王国图标 | `bg/nodes/node_t{N}.png` | 512x512 透明 | 用上面地图里同一区域的样子，做成一个小岛图标：`A small floating-island icon of {region}.` |
| BG-T1 | 和谐村战场 | `bg/battle/battle_t1.png` | SPEC-BG | `A cheerful Malaysian residential neighbourhood street with terrace houses, potted plants and community bunting.` |
| BG-T2 | 清洁城战场 | `bg/battle/battle_t2.png` | SPEC-BG | `A bright clean town square with a small clinic, a school canteen and handwashing sinks.` |
| BG-T3 | 安全堡垒战场 | `bg/battle/battle_t3.png` | SPEC-BG | `A school compound with a pedestrian crossing, traffic lights and a fire station in the background.` |
| BG-T4 | 文化谷战场 | `bg/battle/battle_t4.png` | SPEC-BG | `A festive cultural valley with a Malay kampung house, a Chinese shophouse with lanterns, a kolam floor pattern and a Borneo longhouse, all together in harmony.` |
| BG-T5 | 绿森林战场 | `bg/battle/battle_t5.png` | SPEC-BG | `A lush Malaysian rainforest by a clean river, with a recycling station at the edge.` |
| BG-T6 | 国旗之城战场 | `bg/battle/battle_t6.png` | SPEC-BG | `A grand city square decorated for National Day with many Jalur Gemilang flags, and a harbour with ships in the distance.` |
| BG-T7 | 科技塔战场 | `bg/battle/battle_t7.png` | SPEC-BG | `A bright futuristic science lab inside a tower, with solar panels, gadgets and glowing screens.` |
| BG-T8 | 金币市集战场 | `bg/battle/battle_t8.png` | SPEC-BG | `A lively Malaysian night market (pasar malam) with stalls and lights, and a small bank building nearby.` |
| BG-WARD | 衣柜舞台 | `bg/wardrobe_stage.png` | 1080x900 | `A cozy wooden dressing-room stage with a round platform, soft spotlight and wardrobe shelves.` |
| BG-SPLASH | 登入封面 | `bg/splash.png` | 1080x2340 | `A heroic splash scene: a boy and a girl chibi hero standing on a hill at sunrise, overlooking the island world, sword and staff raised, eight friendly NPC kids waving behind them.` |

---

## 12. 其他

### 12.1 界面图标（可选，SPEC-ICON，256x256）

如果想让界面图标和画风一致，可以生成这 10 个；不做的话，原型里的矢量图标也能用。

`ui/icon_heart.png` 红心、`ui/icon_coin.png` 金币、`ui/icon_hint.png` 灯泡、`ui/icon_pause.png` 暂停、`ui/icon_clock.png` 时钟、`ui/icon_shield.png` 盾、`ui/icon_star.png` 星星、`ui/icon_lock.png` 锁、`ui/icon_speaker.png` 喇叭、`ui/icon_xp.png` 经验水晶。

Prompt 模板：`A simple game UI icon of {object}, chunky and bold, readable at small size.`

### 12.2 生字卡图片（SPEC-CARD，以后按词库批量）

全年约 600 张，等词库（JSON）定了，我会从词库自动生成每个字的提示词。模板：

```
{STYLE} {SPEC-CARD} An illustration showing "{english_meaning}" ({word} in Malay),
in a Malaysian everyday context. {extra_hint}
```

例子：
- `berus gigi` → `An illustration showing "toothbrush" with a little toothpaste on it.`
- `kebakaran` → `An illustration showing "a house fire" from a safe distance, firefighters spraying water, not scary.`
- `bergotong-royong` → `An illustration showing "neighbours working together to clean the neighbourhood".`

> 动作和抽象词（如 bersetuju 同意、seikhlas hati 真心）要用**情境**表达，例如两个孩子点头握手。

---

## 13. 交回的格式（让我可以直接组装）

### 13.1 文件夹

```
assets/
├── style/            画风定稿
├── layers/           纸娃娃层（1024x1024，透明，全部对齐底模）
│   ├── base/ hair/ gear/ weapons/ outfits/ sets/ rank/
├── icons/            512x512 图标
│   ├── gear/ weapons/ outfits/ sets/ items/ chests/ medals/
├── sprites/          npc/ monsters/ bosses/ pets/
├── bg/               地图、王国图标、战斗背景
├── ui/               名字框、界面图标
└── manifest.json
```

### 13.2 叠层顺序（z 值，小的在下面）

| z | 层 |
|---|---|
| 0 | 阶级光环（地面部分）R-AURA |
| 10 | 披风 / 喷射背包（背后层） |
| 20 | 底模 base |
| 30 | 靴子 |
| 40 | 战袍 / 铠甲 / 套装身体 |
| 50 | 手套 |
| 55 | 阶级肩甲 |
| 60 | 护符、阶级胸章 |
| 70 | 头发 / tudung |
| 80 | 头盔 / 帽子 |
| 85 | 阶级金冠 |
| 90 | 武器（右手） |
| 95 | 盾牌（左手） |
| 100 | 光点特效 |

### 13.3 manifest.json 格式

```json
{
  "version": 1,
  "assets": [
    {
      "id": "G-HELM",
      "tier": "epic",
      "name": { "zh": "智慧头盔", "en": "Helm of Wisdom" },
      "kind": "gear",
      "slot": "head",
      "z": 80,
      "layer": "layers/gear/g-helm_epic.png",
      "icon": "icons/gear/g-helm_epic.png",
      "fits": ["boy", "girl"],
      "source": "chest"
    },
    {
      "id": "BOSS-T2",
      "kind": "boss",
      "tema": 2,
      "name": { "zh": "蚊子王", "en": "Mosquito King", "ms": "Raja Aedes" },
      "battle": "sprites/bosses/boss_t2_battle.png",
      "defeated": "sprites/bosses/boss_t2_defeated.png"
    }
  ]
}
```

- `kind`：base / hair / gear / weapon / outfit / set / rank / pet / npc / monster / boss / item / chest / medal / bg / ui
- `slot`：back / body / feet / hands / neck / head / hair / mainhand / offhand / effect
- `name` 填中文和英文（配合双语界面），角色和 Boss 再加国语名 `ms`。

---

## 14. 生成顺序建议

| 批次 | 内容 | 为什么 |
|---|---|---|
| 1 | A0 画风定稿 → B-BOY-1 底模 | 先定画风和位置，后面全部以此为参考 |
| 2 | 其他 5 个底模 + 7 个发型 | 检查叠层是否对齐 |
| 3 | 蓝色战袍 + 6 种普通防具 + 剑 / 法杖（普通） | **MVP 需要的最少套**，做完就能在原型里试换装 |
| 4 | 通用怪物 4 个 + Tema 1 小怪和 Boss + Chun Han | MVP 的 Tema 1 |
| 5 | 道具、宝箱、徽章、Tema 1 战斗背景、世界地图 | MVP 完整 |
| 6 | 其余稀有度、弓 / 锤、阶级标记、宠物 | v1 |
| 7 | Tema 2–8 的套装、小怪、Boss、NPC、背景 | v1，跟着内容进度做 |
| 8 | 生字卡图片 | 词库定了之后批量生成 |

> **对齐检查**：每批做完，把层叠在 B-BOY-1 上看一次。位置偏了就用"参考图 + 重新生成"，不要手动去调几十张。
