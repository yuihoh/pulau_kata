# reference/

把课本 PDF 放在这里（**不要提交到 git**，`.gitignore` 已经排除）：

```
reference/Bahasa_Melayu_Tahun_4_SJK.pdf
```

需要重新统计候选词时：

```bash
pdftotext -layout reference/Bahasa_Melayu_Tahun_4_SJK.pdf reference/book.txt
python3 tools/extract_vocab.py reference/book.txt data/vocab_candidates
```

课本版权属于 KPM / DBP，只能用来**参考和统计**，不能把课文、诗歌、歌词或插图放进游戏。
