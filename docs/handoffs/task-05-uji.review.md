- **Medium — [Uji.tsx:324](C:/Users/yuiho/projects/pulau_kata/apps/web/src/stages/Uji.tsx:324): Hint can complete a scramble without submitting.** Place every tile except the hint’s first-letter tile, then tap Hint: all slots fill and all tiles disable, but no feedback appears. Submission only runs inside `place()`. Route hint placement through the completion check and add a regression test.

- **Medium — [Uji.tsx:111](C:/Users/yuiho/projects/pulau_kata/apps/web/src/stages/Uji.tsx:111): Advancing loses focus without announcing the next question.** After answering with the keyboard, the focused option unmounts; reproduced focus lands on `BODY`. Screen-reader users receive no new prompt announcement. Focus an accessible question heading whenever the question or attempt changes.

- **Medium — [Uji.tsx:181](C:/Users/yuiho/projects/pulau_kata/apps/web/src/stages/Uji.tsx:181): Picture questions hide their only clue from screen readers.** `alt=""` makes the picture decorative, leaving users with instructions and options but no information to choose an answer. Provide a meaningful description in the support language, or select an equivalent accessible question type.

- **Low — [Uji.tsx:421](C:/Users/yuiho/projects/pulau_kata/apps/web/src/stages/Uji.tsx:421): Final failures incorrectly promise another retry.** On the third wrong attempt, “This word will come back soon” still appears, although Continue retires the word—and can immediately finish the session. Show this message only when the queue will actually reinsert the question.

- **Low — [Uji.tsx:419](C:/Users/yuiho/projects/pulau_kata/apps/web/src/stages/Uji.tsx:419): Translated meanings are marked as Malay.** A wrong `word-meaning` answer renders English or Chinese inside `lang="ms"`, causing screen readers to use the wrong pronunciation. Use the support language for meanings and `ms` for BM answers.

- **Low — [Uji.tsx:356](C:/Users/yuiho/projects/pulau_kata/apps/web/src/stages/Uji.tsx:356): Scramble removal targets are narrower than required.** Filled slots use `w-10` (40px); children correcting adjacent letters on a phone must hit targets below CLAUDE.md’s 44px minimum. Increase their width to at least 44px and retain responsive wrapping.

Overall verdict: Request changes for the scramble completion bug and accessibility gaps.