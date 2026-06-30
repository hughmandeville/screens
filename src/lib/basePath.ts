// Matches `basePath` in next.config.ts. Next applies basePath to `next/link`
// and framework assets automatically, but NOT to raw paths in `fetch`, plain
// `<img src>`, or `next/image` `src` — those must be prefixed by hand.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Prefix a root-relative public path (e.g. "/data/news.json", "/img/logo.png")
// with the configured base path. Absolute URLs and relative paths pass through
// unchanged.
export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE_PATH}${path}`;
}
