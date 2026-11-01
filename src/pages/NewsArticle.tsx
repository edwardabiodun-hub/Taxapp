import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNewsArticle } from "@/content/news";
import { setPageMetadata } from "@/lib/seo";
import ArticleBlocks from "@/components/public/ArticleBlocks";
import ArticleStructuredData from "@/components/public/ArticleStructuredData";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { NairaText } from "@/components/ui/NairaText";

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getNewsArticle(slug) : undefined;

  useEffect(() => setPageMetadata(
    article
      ? { title: `${article.title} | FileSmart`, description: article.summary, path: `/news/${article.slug}`, type: "article", publishedTime: article.publishedAt, modifiedTime: article.updatedAt }
      : { title: "News article not found | FileSmart", description: "Return to FileSmart news to find another update.", path: `/news/${slug ?? ""}` },
  ), [article, slug]);

  if (!article) {
    return <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]"><main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16 text-center sm:px-8"><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]">FileSmart news</p><h1 className="mt-4 font-display text-4xl font-bold tracking-tight">News article not found</h1><p className="mx-auto mt-5 max-w-lg leading-7 text-[#55736c]">That update may have moved or the link may be incomplete. Browse FileSmart news to find another update.</p><Button asChild className="mx-auto mt-8 min-h-11 rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]"><Link className="inline-flex min-h-11 items-center" to="/news">Back to FileSmart news <ArrowRight className="h-4 w-4" /></Link></Button></main></div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-[#12352f]">
      <ArticleStructuredData article={article} />
      <PublicNav />
      <main className="mx-auto max-w-3xl overflow-x-hidden px-5 py-12 sm:px-8 sm:py-16">
        <Badge variant="secondary">{article.category}</Badge>
        <h1 className="mt-5 break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"><NairaText>{article.title}</NairaText></h1>
        <p className="mt-5 text-lg leading-8 text-[#55736c]"><NairaText>{article.summary}</NairaText></p>
        <p className="mt-4 text-sm text-[#55736c]">{article.readTimeMinutes} min read · Published {article.publishedAt} · Updated {article.updatedAt}</p>
        <figure className="mt-8 overflow-hidden rounded-[2rem] border border-[#b9cec3] bg-white shadow-[0_24px_60px_rgba(18,53,47,0.13)]"><img src={article.image.src} alt={article.image.alt} width={1600} height={900} loading="eager" decoding="async" className="aspect-[16/9] w-full object-cover" /></figure>
        <ArticleBlocks blocks={article.blocks} />
        {article.cta && <Card className="mt-10 border-[#cfe0d4] bg-[#edf4ee] shadow-none"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-[#12352f]">Continue with FileSmart</p><p className="mt-1 text-sm leading-6 text-[#55736c]">Use the calculator to organise your inputs and explore your 2026 result.</p></div><Button asChild className="min-h-11 rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]"><Link className="inline-flex min-h-11 items-center" to={article.cta.href}>{article.cta.label} <ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>}
        <aside className="mt-10 border-t border-[#dce6df] pt-6 text-sm leading-6 text-[#55736c]"><p><NairaText>{article.sourceNote}</NairaText></p>{article.sources && article.sources.length > 0 && <div className="mt-4"><p className="font-semibold text-[#12352f]">Official references</p><ul className="mt-2 list-disc space-y-1 pl-5">{article.sources.map((source) => <li key={source.url}><a className="underline decoration-[#b06b12] underline-offset-2 hover:text-[#12352f]" href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}</ul></div>}</aside>
        <Button asChild variant="link" className="mt-8 min-h-11 h-auto px-0 text-[#12352f]"><Link className="inline-flex min-h-11 items-center" to="/news"><ArrowLeft className="h-4 w-4" /> Read more FileSmart news</Link></Button>
      </main>
      <PublicFooter />
    </div>
  );
};

export default NewsArticle;
