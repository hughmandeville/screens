
## Data

The pages are fully static and load their content client-side from four  JSON files under [`public/data/`](public/data/):


| File | Description |
| ---- | ----------- |
| artists.json | Artist roster shown on `/artists` and the home rotator. |
| news.json | Aggregated music news feed shown on `/news`. |
| social.json | Social media posts shown on `/social`. |
| stats.json | Stats shown on `/stats`. |

### news.json
`news.json` is generated from the RSS sources in [`src/lib/feeds.ts`](src/lib/feeds.ts) (Billboard, Rolling Stone, Variety, NYT
Popcast, Hypebot, Music Business Worldwide, Digital Music News), limited to the most recent few per source and interleaved so publications alternate. Refresh
it with:

```bash
make get-news
```

Each entry in `news.json`:

| Field        | Type             | Description                                      |
| ------------ | ---------------- | ------------------------------------------------ |
| `sourceSlug` | `string`         | Source identifier (e.g. `billboard`).            |
| `sourceName` | `string`         | Human-readable source name.                      |
| `accent`     | `string`         | Source brand color (hex).                        |
| `logo`       | `string`         | Path to the source logo under `/public`.         |
| `title`      | `string`         | Article headline.                                |
| `link`       | `string`         | URL to the original article.                     |
| `date`       | `string`         | Publication date (ISO 8601).                     |
| `image`      | `string \| null` | Lead image URL, or `null` if none was found.     |

## Deployment (GitHub Pages)

The app is exported as a static site (`output: 'export'` in
[`next.config.ts`](next.config.ts)) and hosted on GitHub Pages under the project
sub-path `/screens` (https://hughmandeville.github.io/screens).

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and
publishes on every push to `main` (and via manual dispatch). It refreshes
`news.json`, runs the static build, and uploads the `out/` folder to Pages.

To enable it once: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

**Base path.** Because the site is served from a sub-path, every root-relative
URL must be prefixed. `NEXT_PUBLIC_BASE_PATH` (set to `/screens` in the
workflow) feeds both `basePath` in the Next config and the `withBasePath`
helper in [`src/lib/basePath.ts`](src/lib/basePath.ts), which prefixes `fetch`,
`<img src>`, and `next/image` paths. Leave it unset for local dev so the app
serves from the root.

Build the static site locally:

```bash
make build      # writes out/ (served under /screens)
```

To deploy at the domain root instead (a `user.github.io` repo or a custom
domain), drop `NEXT_PUBLIC_BASE_PATH` from the workflow.

