# Word-level forced alignment for archive reciters

Produces `apps/web/data/timings/<reciter>/<surah>.json` (verse and word timestamps) for reciters whose
recordings have no official timings (Ahmed al-Ajmi, Maher al-Muaiqly, Raad al-Kurdi).

- `fetch_text.py` downloads the per-surah word tables (Uthmani + Imlaei simple) from the v4 API.
- `align.py` aligns one full-surah mp3: ffmpeg decode -> torchaudio MMS_FA CTC emissions in 30 s windows ->
  anchor the greedy transcript to the romanised (uroman) text with unique 10-grams -> exact Viterbi forced
  alignment per piece (<= 150 s) -> word spans `[position, fromMs, toMs]`, verse spans, per-verse confidence.
  Isti'adha and Basmala are detected by comparing the consonant skeleton of each phrase with the start
  of the greedy transcript (Ajmi's recordings start straight on the first ayah); the Basmala gets its own
  range. Files up to about ten minutes are aligned whole; longer ones are cut at anchors.
- `run_all.py` runs every surah for every archive reciter, shortest first, resumable.

Versions 2 to 5 were benchmarked and rejected (vowelled romanisation and score-based prefix
detection both reduced accuracy); version 6 is current.

Benchmark against the official Quran Foundation timings for Mishari al-Afasy (same recordings):
Al-Fatiha: word-start error mean 98 ms, max 205 ms. Ya-Sin (20 min, 12 pieces): verse-start median 30 ms,
p95 110 ms; word-start median 45 ms, p95 705 ms. A 100 ms lead corrects the CTC onset lag.

## Batch result (2026-11-13, version 6)

All 342 files (114 surahs x 3 reciters) are in `apps/web/data/timings` (6.6 MB).

| Reciter | Audio | Words | Low-confidence words | Fallback pieces |
|---|---|---|---|---|
| Ahmed al-Ajmi (`x-ajmi`) | 26.3 h | 77,858 | 3.2% | 14 |
| Maher al-Muaiqly (`x-muaiqly`) | 32.5 h | 77,703 | 1.6% | 26 |
| Raad al-Kurdi (`x-kurdi`) | 33.2 h | 77,713 | 4.2% | 13 |
| Total | 92.1 h | 233,274 | 3.0% | 53 of 1,823 pieces in 25 files |

A low-confidence word still gets a position (the Viterbi path is complete); it means the acoustic
score for that word was weak, usually reverb, a long pause inside the word or a reciter's repetition.
A fallback piece is a stretch between two anchors where exact alignment failed and words were spread
by their letter count. Files to re-run first if a better model becomes available: al-Kurdi 14
(5 fallback pieces, 25% low confidence), 56, 6 (verses 106-124), and al-Ajmi 30. CPU time for the
whole batch was 14.6 h at 6.3x real time on 4 cores.

Setup: `python -m venv venv && pip install --index-url https://download.pytorch.org/whl/cpu torch torchaudio && pip install uroman numpy`,
plus ffmpeg. CPU speed is about 7x real time, so one reciter (about 20 h of audio) takes about 3 h.
