/* eslint-disable @next/next/no-img-element */
import type { Article } from "@/lib/fetchArticles";
import { withBasePath } from "@/lib/basePath";
import { formatDate } from "@/lib/formatDate";
import styles from "./news.module.css";

export function ArticleSlide({ article }: { article: Article }) {
  return (
    <div className={styles.slide}>
      {article.image ? (
        <img className={styles.image} src={withBasePath(article.image)} alt="" />
      ) : (
        <div
          className={styles.imageFallback}
          style={{ backgroundColor: article.accent }}
        />
      )}
      <div className={styles.scrim} />

      <div className={styles.logo}>
        {article.logo ? (
          <img
            className={styles.logoImg}
            src={withBasePath(article.logo)}
            alt={article.sourceName}
          />
        ) : (
          <span className={styles.wordmark} style={{ borderColor: article.accent }}>
            {article.sourceName}
          </span>
        )}
      </div>

      <div className={styles.headlineWrap}>
        <h1 className={styles.headline}>{article.title}</h1>
        {article.date && (
          <span className={styles.date}>{formatDate(article.date)}</span>
        )}
      </div>
    </div>
  );
}
