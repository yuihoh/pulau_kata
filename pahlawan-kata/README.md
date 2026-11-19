# 词语勇士 Pahlawan Kata — 开发交接包

这个文件夹就是项目起点：解压后直接当 Claude Code 的项目目录。

## 内容

```
pahlawan-kata/
├── CLAUDE.md                     ← Claude Code 每次开工都会自动读：规则、数值、技术方向、MVP
├── README.md                     ← 这份
├── .gitignore
├── docs/
│   ├── design-v0.3.md            游戏设计文档（以这份为准）
│   └── art-assets-and-prompts.md 美术资源清单 + Codex 提示词 + manifest 格式
├── data/
│   ├── textbook_map.json         8 Tema × 24 Unit：语法点、Seni Bahasa、189 个已核对示例生字（中 / 英）
│   ├── schema/unit.schema.json   Unit 词库格式
│   ├── sample/t2_u4.json         一个 Unit 的格式示例（草稿）
│   └── vocab_candidates/         24 个 CSV：每个 Unit 的候选词（A / B 包候选）
├── tools/
│   └── extract_vocab.py          从课本重新统计候选词
├── prototype/                    21 个原型画面源码 + 说明
└── reference/                    放课本 PDF（不提交到 git）
```

## 开始步骤

1. 解压到你想放的位置，例如 `~/projects/pahlawan-kata`
2. 把课本 PDF 复制到 `reference/Bahasa_Melayu_Tahun_4_SJK.pdf`
3. 初始化 git：

   ```bash
   cd ~/projects/pahlawan-kata
   git init && git add . && git commit -m "Design handoff"
   ```

4. 在这个文件夹启动 Claude Code：`claude`
5. 第一个指令可以用下面这段

## 建议的第一个指令

```
请先读 CLAUDE.md、docs/design-v0.3.md 和 prototype/README.md。
然后：
1. 用三五句话说说你对这个游戏的理解，再列出你还需要我决定的问题。
2. 提出项目脚手架方案（React + TS + Vite PWA + Supabase），等我确认后再建。
3. 脚手架确认后，第一个任务是 src/game/ 的纯逻辑：计分、Leitner 间隔重复、
   难度词包、Tema 解锁、积分防刷规则，全部配上单元测试。
```

## 之后要补的东西

| 项目 | 谁来做 | 放在哪里 |
|---|---|---|
| Tema 1 三个 Unit 的 A / B 包词表（每包 12 个） | 你挑选，参考 `data/vocab_candidates/` | `content/tahun4/t1_u{1,2,3}.json` |
| 例句、语法题、造句题 | Claude Code 用 AI 起草，你或老师审核 | 同上 |
| 美术图片 | Codex，按 `docs/art-assets-and-prompts.md` | `assets/` + `assets/manifest.json` |
| 发音 | TTS（马来语语音）批量生成 | `assets/audio/` |
