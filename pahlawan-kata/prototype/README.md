# 原型画面（21 个）

这些 `.dc.html` 是 claude.ai 设计画布的源码格式，**不能直接用浏览器打开运行**（需要画布的 runtime）。
在 Claude Code 里，请把它们当作**视觉和流程参考**：看布局、颜色、文字、交互逻辑（`<script>` 里的 `renderVals()`），再用 React 重新实现。

要看能点的版本，请打开 claude.ai 上的原画布（Yang 的私人 artifact：「词语勇士 Pahlawan Kata — 手机原型」）。

## 画面对照

| # | 文件 | 画面 | 有交互 |
|---|---|---|---|
| 1 | `Main.dc.html` | 登入 / 选择孩子（头像 + 图案密码） | 链接 |
| 2 | `CharacterCreate.dc.html` | 创建角色（男 / 女、名字、战袍颜色） | 切换男女、颜色 |
| 3 | `Map.dc.html` | 世界地图：8 个 Tema 王国 | 链接 |
| 4 | `Kingdom.dc.html` | Tema 2 王国：3 个 Unit + 4P 结局 | 链接 |
| 5 | `Learn.dc.html` | 认字翻卡 | 点卡片翻面 |
| 6 | `Quiz.dc.html` | 测验战斗 | 选答案 → 对 / 错效果 |
| 7 | `QuizFreeze.dc.html` | 时间暂停 + 提示（删去两个选项） | 链接 |
| 8 | `Sentence.dc.html` | 造句：词块排序 | 点词块排句、检查 |
| 9 | `Boss.dc.html` | Tema Boss 战（三段血条、句子填空） | 链接 |
| 10 | `Result.dc.html` | 结算（星星、XP、需复习的字） | 链接 |
| 11 | `Chest.dc.html` | 开宝箱、获得装备 | 链接 |
| 12 | `LevelUp.dc.html` | 升级、分配属性点 | 加点 |
| 13 | `Inventory.dc.html` | 装备背包（7 格 + 属性） | 点格子看详情 |
| 14 | `Shop.dc.html` | 商店（药水 / 外观） | 切换分页 |
| 15 | `Parent.dc.html` | 家长面板 | 切换孩子、时间上限开关 |
| 16 | `Loadout.dc.html` | 出战准备、3 套组合 | 切换组合 |
| 17 | `Grammar.dc.html` | 语法关：Penjodoh bilangan | 作答、看规则、下一题 |
| 18 | `SeniBahasa.dc.html` | 秘境：谚语配对 | 配对 |
| 19 | `Wardrobe.dc.html` | 衣柜：战袍 / 武器 / 披风 / 头饰、只换样子 | 换装 |
| 20 | `Difficulty.dc.html` | 分级结果、选难度、中文 / EN、意思显示 | 切换语言、难度 |
| 21 | `Ranks.dc.html` | 阶级外观（铜 / 银 / 金）、徽章墙 | 选择显示阶级 |

`canvas.json` 是画布的排版索引，可以忽略。

## 注意

- 认字（5）、测验（6）、时间暂停（7）、造句（8）和 Boss（9）这几个画面用的是**早期示例词**，还没换成 Tema 2 的生字。以 `data/` 里的内容为准。
- 原型的角色是简单 SVG；正式版用 `assets/` 的纸娃娃叠层（见 `docs/art-assets-and-prompts.md`）。
