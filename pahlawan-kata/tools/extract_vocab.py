"""Extract vocabulary candidates per Unit from the Tahun 4 SJK textbook text.

Usage:
    pdftotext -layout reference/Bahasa_Melayu_Tahun_4_SJK.pdf reference/book.txt
    python3 tools/extract_vocab.py reference/book.txt data/vocab_candidates

Output: one CSV per Unit (unit_01.csv ... unit_24.csv) with columns
    word, root, count_in_unit, units_with_root, suggestion
suggestion:
    A-candidate  appears 2+ times in this Unit and in <= 4 Units overall (core words)
    B-candidate  appears once in this Unit and in <= 4 Units overall
The lists are CANDIDATES. Pack A/B/C are chosen by a human (see docs/design-v0.3.md section 4).
Root stripping is a rough heuristic, not a real Malay stemmer.
"""
import collections
import csv
import os
import re
import sys

# PDF page ranges (1-based PDF pages, not printed page numbers) for each Unit.
UNIT_PAGES = {
    1: (8, 12), 2: (13, 17), 3: (18, 22), 4: (28, 32), 5: (33, 37), 6: (38, 42),
    7: (48, 51), 8: (52, 56), 9: (57, 61), 10: (67, 71), 11: (72, 76), 12: (77, 81),
    13: (88, 92), 14: (93, 97), 15: (98, 101), 16: (108, 112), 17: (113, 117), 18: (118, 122),
    19: (129, 133), 20: (134, 138), 21: (139, 143), 22: (149, 153), 23: (154, 158), 24: (159, 163),
}

STOP = set("""yang dan di ke dari daripada itu ini dengan untuk pada dalam ialah adalah akan telah sudah
tidak bukan juga atau kerana oleh mereka kita kami saya dia beliau kamu aku ada pun lagi sangat amat lebih
paling boleh dapat perlu mesti harus mahu hendak ingin seperti bagi tentang secara sebagai antara semua setiap
sebuah seorang seekor suatu hari kepada bahawa jika apabila semasa selepas sebelum ketika supaya agar namun
tetapi lalu kemudian maka iaitu mari marilah minta murid nota guru bimbing kbat emk strategi pdp nilai murni
tema unit tulis baca bina berikan lengkapkan jawapan ayat soalan contoh celik bahasa ilmu imbas sebut dengar
fahami petikan analisis sampaikan respons maklumat teks gambar tersebut begitu sesuatu banyak pelbagai
sentiasa selalu sering apakah bagaimanakah mengapakah siapakah berapakah manakah sambil hingga sehingga masih
belum baru baharu sendiri sama terima kasih selamat pagi berdasarkan betul kontekstual konstruktivisme
interpersonal mencatat menganalisis menilai mengaplikasi mencipta encik puan tuan abang kakak adik ibu ayah
bapa datuk nenek""".split())

# Recurring character / place names in the book (not vocabulary).
NAMES = set("""chun han aidil dinesh najwa mei fung gauri jofri norah sutera taman sjkc sjkt ladang jati wei
pravin prema nora halim siew min koh ming lam tan rubiah gunalan johari nizam yazid rohaya nurul arif ahmad
ridzuan puzi wan lee thiam wah hasan daud ali azura gebu shanti fazli""".split())

PREFIXES = ["memper", "diper", "meng", "meny", "mem", "men", "peng", "peny", "pem", "pen",
            "ber", "ter", "per", "me", "di", "pe", "ke", "se"]
SUFFIXES = ["kannya", "nya", "kan", "an", "i"]


def root(word):
    parts = word.split("-")
    if len(parts) == 2 and parts[0] == parts[1]:  # kata ganda: burung-burung -> burung
        word = parts[0]
    s = word
    for suf in SUFFIXES:
        if s.endswith(suf) and len(s) - len(suf) >= 4:
            s = s[: -len(suf)]
            break
    for pre in PREFIXES:
        if s.startswith(pre) and len(s) - len(pre) >= 4:
            s = s[len(pre):]
            break
    return s


def main(text_path, out_dir):
    pages = open(text_path, encoding="utf-8").read().split("\f")
    os.makedirs(out_dir, exist_ok=True)
    unit_counts = {}
    for unit, (a, b) in UNIT_PAGES.items():
        text = re.sub(r"\s+", " ", " ".join(pages[a - 1:b]).lower())
        words = [w for w in re.findall(r"[a-z]+(?:-[a-z]+)?", text)
                 if len(w) > 3 and w not in STOP and w not in NAMES]
        unit_counts[unit] = collections.Counter(words)

    spread = collections.Counter()
    for counts in unit_counts.values():
        spread.update({root(w) for w in counts})

    for unit, counts in unit_counts.items():
        rows = []
        for w, c in counts.items():
            r = root(w)
            if spread[r] > 4:
                continue  # common across the book: likely already known / not unit-specific
            rows.append((w, r, c, spread[r], "A-candidate" if c >= 2 else "B-candidate"))
        rows.sort(key=lambda x: (x[4], -x[2], x[3], x[0]))
        path = os.path.join(out_dir, f"unit_{unit:02d}.csv")
        with open(path, "w", newline="", encoding="utf-8") as f:
            wr = csv.writer(f)
            wr.writerow(["word", "root", "count_in_unit", "units_with_root", "suggestion"])
            wr.writerows(rows)
        a = sum(1 for x in rows if x[4] == "A-candidate")
        print(f"unit {unit:2d}: {a:3d} A-candidates, {len(rows) - a:3d} B-candidates -> {path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
