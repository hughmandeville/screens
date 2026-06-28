"use client";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import { useEffect, useState } from "react";
import artistsData from "../../public/artists.json";
import styles from "./page.module.css";

const HOME_MS = 5000;
const ARTIST_MS = 5000;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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

const artists = artistsData as unknown as Artist[];

// Balance the background mosaic for a landscape screen, then cycle the list so
// every cell is filled regardless of how many artists exist.
const cols = Math.round(Math.sqrt(artists.length * (16 / 9)));
const rows = Math.ceil(artists.length / cols);
const tiles = Array.from(
  { length: cols * rows },
  (_, i) => artists[i % artists.length],
);

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return `${MONTHS[month - 1]} ${day}, ${year}`;
}

export default function Home() {
  const [phase, setPhase] = useState<"home" | "artist">("home");
  // Advance when a card opens, not when it closes, so the closing animation
  // keeps showing the current artist. Start one before 0 so the first card
  // opened is index 0.
  const [index, setIndex] = useState(artists.length - 1);

  useEffect(() => {
    const duration = phase === "home" ? HOME_MS : ARTIST_MS;
    const timer = setTimeout(() => {
      if (phase === "home") {
        setIndex((i) => (i + 1) % artists.length);
        setPhase("artist");
      } else {
        setPhase("home");
      }
    }, duration);
    return () => clearTimeout(timer);
  }, [phase, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % artists.length);
        setPhase("artist");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + artists.length) % artists.length);
        setPhase("artist");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
            src={tile.image}
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
          <img className={styles.activeImage} src={artist.image} alt={artist.name} />
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
                        src={item.image}
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
        src="/virgin.svg"
        alt="Virgin Music"
        width={296}
        height={196}
        priority
        unoptimized
      />
    </main>
  );
}
