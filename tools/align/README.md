# Word-level forced alignment for archive reciters

Produces `apps/web/data/timings/<reciter>/<surah>.json` (verse and word timestamps) for reciters whose
recordings have no official timings (Ahmed al-Ajmi, Maher al-Muaiqly, Raad al-Kurdi).

- `fetch_text.py` downloads the per-surah word tables (Uthmani + Imlaei simple) from the v4 API.
- `align.py` aligns one full-surah mp3: ffmpeg decode -> torchaudio MMS_FA CTC emissions in 30 s windows ->
  anchor the greedy transcript to the romanised (uroman) text with unique 10-grams -> exact Viterbi forced
  alignment per piece (<= 150 s) -> word spans `[position, fromMs, toMs]`, verse spans, per-verse confidence.
  Isti'adha is detected and skipped; the Basmala gets its own range.
- `run_all.py` runs every surah for every archive reciter, shortest first, resumable.

Benchmark against the official Quran Foundation timings for Mishari al-Afasy (same recordings):
Al-Fatiha: word-start error mean 98 ms, max 205 ms. Ya-Sin (20 min, 12 pieces): verse-start median 30 ms,
p95 110 ms; word-start median 45 ms, p95 705 ms. A 100 ms lead corrects the CTC onset lag.

Setup: `python -m venv venv && pip install --index-url https://download.pytorch.org/whl/cpu torch torchaudio && pip install uroman numpy`,
plus ffmpeg. CPU speed is about 7x real time, so one reciter (about 20 h of audio) takes about 3 h.
