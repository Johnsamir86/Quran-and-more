"""Fetch per-surah word tables (uthmani + imlaei simple) from the v4 API into data/text/{n}.json."""
import json, sys, time, urllib.request, pathlib
BASE = "https://api.quran.com/api/v4"
out = pathlib.Path("data/text")
def get(url):
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"accept": "application/json", "user-agent": "quran-and-more-aligner/0.1"}), timeout=60) as r:
                return json.load(r)
        except Exception as e:
            time.sleep(2 * (attempt + 1)); err = e
    raise err
chapters = {c["id"]: c for c in get(f"{BASE}/chapters")["chapters"]}
for n in range(1, 115):
    p = out / f"{n}.json"
    if p.exists(): continue
    verses = []
    page = 1
    while True:
        d = get(f"{BASE}/verses/by_chapter/{n}?words=true&per_page=50&page={page}&fields=text_uthmani,text_imlaei_simple&word_fields=text_uthmani,text_imlaei_simple,char_type_name")
        for v in d["verses"]:
            words = [{"position": w["position"], "uthmani": w.get("text_uthmani") or "", "simple": w.get("text_imlaei_simple") or ""}
                     for w in v["words"] if w.get("char_type_name", "word") == "word"]
            verses.append({"key": v["verse_key"], "number": v["verse_number"], "words": words})
        if not d["pagination"].get("next_page"): break
        page = d["pagination"]["next_page"]
    ch = chapters[n]
    json.dump({"chapter": n, "name": ch["name_arabic"], "bismillah_pre": ch["bismillah_pre"], "verses": verses}, open(p, "w"), ensure_ascii=False)
    print(n, len(verses), "verses", sum(len(v["words"]) for v in verses), "words", flush=True)
