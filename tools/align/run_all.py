"""
Align every surah for the archive reciters, shortest surahs first, writing JSON into the app repo.

  python run_all.py [--only x-kurdi] [--surahs 112,113,114]

Audio is downloaded per surah and deleted afterwards. Existing outputs are skipped, so the
script can be re-run to continue. Progress goes to run_all.log.
"""
import argparse, json, os, pathlib, subprocess, sys, time, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from align import align_surah

RECITERS = {
    "x-ajmi": "ahmed_ibn_3ali_al-3ajamy",
    "x-muaiqly": "maher_almu3aiqly/year1440",
    "x-kurdi": "raad_mohammad_al_kurdi/mp3",
}
OUT = pathlib.Path("/home/user/quran-and-more/apps/web/data/timings")
AUDIO = pathlib.Path("/opt/align/data/audio")

def words_in(surah: int) -> int:
    d = json.load(open(f"/opt/align/data/text/{surah}.json", encoding="utf-8"))
    return sum(len(v["words"]) for v in d["verses"])

def download(slug: str, surah: int) -> pathlib.Path:
    p = AUDIO / f"{slug.replace('/', '_')}_{surah:03d}.mp3"
    if p.exists() and p.stat().st_size > 10000: return p
    url = f"https://download.quranicaudio.com/quran/{slug}/{surah:03d}.mp3"
    subprocess.run(["curl", "-sS", "-L", "--retry", "3", "-m", "900", "-o", str(p), url], check=True)
    return p

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--surahs")
    a = ap.parse_args()
    reciters = {k: v for k, v in RECITERS.items() if not a.only or k == a.only}
    surahs = [int(s) for s in a.surahs.split(",")] if a.surahs else sorted(range(1, 115), key=words_in)
    log = open("/opt/align/run_all.log", "a")
    for surah in surahs:
        for rid, slug in reciters.items():
            out = OUT / rid / f"{surah}.json"
            if out.exists(): continue
            t0 = time.time()
            try:
                audio = download(slug, surah)
                res = align_surah(rid, surah, str(audio))
                out.parent.mkdir(parents=True, exist_ok=True)
                json.dump(res, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
                m = res["method"]
                line = f"{time.strftime('%H:%M:%S')} {rid} {surah}: verses={len(res['timestamps'])} words={m['words']} pieces={m['pieces']} fallback={m['fallbackPieces']} lowconf={m['lowConfidenceWords']} dur={res['durationMs']//1000}s took={int(time.time()-t0)}s"
            except Exception as e:  # noqa: BLE001
                line = f"{time.strftime('%H:%M:%S')} {rid} {surah}: FAILED {e!r}"
            print(line, flush=True); log.write(line + "\n"); log.flush()
            try: (AUDIO / f"{slug.replace('/', '_')}_{surah:03d}.mp3").unlink()
            except OSError: pass

if __name__ == "__main__":
    main()
