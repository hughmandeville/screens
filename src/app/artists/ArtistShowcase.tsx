"use client";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { withBasePath } from "@/lib/basePath";
import { formatDate } from "@/lib/formatDate";
import styles from "./artists.module.css";

const HOME_MS = 5000;
const ARTIST_MS = 5000;

type NewsItem = { date: string; title: string; image: string };
type TourDate = { date: string; location: string; venue: string };
type Artist = {
  name: string;
  image: string;
  label: string;
  country: string;
  bio?: string;
  news?: NewsItem[];
  tourDates?: TourDate[];
};

function shuffledIndices(n: number): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

// Balance the background mosaic for a landscape screen, then cycle the list so
// every cell is filled regardless of how many artists exist.
function buildMosaic(artists: Artist[]): {
  cols: number;
  rows: number;
  tiles: Artist[];
} {
  if (artists.length === 0) return { cols: 0, rows: 0, tiles: [] };
  const cols = Math.round(Math.sqrt(artists.length * (16 / 9)));
  const rows = Math.ceil(artists.length / cols);
  const tiles = Array.from(
    { length: cols * rows },
    (_, i) => artists[i % artists.length],
  );
  return { cols, rows, tiles };
}

export function ArtistShowcase() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [phase, setPhase] = useState<"home" | "artist">("home");
  const [index, setIndex] = useState(0);

  // A shuffled traversal order; reshuffled each full pass so the rotation is
  // random but still covers every artist.
  const orderRef = useRef<number[]>([]);
  const posRef = useRef(-1);

  useEffect(() => {
    let active = true;
    fetch(withBasePath("/data/artists.json"))
      .then((res) => res.json())
      .then((data: Artist[]) => {
        if (active) setArtists(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    orderRef.current = shuffledIndices(artists.length);
    posRef.current = -1;
  }, [artists.length]);

  // Advance when a card opens, not when it closes, so the closing animation
  // keeps showing the current artist.
  const step = useCallback((direction: 1 | -1) => {
    if (orderRef.current.length === 0) return;
    let pos = posRef.current + direction;
    if (pos >= orderRef.current.length) {
      orderRef.current = shuffledIndices(orderRef.current.length);
      pos = 0;
    } else if (pos < 0) {
      pos = orderRef.current.length - 1;
    }
    posRef.current = pos;
    setIndex(orderRef.current[pos]);
  }, []);

  useEffect(() => {
    if (artists.length === 0) return;
    const duration = phase === "home" ? HOME_MS : ARTIST_MS;
    const timer = setTimeout(() => {
      if (phase === "home") {
        step(1);
        setPhase("artist");
      } else {
        setPhase("home");
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [artists.length, phase, index, step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
        setPhase("artist");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
        setPhase("artist");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const { cols, rows, tiles } = useMemo(() => buildMosaic(artists), [artists]);

  if (artists.length === 0) {
    return <main className={styles.main} aria-busy="true" />;
  }

  const artist = artists[index];
  const news = (artist.news ?? []).slice(0, 3);
  const tour = (artist.tourDates ?? []).slice(0, 3);
  const isArtist = phase === "artist";

  return (
    <main className={styles.main}>
      <div
        className={styles.mosaic}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
        aria-hidden="true"
      >
        {tiles.map((tile, i) => (
          <img
            key={`${tile.name}-${i}`}
            className={`${styles.tile} ${isArtist && i === index ? styles.tileSelected : ""}`}
            src={withBasePath(tile.image)}
            alt=""
            loading="lazy"
          />
        ))}
      </div>
      <div className={styles.backdrop} aria-hidden="true" />

      <section
        className={`${styles.stage} ${isArtist ? styles.stageVisible : styles.stageHidden}`}
        aria-hidden={!isArtist}
      >
        <div className={styles.imagePane}>
          <img
            className={styles.activeImage}
            src={withBasePath(artist.image)}
            alt={artist.name}
          />
        </div>

        <div className={styles.details}>
          <h1 className={styles.name}>{artist.name}</h1>
          <p className={styles.meta}>
            {artist.label} &middot; {artist.country}
          </p>

          {artist.bio && <p className={styles.bio}>{artist.bio}</p>}

          {news.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>News</h2>
              <ul className={styles.list}>
                {news.map((item) => (
                  <li key={item.title} className={styles.newsItem}>
                    {item.image && (
                      <img
                        className={styles.newsThumb}
                        src={withBasePath(item.image)}
                        alt=""
                        loading="lazy"
                      />
                    )}
                    <div className={styles.newsBody}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemDate}>
                        {formatDate(item.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tour.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Tour Dates</h2>
              <ul className={styles.list}>
                {tour.map((show) => (
                  <li key={`${show.date}-${show.venue}`} className={styles.tourItem}>
                    <span className={styles.itemDate}>{formatDate(show.date)}</span>
                    <span className={styles.itemTitle}>{show.venue}</span>
                    <span className={styles.tourLocation}>{show.location}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <Image
        className={`${styles.logo} ${isArtist ? styles.logoArtist : styles.logoHome}`}
        src={withBasePath("/img/logo-virgin.svg")}
        alt="Virgin Music"
        width={296}
        height={196}
        priority
        unoptimized
      />
    </main>
  );
}
