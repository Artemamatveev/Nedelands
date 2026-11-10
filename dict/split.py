# Splits dict/nl-en.txt into parts by the first letter of each word: dict/nl-en/a.txt … z.txt, and _.txt for words that
# start with anything else (digits, ĳ, ’s). Each part has the same format as the whole file: entry lines, "#", then
# form lines, each line in the part of its own first word. The app loads a part the first time a word needs it.
# Usage: python3 -I dict/split.py   (dict/build.py runs it too). Then: node tools/stamp.mjs (the parts' version).
import os, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
SRC, OUT = os.path.join(HERE, "nl-en.txt"), os.path.join(HERE, "nl-en")

def shard(word):
    # the same as dshard() in oefenen.html
    c = unicodedata.normalize("NFD", word[:1].lower())[:1]
    return c if "a" <= c <= "z" else "_"

def main():
    entries, forms, in_forms = {}, {}, False
    with open(SRC, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if line == "#": in_forms = True; continue
            if not line: continue
            key = line.split("\t", 1)[0]
            (forms if in_forms else entries).setdefault(shard(key), []).append(line)
    os.makedirs(OUT, exist_ok=True)
    for name in os.listdir(OUT):
        if name.endswith(".txt"): os.remove(os.path.join(OUT, name))
    for s in "abcdefghijklmnopqrstuvwxyz_":
        with open(os.path.join(OUT, s + ".txt"), "w", encoding="utf-8") as f:
            f.write("\n".join(entries.get(s, [])) + "\n#\n" + "\n".join(forms.get(s, [])) + "\n")

if __name__ == "__main__":
    main()
