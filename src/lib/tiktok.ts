import "server-only";

const VIDEO_ID_RE = /\/(?:video|photo)\/(\d{10,25})/;

export function extractTikTokVideoId(url: string): string | null {
  return url.match(VIDEO_ID_RE)?.[1] ?? null;
}

function isTikTokHost(url: URL) {
  return url.hostname === "tiktok.com" || url.hostname.endsWith(".tiktok.com");
}

/** Link pendek (vt.tiktok.com / tiktok.com/t/...) perlu di-resolve untuk dapat video ID. */
async function resolveShortLink(url: string): Promise<string> {
  if (VIDEO_ID_RE.test(url)) return url;
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(8000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}

export type TikTokInfo = {
  url: string;
  videoId: string | null;
  title: string | null;
  thumbnailUrl: string | null;
};

export async function fetchTikTokInfo(rawUrl: string): Promise<TikTokInfo> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Link TikTok tak sah");
  }
  if (!isTikTokHost(parsed)) throw new Error("Ini bukan link TikTok");

  const url = await resolveShortLink(parsed.toString());
  const videoId = extractTikTokVideoId(url);

  let title: string | null = null;
  let thumbnailUrl: string | null = null;
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as { title?: string; thumbnail_url?: string };
      title = data.title?.trim() || null;
      thumbnailUrl = data.thumbnail_url || null;
    }
  } catch {
    // oEmbed gagal bukan masalah besar; wife boleh isi manual.
  }

  // Buang query string tracking (?_r=1&_t=...) supaya link bersih.
  const clean = new URL(url);
  clean.search = "";
  return { url: clean.toString(), videoId, title, thumbnailUrl };
}
