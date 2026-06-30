"use client";
import { useEffect, useState } from "react";
import type { Article } from "@/lib/fetchArticles";
import { withBasePath } from "@/lib/basePath";
import { ArticleSlide } from "./ArticleSlide";
import styles from "./news.module.css";

const SLIDE_MS = 5000;

export function NewsCycler() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [index, setIndex] = useState(0);
  const [trackedIndex, setTrackedIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  // Capture the outgoing slide for the crossfade without reading a ref in render.
  if (index !== trackedIndex) {
    setPrevIndex(trackedIndex);
    setTrackedIndex(index);
  }

  useEffect(() => {
    let active = true;
    fetch(withBasePath("/data/news.json"))
      .then((res) => res.json())
      .then((data: Article[]) => {
        if (active) setArticles(data);
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
    if (articles.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % articles.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [articles.length, index]);

  useEffect(() => {
    if (articles.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setIndex((i) => (i + 1) % articles.length);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setIndex((i) => (i - 1 + articles.length) % articles.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [articles.length]);

  if (!loaded) {
    return <main className={styles.empty} aria-busy="true" />;
  }

  if (articles.length === 0) {
    return <main className={styles.empty}>No news available right now.</main>;
  }

  return (
    <main className={styles.main}>
      {prevIndex !== null && prevIndex !== index && (
        <div
          key={`prev-${prevIndex}`}
          className={styles.layerOut}
          onAnimationEnd={() => setPrevIndex(null)}
        >
          <ArticleSlide article={articles[prevIndex]} />
        </div>
      )}
      <div key={`cur-${index}`} className={styles.layerIn}>
        <ArticleSlide article={articles[index]} />
      </div>
    </main>
  );
}
