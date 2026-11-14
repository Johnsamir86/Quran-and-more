import { Directory, File, Paths } from "expo-file-system";
import { useCallback, useEffect, useState } from "react";

/**
 * Offline Audio: whole-surah files per reciter saved under <documents>/audio/<reciterId>/<surah>.mp3.
 * Gated by the Offline Audio entitlement in the UI; the player prefers the local file when it exists.
 */
const dir = (reciterId: string) => new Directory(Paths.document, "audio", reciterId);
const file = (reciterId: string, surah: number) => new File(dir(reciterId), `${String(surah).padStart(3, "0")}.mp3`);

export const localAudioUri = (reciterId: string, surah: number): string | null => {
  try { const f = file(reciterId, surah); return f.exists ? f.uri : null; } catch { return null; }
};

export const downloadSurah = async (reciterId: string, surah: number, url: string, onProgress?: (ratio: number) => void): Promise<string> => {
  const d = dir(reciterId);
  if (!d.exists) d.create({ intermediates: true });
  const target = file(reciterId, surah);
  if (target.exists) return target.uri;
  onProgress?.(0);
  const out = await File.downloadFileAsync(url, target);
  onProgress?.(1);
  return out.uri;
};

export const removeSurah = (reciterId: string, surah: number) => { try { const f = file(reciterId, surah); if (f.exists) f.delete(); } catch { /* ignore */ } };

export const listDownloads = (): { reciterId: string; surah: number; bytes: number }[] => {
  try {
    const root = new Directory(Paths.document, "audio");
    if (!root.exists) return [];
    const out: { reciterId: string; surah: number; bytes: number }[] = [];
    for (const r of root.list()) {
      if (!(r instanceof Directory)) continue;
      for (const f of r.list()) if (f instanceof File && f.name.endsWith(".mp3")) out.push({ reciterId: r.name, surah: Number(f.name.slice(0, 3)), bytes: f.size ?? 0 });
    }
    return out.sort((a, b) => a.reciterId.localeCompare(b.reciterId) || a.surah - b.surah);
  } catch { return []; }
};

export const useOfflineSurah = (reciterId: string | null, surah: number | null) => {
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(() => { setUri(reciterId && surah ? localAudioUri(reciterId, surah) : null); }, [reciterId, surah]);
  useEffect(() => { refresh(); }, [refresh]);
  const download = useCallback(async (url: string) => { if (!reciterId || !surah) return; setBusy(true); try { setUri(await downloadSurah(reciterId, surah, url)); } finally { setBusy(false); } }, [reciterId, surah]);
  const remove = useCallback(() => { if (reciterId && surah) { removeSurah(reciterId, surah); setUri(null); } }, [reciterId, surah]);
  return { uri, busy, download, remove, refresh };
};
