"use client";
import { useEffect, useState } from "react";
import { ArtistShowcase } from "./artists/ArtistShowcase";
import { NewsCycler } from "./news/NewsCycler";

const SECTION_MS = 60000; // 1 minute per section

// Alternates the full-screen view between the artist showcase and the news
// cycler every minute, looping forever.
export function Rotator() {
  const [view, setView] = useState<"artists" | "news">("artists");

  useEffect(() => {
    const timer = setTimeout(() => {
      setView((v) => (v === "artists" ? "news" : "artists"));
    }, SECTION_MS);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setView("artists");
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setView("news");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return view === "artists" ? <ArtistShowcase /> : <NewsCycler />;
}
