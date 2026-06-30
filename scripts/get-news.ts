import { getArticles } from "../src/lib/fetchArticles";

async function main() {
  const articles = await getArticles();
  process.stdout.write(`${JSON.stringify(articles, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
