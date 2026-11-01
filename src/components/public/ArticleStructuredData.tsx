import { PUBLIC_SITE_ORIGIN } from "@/lib/seo";
import type { NewsArticle } from "@/content/news";

const toJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

const ArticleStructuredData = ({ article }: { article: NewsArticle }) => {
  const url = `${PUBLIC_SITE_ORIGIN}/news/${article.slug}`;
  const faqBlocks = article.blocks.filter((block): block is Extract<typeof block, { type: "faq" }> => block.type === "faq");
  const articleData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: [`${PUBLIC_SITE_ORIGIN}${article.image.src}`],
    author: { "@type": "Organization", name: "FileSmart BridgeIQ LTD." },
    publisher: { "@type": "Organization", name: "FileSmart BridgeIQ LTD.", url: PUBLIC_SITE_ORIGIN },
    articleSection: article.category,
  };
  const faqData = faqBlocks.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqBlocks.map((block) => ({
          "@type": "Question",
          name: block.question,
          acceptedAnswer: { "@type": "Answer", text: block.answer },
        })),
      }
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleData) }} />
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqData) }} />}
    </>
  );
};

export default ArticleStructuredData;
