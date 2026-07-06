"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { withBasePath } from "@/lib/basePath";
import styles from "./stats.module.css";

const BLOCK_MS = 10000;
const MAX_ITEMS = 3;

type StatItem = {
  type: string;
  name: string;
  artist: string;
  value: number;
  position: number;
  imageUrl: string;
  change?: number;
};

type StatBlock = {
  id: string;
  logo: string;
  title: string;
  metric: string;
  fontColor?: string;
  items: StatItem[];
};

// stats.json may store a logo as a full "/img/…" path, a remote URL, or a bare
// filename; resolve all three to a loadable src.
function logoSrc(logo: string): string {
  if (logo.startsWith("http")) return logo;
  if (logo.startsWith("/")) return withBasePath(logo);
  return withBasePath(`/img/${logo}`);
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Chart-movement indicator under the rank: green triangle up, red triangle
// down, subtle dash for no change.
function changeIndicator(
  change: number | undefined,
): { icon: string; color: string } | null {
  if (change === undefined) return null;
  if (change > 0) return { icon: "arrow_drop_up", color: "#22c55e" };
  if (change < 0) return { icon: "arrow_drop_down", color: "#ef4444" };
  return { icon: "remove", color: "rgba(255, 255, 255, 0.4)" };
}

export function StatsShowcase() {
  const [blocks, setBlocks] = useState<StatBlock[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(withBasePath("/data/stats.json"))
      .then((res) => res.json())
      .then((data: { stats: StatBlock[] }) => {
        if (active) setBlocks(data.stats ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (blocks.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % blocks.length);
    }, BLOCK_MS);
    return () => clearInterval(timer);
  }, [blocks.length]);

  useEffect(() => {
    if (blocks.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % blocks.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + blocks.length) % blocks.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [blocks.length]);

  if (!loaded) {
    return <main className={styles.main} aria-busy="true" />;
  }

  if (blocks.length === 0) {
    return <main className={styles.empty}>No stats available right now.</main>;
  }

  const block = blocks[index];
  const items = [...(block.items ?? [])]
    .sort((a, b) => a.position - b.position)
    .slice(0, MAX_ITEMS);
  const metric = capitalize(block.metric);

  return (
    <main
      className={styles.main}
      style={block.fontColor ? { color: block.fontColor } : undefined}
    >
      <img
        className={styles.logo}
        src={logoSrc(block.logo)}
        alt={block.title}
      />

      <h1 className={styles.title}>{block.title}</h1>

      <section key={block.id} className={styles.stage}>
        <ol className={styles.board}>
          {items.map((item) => (
            <li key={item.position} className={styles.row}>
              <div className={styles.rankCell}>
                <span className={styles.rank}>{item.position}</span>
                {(() => {
                  const change = changeIndicator(item.change);
                  if (!change) return null;
                  return (
                    <span
                      className={styles.changeCell}
                      style={{ color: change.color }}
                    >
                      <span className={`material-symbols-outlined ${styles.change}`}>
                        {change.icon}
                      </span>
                      {item.change !== 0 && (
                        <span className={styles.changeAmount}>
                          {Math.abs(item.change ?? 0)}
                        </span>
                      )}
                    </span>
                  );
                })()}
              </div>
              <img className={styles.thumb} src={item.imageUrl} alt="" />
              <div className={styles.info}>
                <span className={styles.name}>{item.name}</span>
                <span className={styles.artist}>{item.artist}</span>
              </div>
              {Number.isFinite(item.value) && item.value !== 0 && (
                <div className={styles.value}>
                  <span className={styles.number}>
                    {item.value.toLocaleString("en-US")}
                  </span>
                  <span className={styles.metric}>{metric}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
