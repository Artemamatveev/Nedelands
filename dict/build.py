# Builds dict/nl-en.txt from the kaikki.org (English Wiktionary) Dutch extract.
# Entry lines: lemma \t pos \t info \t glosses ; after a line "#": form \t lemma:pos|lemma:pos
# Usage: python3 -I dict/build.py kaikki.org-dictionary-Dutch.jsonl.gz dict/nl-en.txt
# (data: https://kaikki.org/dictionary/Dutch/ , from English Wiktionary, CC BY-SA 4.0)
import gzip,json,sys,re,collections
src,out=sys.argv[1],sys.argv[2]
POS={"noun":"n","verb":"v","adj":"a","adv":"d","prep":"p","pron":"r","conj":"c","num":"u","article":"t","det":"t","intj":"i","name":"m","particle":"x","contraction":"x","postp":"p","circumpos":"p"}
OLD={"obsolete","archaic","dated","rare","historical","Flanders","Belgium","Suriname","majestic","dialectal","nonstandard","proscribed","misspelling","Brabant","Limburg"}
BADF={"table-tags","inflection-template","error-unrecognized-form","subjunctive","partitive","alternative"}|OLD
entries=collections.OrderedDict(); forms=collections.defaultdict(list)
def addform(f,l,p):
    if f and l and f!=l and " " not in f and (l,p) not in forms[f]: forms[f].append((l,p))
def clean(g):
    g=g.split("\n")[0].strip().rstrip(".:;")
    g=re.sub(r"\s+"," ",g)
    return g if len(g)<=80 else g[:77].rsplit(" ",1)[0]+"…"
for line in gzip.open(src,"rt"):
    e=json.loads(line)
    if e.get("lang_code")!="nl": continue
    w=e["word"]; p=POS.get(e["pos"])
    if not p or " " in w or len(w)>40: continue
    senses=e.get("senses") or []
    real=[]
    for s in senses:
        fo=(s.get("form_of") or [])+(s.get("alt_of") or [])
        if fo:
            for x in fo: addform(w,x.get("word"),p)
            g=s.get("glosses") or [""]
            if ";" in g[-1] and not g[-1].startswith("inflection of"):
                real.append({"glosses":[g[-1].split(";",1)[1].strip()],"tags":[]})
            continue
        if not s.get("glosses") or "no-gloss" in (s.get("tags") or []): continue
        real.append(s)
    if not real: continue
    keep=[s for s in real if not OLD&set(s.get("tags") or [])] or real
    gl=[]
    for s in keep:
        g=clean(s["glosses"][-1])
        if g and g not in gl: gl.append(g)
        if len(gl)==3: break
    if not gl: continue
    info=""
    F=[f for f in (e.get("forms") or []) if not BADF&set(f.get("tags") or [])]
    if p=="n":
        head=" ".join(h.get("expansion","") for h in e.get("head_templates") or [])
        m=re.match(re.escape(w)+r" ((?:[mfnc](?:pl)?(?: or |, |/)?)+)",head)
        g=set(re.findall(r"[mfnc]",m.group(1))) if m else set()
        if not g:
            for s in real: g|={"n"} if "neuter" in (s.get("tags") or []) else set(); g|={"m"} if {"masculine","feminine","common"}&set(s.get("tags") or []) else set()
        art="de/het" if "n" in g and g-{"n"} else "het" if g=={"n"} else "de" if g else ""
        pl=next((f["form"] for f in F if "plural" in f.get("tags",[]) and "diminutive" not in f.get("tags",[])),"")
        info=" · ".join(x for x in (art,"mv. "+pl if pl else "") if x)
    elif p=="v":
        past=next((f["form"] for f in F if {"past","singular","third-person"}<=set(f.get("tags",[])) and "subordinate-clause" not in f.get("tags",[])),"")
        pp=next((f["form"] for f in F if {"participle","past"}<=set(f.get("tags",[]))),"")
        info=" – ".join(x for x in (past,pp) if x)
    for f in (F if p in ("n","v","a") else []):
        if f.get("source") in ("conjugation","declension") or {"plural","diminutive","comparative","superlative"}&set(f.get("tags",[])):
            addform(f.get("form"),w,p)
    entries.setdefault(w,[]).append((p,info,"; ".join(gl)))
# one line per lemma and part of speech, at most 3 meanings; form links only to inflecting words
lines=[]
for w,es in entries.items():
    merged=collections.OrderedDict()
    for p,i,g in es:
        m=merged.setdefault(p,[i,[]])
        if not m[0]: m[0]=i
        for x in g.split("; "):
            if x not in m[1] and len(m[1])<3: m[1].append(x)
    for p,(i,gl) in merged.items(): lines.append(f"{w}\t{p}\t{i}\t{'; '.join(gl)}")
fl=[]
for f,ls in forms.items():
    ls=[(l,p if any(q==p for q,_,_ in entries[l]) else "") for l,p in ls if l in entries]
    if ls: fl.append(f"{f}\t{'|'.join(l+':'+p for l,p in ls[:3])}")
open(out,"w").write("\n".join(lines)+"\n#\n"+"\n".join(fl)+"\n")
print(len(entries),"lemmas",len(lines),"entry lines",len(fl),"forms")
