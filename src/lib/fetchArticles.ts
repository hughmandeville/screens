import Parser from "rss-parser";
import { SOURCES, type Source } from "./feeds";

export type Article = {
  sourceSlug: string;
  sourceName: string;
  accent: string;
  logo?: string;
  title: string;
  link: string;
  date: string;
  image: string | null;
};

type MediaNode = { $?: { url?: string; medium?: string; type?: string } };
type ItemExtra = {
  "media:content"?: MediaNode[];
  "media:thumbnail"?: MediaNode | MediaNode[];
  contentEncoded?: string;
};
type FeedExtra = { itunes?: { image?: string } };

const PER_SOURCE = 4;
const REVALIDATE_SECONDS = 900;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const parser: Parser<FeedExtra, ItemExtra> = new Parser({
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: true }],
      ["media:thumbnail", "media:thumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

function attr(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match?.[1];
}

// Pick the URL with the largest `w` descriptor from a srcset (ordering across
// feeds isn't guaranteed), so we use the highest-resolution variant available.
function largestFromSrcset(srcset: string | undefined): string | null {
  if (!srcset) return null;
  let best: { url: string; width: number } | null = null;
  for (const candidate of srcset.split(",")) {
    const [url, descriptor] = candidate.trim().split(/\s+/);
    if (!url) continue;
    const width = descriptor?.endsWith("w") ? parseInt(descriptor, 10) : 0;
    if (!best || width > best.width) best = { url, width };
  }
  return best?.url ?? null;
}

// Publisher feeds often embed the lead image in the HTML body. Prefer lazy-load
// attributes (the real URL) over `src` (frequently a 1x1 placeholder).
function firstImageFromHtml(html: string): string | null {
  const imgTag = html.match(/<img\b[^>]*>/i)?.[0];
  if (!imgTag) return null;

  const lazy = attr(imgTag, "data-lazy-src") ?? attr(imgTag, "data-src");
  if (lazy) return lazy;

  const fromSet = largestFromSrcset(
    attr(imgTag, "data-lazy-srcset") ?? attr(imgTag, "srcset"),
  );
  if (fromSet) return fromSet;

  const src = attr(imgTag, "src");
  if (src && !src.startsWith("data:")) return src;

  return null;
}

type RssItem = Parser.Item & ItemExtra;

function pickImage(item: RssItem, channelImage: string | null): string | null {
  for (const node of item["media:content"] ?? []) {
    const url = node.$?.url;
    const isImage =
      node.$?.medium === "image" ||
      (node.$?.type ?? "").startsWith("image") ||
      /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url ?? "");
    if (url && isImage) return url;
  }

  const thumb = item["media:thumbnail"];
  const thumbUrl = Array.isArray(thumb) ? thumb[0]?.$?.url : thumb?.$?.url;
  if (thumbUrl) return thumbUrl;

  if (item.enclosure?.url && (item.enclosure.type ?? "").startsWith("image")) {
    return item.enclosure.url;
  }

  const html = item.contentEncoded ?? item.content ?? item.summary ?? "";
  return firstImageFromHtml(html) ?? channelImage;
}

type OEmbed = { thumbnail_url?: string };

// Some publishers expose a better per-article image via their oEmbed service
// than in the feed body (NYT podcast items carry only show art; RS images are
// lazy-loaded). The endpoint is called as `<endpoint>?url=<articleUrl>`.
async function fetchOEmbedImage(
  endpoint: string,
  articleUrl: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${endpoint}?url=${encodeURIComponent(articleUrl)}`, {
      headers: { "user-agent": USER_AGENT, accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as OEmbed;
    return data.thumbnail_url ?? null;
  } catch {
    return null;
  }
}

// Normalized entry from either an RSS feed or a Google News sitemap.
type FeedEntry = {
  title: string;
  link: string;
  date: string;
  image: string | null;
  text: string;
};

function parseDateMs(value: string): number {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

async function parseRssEntries(xml: string): Promise<FeedEntry[]> {
  const feed = await parser.parseString(xml);
  const channelImage = feed.image?.url ?? feed.itunes?.image ?? null;
  return (feed.items ?? [])
    .filter((item) => item.title && item.link)
    .map((item) => ({
      title: item.title as string,
      link: item.link as string,
      date: item.isoDate ?? item.pubDate ?? "",
      image: pickImage(item, channelImage),
      text: `${item.contentEncoded ?? ""} ${item.content ?? ""} ${item.contentSnippet ?? ""}`,
    }));
}

function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&#0*38;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/(&#0*39;|&apos;)/g, "'")
    .trim();
}

function sitemapTag(block: string, name: string): string | null {
  const match = block.match(
    new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"),
  );
  return match ? decodeEntities(match[1]) : null;
}

// Google News sitemap: <urlset> of <url> entries with news:title / loc / date.
function parseSitemapEntries(xml: string): FeedEntry[] {
  const entries: FeedEntry[] = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/gi) ?? []) {
    const link = sitemapTag(block, "loc");
    const title = sitemapTag(block, "news:title");
    if (!link || !title) continue;
    entries.push({
      title,
      link,
      date:
        sitemapTag(block, "news:publication_date") ??
        sitemapTag(block, "lastmod") ??
        "",
      image: sitemapTag(block, "image:loc"),
      text: "",
    });
  }
  return entries;
}

async function fetchSource(source: Source): Promise<Article[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const entries =
      source.type === "sitemap"
        ? parseSitemapEntries(xml)
        : await parseRssEntries(xml);

    const selected = entries
      .filter((entry) => {
        if (source.linkIncludes && !entry.link.includes(source.linkIncludes)) {
          return false;
        }
        if (
          source.excludeIfTextIncludes &&
          entry.text
            .toLowerCase()
            .includes(source.excludeIfTextIncludes.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => parseDateMs(b.date) - parseDateMs(a.date))
      .slice(0, PER_SOURCE);

    return Promise.all(
      selected.map(async (entry) => {
        let image = entry.image;
        if (source.oembedEndpoint) {
          image =
            (await fetchOEmbedImage(source.oembedEndpoint, entry.link)) ?? image;
        }
        if (source.stripImageQuery && image) {
          image = image.split("?")[0];
        }
        return {
          sourceSlug: source.slug,
          sourceName: source.name,
          accent: source.accent,
          logo: source.logo,
          title: entry.title,
          link: entry.link,
          date: entry.date,
          image,
        };
      }),
    );
  } catch {
    return [];
  }
}

// Fetch every feed, then interleave by source (1st-of-each, 2nd-of-each, ...)
// so the on-screen rotation alternates publications instead of clustering.
export async function getArticles(): Promise<Article[]> {
  const settled = await Promise.allSettled(SOURCES.map(fetchSource));
  const perSource = settled.map((r) => (r.status === "fulfilled" ? r.value : []));

  const interleaved: Article[] = [];
  for (let rank = 0; rank < PER_SOURCE; rank++) {
    for (const list of perSource) {
      if (list[rank]) interleaved.push(list[rank]);
    }
  }
  return interleaved;
}
