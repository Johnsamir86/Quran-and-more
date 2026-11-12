"""
Word-level forced alignment of a full-surah recitation against the Quran text.

  python align.py --reciter x-kurdi --slug raad_mohammad_al_kurdi/mp3 --surah 112 --out out/x-kurdi/112.json

Method
  1. Decode the mp3 to 16 kHz mono (ffmpeg).
  2. CTC emissions from torchaudio's MMS_FA model, computed in 30 s windows with 2 s context.
  3. Reference tokens: romanised (uroman) Imlaei-simple words of the surah, with an optional
     isti'adha (detected from the greedy transcript) and the Basmala for surahs other than 1 and 9.
  4. Anchors: unique 10-grams shared by the greedy CTC transcript and the reference text,
     kept monotonic; the audio/text pair is cut at word-start anchors into pieces of at most
     ~2.5 minutes so exact Viterbi forced alignment stays cheap.
  5. Each piece is force-aligned; word spans become [position, fromMs, toMs]; verse spans are
     the first/last word of the verse. Output matches the app's ChapterTimestamp shape.
"""
import argparse, json, math, os, pathlib, subprocess, sys, time
import numpy as np
import torch, torchaudio
from uroman import Uroman

torch.set_num_threads(max(1, os.cpu_count() or 1))
SR = 16000
FRAME_MS = 20.0           # MMS_FA emits one frame per 320 samples at 16 kHz
LEAD_MS = 100             # CTC spikes trail onsets; benchmark vs official Afasy timings showed a steady ~100 ms lag
WINDOW_S, CTX_S = 30.0, 2.0
MAX_PIECE_FRAMES = 10000  # 200 s
ANCHOR_K = 10
ISTIADHA = ["أعوذ", "بالله", "من", "الشيطان", "الرجيم"]
BASMALA = ["بسم", "الله", "الرحمن", "الرحيم"]

_bundle = torchaudio.pipelines.MMS_FA
_model = None; _tokenizer = None; _aligner = None; _uroman = Uroman()

def model():
    global _model, _tokenizer, _aligner
    if _model is None:
        _model = _bundle.get_model(with_star=False).eval()
        _tokenizer = _bundle.get_tokenizer(); _aligner = _bundle.get_aligner()
    return _model, _tokenizer, _aligner

def decode_audio(path: str) -> np.ndarray:
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).copy()

def romanize(word: str) -> str:
    r = _uroman.romanize_string(word).lower()
    r = "".join(c for c in r if "a" <= c <= "z" or c == "'")
    return r or "a"

@torch.inference_mode()
def emissions(wave: np.ndarray) -> torch.Tensor:
    m, _, _ = model()
    n = len(wave); win = int(WINDOW_S * SR); ctx = int(CTX_S * SR); hop = 320
    out = []
    for a in range(0, n, win):
        b = min(n, a + win)
        s, e = max(0, a - ctx), min(n, b + ctx)
        chunk = torch.from_numpy(wave[s:e])[None]
        em, _ = m(chunk)
        em = torch.log_softmax(em[0], dim=-1)
        lead = (a - s) // hop
        keep = math.ceil((b - a) / hop)
        out.append(em[lead:lead + keep])
    return torch.cat(out, 0)

def greedy(em: torch.Tensor):
    """Greedy CTC decode -> (chars, frame index per char) using the bundle's labels."""
    labels = _bundle.get_labels(star=None)
    ids = em.argmax(-1).tolist()
    chars, frames, prev = [], [], 0
    for t, i in enumerate(ids):
        if i != prev and i != 0:
            chars.append(labels[i]); frames.append(t)
        prev = i
    return "".join(chars), frames

def anchors(dec: str, dec_frames, ref: str, k=ANCHOR_K):
    """Unique k-grams in both strings, monotonic (longest increasing subsequence on ref index)."""
    from collections import Counter
    rc = Counter(ref[i:i + k] for i in range(len(ref) - k + 1))
    dc = Counter(dec[i:i + k] for i in range(len(dec) - k + 1))
    rpos = {ref[i:i + k]: i for i in range(len(ref) - k + 1) if rc[ref[i:i + k]] == 1}
    cands = [(i, rpos[dec[i:i + k]]) for i in range(len(dec) - k + 1) if dc[dec[i:i + k]] == 1 and dec[i:i + k] in rpos]
    # LIS on ref index to drop out-of-order false matches
    import bisect
    tails, tails_idx, prev = [], [], [-1] * len(cands)
    for n, (_, r) in enumerate(cands):
        j = bisect.bisect_left(tails, r)
        if j == len(tails): tails.append(r); tails_idx.append(n)
        else: tails[j] = r; tails_idx[j] = n
        prev[n] = tails_idx[j - 1] if j else -1
    seq = []; n = tails_idx[-1] if tails_idx else -1
    while n != -1: seq.append(cands[n]); n = prev[n]
    seq.reverse()
    return [(dec_frames[i], r) for i, r in seq]

def align_surah(reciter: str, surah: int, audio_path: str, text_dir="data/text"):
    t0 = time.time()
    meta = json.load(open(f"{text_dir}/{surah}.json", encoding="utf-8"))
    wave = decode_audio(audio_path)
    em = emissions(wave)
    T = em.shape[0]
    dec, dec_frames = greedy(em)

    # Reference word list: [isti'adha?] [basmala?] verse words...
    words = []  # (romanized, verse_key or None, position)
    def present(phrase_words, prefix_chars=400, k=4, threshold=0.5):
        """Share of the phrase's k-grams found in the start of the greedy transcript."""
        ph = "".join(romanize(w) for w in phrase_words); head = dec[:prefix_chars]
        grams = [ph[i:i + k] for i in range(len(ph) - k + 1)]
        return grams and sum(1 for g in grams if g in head) / len(grams) >= threshold
    ist = [romanize(w) for w in ISTIADHA]
    has_ist = bool(present(ISTIADHA))
    if has_ist:
        words += [(r, "istiadha", i + 1) for i, r in enumerate(ist)]
    has_basmala = bool(meta["bismillah_pre"] and surah not in (1, 9) and present(BASMALA, prefix_chars=600))
    if has_basmala:
        words += [(romanize(w), "basmala", i + 1) for i, w in enumerate(BASMALA)]
    for v in meta["verses"]:
        for w in v["words"]:
            words.append((romanize(w["simple"] or w["uthmani"]), v["key"], w["position"]))

    ref = "".join(r for r, _, _ in words)
    word_start_char = []; c = 0
    for r, _, _ in words: word_start_char.append(c); c += len(r)
    start_to_word = {s: i for i, s in enumerate(word_start_char)}

    # Cut points at word-start anchors, every <= MAX_PIECE_FRAMES frames.
    anc = anchors(dec, dec_frames, ref)
    # Word-start anchors: (frame, word index)
    starts = []
    for f, r in anc:
        for d in range(ANCHOR_K):
            if (r + d) in start_to_word:
                wi = start_to_word[r + d]
                if not starts or (f > starts[-1][0] and wi > starts[-1][1]): starts.append((f, wi))
                break
    # Greedy cuts: from the last cut, take the furthest anchor within MAX_PIECE_FRAMES
    # (but at least 0.3 of it away) so pieces stay long yet never need a blind split.
    cuts = [(0, 0)]
    i = 0
    while i < len(starts):
        last_f, last_w = cuts[-1]
        best = None
        j = i
        while j < len(starts) and starts[j][0] - last_f <= MAX_PIECE_FRAMES:
            if starts[j][0] - last_f >= MAX_PIECE_FRAMES * 0.3 and starts[j][1] > last_w: best = j
            j += 1
        if best is None:
            # nothing usable in range: fall forward to the next anchor beyond the range (fallback split happens below)
            if j < len(starts) and starts[j][1] > last_w: cuts.append(starts[j]); i = j + 1
            else: break
        else:
            cuts.append(starts[best]); i = best + 1
    if T - cuts[-1][0] < MAX_PIECE_FRAMES * 0.2 and len(cuts) > 1:
        cuts.pop()  # merge a tiny tail into the previous piece
    cuts.append((T, len(words)))
    pieces = [(cuts[i][0], cuts[i + 1][0], cuts[i][1], cuts[i + 1][1]) for i in range(len(cuts) - 1)]
    # Fallback split for anchor-less long stretches (proportional by word count)
    fixed = []
    for f0, f1, w0, w1 in pieces:
        n = max(1, math.ceil((f1 - f0) / MAX_PIECE_FRAMES))
        for j in range(n):
            a = f0 + (f1 - f0) * j // n; b = f0 + (f1 - f0) * (j + 1) // n
            wa = w0 + (w1 - w0) * j // n; wb = w0 + (w1 - w0) * (j + 1) // n
            if wb > wa and b > a: fixed.append((a, b, wa, wb, n > 1))
    pieces = fixed

    _, tokenizer, aligner = model()
    spans = [None] * len(words)
    low_conf = 0
    for f0, f1, w0, w1, fallback in pieces:
        toks = tokenizer([r for r, _, _ in words[w0:w1]])
        piece = em[f0:f1]
        if piece.shape[0] < sum(len(t) for t in toks) + 2:
            continue  # not enough frames; leave unaligned
        try:
            word_spans = aligner(piece, toks)
        except Exception as e:  # noqa: BLE001
            print(f"  piece {f0}-{f1} words {w0}-{w1} failed: {e}", file=sys.stderr); continue
        for i, ws in enumerate(word_spans):
            if not ws: continue
            score = sum(s.score * (s.end - s.start) for s in ws) / max(1, sum(s.end - s.start for s in ws))
            if score < 0.3: low_conf += 1
            spans[w0 + i] = (f0 + ws[0].start, f0 + ws[-1].end, round(float(score), 3), fallback)

    # Fill any unaligned word by interpolation between neighbours
    for i, s in enumerate(spans):
        if s is None:
            prev_end = next((spans[j][1] for j in range(i - 1, -1, -1) if spans[j]), 0)
            next_start = next((spans[j][0] for j in range(i + 1, len(spans)) if spans[j]), T)
            spans[i] = (prev_end, max(prev_end + 1, next_start), 0.0, True)

    # Group into verses
    verses = {}
    order = []
    for (r, key, pos), (a, b, sc, fb) in zip(words, spans):
        if key not in verses: verses[key] = {"verseKey": key, "fromMs": None, "toMs": None, "segments": [], "scores": []}; order.append(key)
        v = verses[key]
        fa, fb_ms = max(0, int(a * FRAME_MS) - LEAD_MS), max(0, int(b * FRAME_MS) - LEAD_MS)
        v["fromMs"] = fa if v["fromMs"] is None else v["fromMs"]
        v["toMs"] = fb_ms
        v["segments"].append([pos, fa, fb_ms]); v["scores"].append(sc)
    out_verses = []
    for key in order:
        v = verses[key]
        if key == "istiadha": continue
        out_verses.append({"verseKey": key, "fromMs": v["fromMs"], "toMs": v["toMs"], "segments": v["segments"], "confidence": round(sum(v["scores"]) / len(v["scores"]), 3)})
    # Extend each verse to the start of the next so inter-verse pauses belong to the verse just recited
    for i in range(len(out_verses) - 1):
        out_verses[i]["toMs"] = max(out_verses[i]["toMs"], out_verses[i + 1]["fromMs"])
    duration_ms = int(len(wave) / SR * 1000)
    if out_verses: out_verses[-1]["toMs"] = max(out_verses[-1]["toMs"], duration_ms)
    result = {
        "reciter": reciter, "chapter": surah, "durationMs": duration_ms,
        "method": {"model": "torchaudio MMS_FA (wav2vec2 CTC, uroman)", "version": 1, "istiadha": has_ist, "basmala": has_basmala, "pieces": len(pieces), "fallbackPieces": sum(1 for p in pieces if p[4]), "lowConfidenceWords": low_conf, "words": len(words)},
        "timestamps": out_verses,
    }
    result["method"]["seconds"] = round(time.time() - t0, 1)
    return result

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--reciter", required=True); ap.add_argument("--surah", type=int, required=True)
    ap.add_argument("--audio", required=True); ap.add_argument("--out", required=True)
    a = ap.parse_args()
    res = align_surah(a.reciter, a.surah, a.audio)
    pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    json.dump(res, open(a.out, "w"), ensure_ascii=False, separators=(",", ":"))
    m = res["method"]
    print(f"{a.reciter} surah {a.surah}: {len(res['timestamps'])} verses, {m['words']} words, pieces {m['pieces']} (fallback {m['fallbackPieces']}), low-conf words {m['lowConfidenceWords']}, {m['seconds']} s")
