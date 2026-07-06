"use client";
/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useState } from "react";
import { withBasePath } from "@/lib/basePath";
import styles from "./social.module.css";

const IMAGE_MS = 6000;

type SocialPost = {
  id: string;
  logo: string;
  title?: string;
  imageUrls: string[];
  text: string;
  likes: number;
  comments: number;
};

// social.json may store a logo as a full "/img/…" path, a remote URL, or a bare
// filename; resolve all three to a loadable src.
function logoSrc(logo: string): string {
  if (logo.startsWith("http")) return logo;
  if (logo.startsWith("/")) return withBasePath(logo);
  return withBasePath(`/img/${logo}`);
}

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  }
  return n.toLocaleString("en-US");
}

export function SocialShowcase() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [postIndex, setPostIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(withBasePath("/data/social.json"))
      .then((res) => res.json())
      .then((data: { stats: SocialPost[] }) => {
        if (active) setPosts(data.stats ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const post = posts[postIndex];
  const imageCount = post?.imageUrls.length ?? 0;

  useEffect(() => {
    if (posts.length === 0) return;
    if (imageCount <= 1 && posts.length <= 1) return;
    const timer = setInterval(() => {
      setImageIndex((i) => {
        if (i + 1 < imageCount) return i + 1;
        setPostIndex((p) => (p + 1) % posts.length);
        return 0;
      });
    }, IMAGE_MS);
    return () => clearInterval(timer);
  }, [posts.length, imageCount, postIndex, imageIndex]);

  useEffect(() => {
    if (posts.length === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setImageIndex((i) => {
          if (i + 1 < imageCount) return i + 1;
          setPostIndex((p) => (p + 1) % posts.length);
          return 0;
        });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setImageIndex((i) => {
          if (i > 0) return i - 1;
          const prev = (postIndex - 1 + posts.length) % posts.length;
          setPostIndex(prev);
          return Math.max(0, posts[prev].imageUrls.length - 1);
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [posts, postIndex, imageCount]);

  if (!loaded) {
    return <main className={styles.main} aria-busy="true" />;
  }

  if (posts.length === 0 || !post) {
    return <main className={styles.empty}>No posts available right now.</main>;
  }

  const imageUrl = post.imageUrls[imageIndex]?.replace(/&amp;/g, "&") ?? "";
  const captionLines = post.text.split(/<br\s*\/?>/i);

  return (
    <main className={styles.main}>
      <img className={styles.logo} src={logoSrc(post.logo)} alt="" />

      <div key={`${post.id}-${imageIndex}`} className={styles.stage}>
        <img className={styles.photo} src={imageUrl} alt="" />
      </div>

      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.footer}>
        {post.text && (
          <p className={styles.caption}>
            {captionLines.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        )}

        <div className={styles.counts}>
          <span className={styles.count}>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              favorite
            </span>
            {formatCount(post.likes)}
          </span>
          <span className={styles.count}>
            <span className="material-symbols-outlined">mode_comment</span>
            {formatCount(post.comments)}
          </span>
        </div>
      </div>
    </main>
  );
}
