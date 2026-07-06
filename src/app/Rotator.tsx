"use client";
import { useEffect, useState } from "react";
import { ArtistShowcase } from "./artists/ArtistShowcase";
import { NewsCycler } from "./news/NewsCycler";
import { StatsShowcase } from "./stats/StatsShowcase";
import { SocialShowcase } from "./social/SocialShowcase";

const SECTION_MS = 60000; // 1 minute per section

const VIEWS = ["artists", "news", "stats", "social"] as const;
type View = (typeof VIEWS)[number];

// Cycles the full-screen view through the artist showcase, news cycler, stats
// leaderboard, and social feed, one minute each, looping forever.
export function Rotator() {
  const [view, setView] = useState<View>("artists");

  useEffect(() => {
    const timer = setTimeout(() => {
      setView((v) => VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length]);
    }, SECTION_MS);
    return () => clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setView((v) => VIEWS[(VIEWS.indexOf(v) + 1) % VIEWS.length]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setView((v) => VIEWS[(VIEWS.indexOf(v) - 1 + VIEWS.length) % VIEWS.length]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (view === "news") return <NewsCycler />;
  if (view === "stats") return <StatsShowcase />;
  if (view === "social") return <SocialShowcase />;
  return <ArtistShowcase />;
}
