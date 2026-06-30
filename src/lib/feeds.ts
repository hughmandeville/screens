export type Source = {
  slug: string;
  name: string;
  url: string;
  accent: string;
  // Feed format: "rss" (default) or a Google News "sitemap" (urlset XML).
  type?: "rss" | "sitemap";
  // Path to a logo image (under /public); falls back to a text wordmark if unset.
  logo?: string;
  // Keep only items whose link contains this substring (e.g. category filter).
  linkIncludes?: string;
  // Resolve each item's image via this oEmbed endpoint (called as `?url=<link>`)
  // instead of the feed body. Used when feed images are poor or lazy-loaded.
  oembedEndpoint?: string;
  // Drop the query string from the image URL (e.g. strip WordPress `?w=300`
  // resize params to get the full-resolution image).
  stripImageQuery?: boolean;
  // Skip items whose description/body contains this text (case-insensitive),
  // e.g. affiliate disclaimers on commerce articles.
  excludeIfTextIncludes?: string;
};

export const SOURCES: Source[] = [
  {
    slug: "billboard",
    name: "Billboard",
    url: "https://billboard.com/feed",
    accent: "#000000",
    logo: "/img/logo-billboard.png",
    oembedEndpoint: "https://www.billboard.com/wp-json/oembed/1.0/embed",
    stripImageQuery: true,
    excludeIfTextIncludes: "may receive a commission",
  },
  {
    slug: "rolling-stone",
    name: "Rolling Stone",
    url: "https://www.rollingstone.com/news-sitemap.xml",
    accent: "#e10a0a",
    logo: "/img/logo-rolling-stone.png",
    type: "sitemap",
    oembedEndpoint: "https://www.rollingstone.com/wp-json/oembed/1.0/embed",
    stripImageQuery: true,
  },
  {
    slug: "variety",
    name: "Variety",
    url: "https://variety.com/feed/",
    accent: "#0faf9a",
    logo: "/img/logo-variety.png",
    linkIncludes: "/music/",
  },
  {
    slug: "nyt-popcast",
    name: "NYT Popcast",
    url: "https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/column/popcast-pop-music-podcast/rss.xml",
    accent: "#326891",
    logo: "/img/logo-nyt-popcast.png",
    oembedEndpoint: "https://www.nytimes.com/svc/oembed/json/",
  },
  {
    slug: "hypebot",
    name: "Hypebot",
    url: "https://www.hypebot.com/latest/rss/",
    accent: "#ff5a00",
    logo: "/img/logo-hypebot.png",
  },
  {
    slug: "music-business-worldwide",
    name: "Music Business Worldwide",
    url: "https://www.musicbusinessworldwide.com/feed/",
    accent: "#e2231a",
    logo: "/img/logo-mbw.png",
    oembedEndpoint: "https://www.musicbusinessworldwide.com/wp-json/oembed/1.0/embed",
  },
  {
    slug: "digital-music-news",
    name: "Digital Music News",
    url: "https://www.digitalmusicnews.com/feed/",
    accent: "#1a73e8",
    logo: "/img/logo-dmn.png",
  },
];
