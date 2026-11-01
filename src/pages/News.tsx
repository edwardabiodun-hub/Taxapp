import { useEffect } from "react";
import { ArrowRight, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { newsArticles } from "@/content/news";
import { setPageMetadata } from "@/lib/seo";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { NairaText } from "@/components/ui/NairaText";

const News = () => {
  useEffect(() => setPageMetadata({
    title: "FileSmart news and product updates | FileSmart",
    description: "Read FileSmart product announcements, calculator updates, and practical tax preparation news.",
    path: "/news",
  }), []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />
      <main className="mx-auto max-w-6xl overflow-x-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]"><Newspaper className="h-4 w-4" /> FileSmart news</p>
          <h1 className="break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Product updates and tax preparation news</h1>
          <p className="mt-5 text-lg leading-8 text-[#55736c]">Follow new FileSmart tools, product improvements, and practical updates that help you prepare with more confidence.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {newsArticles.map((article) => (
            <Card key={article.slug} className="min-w-0 flex h-full flex-col overflow-hidden border-[#dce6df] bg-white/70 shadow-none">
              <img src={article.image.src} alt={article.image.alt} width={1600} height={900} loading="eager" decoding="async" className="aspect-[16/9] w-full object-cover" />
              <CardHeader>
                <Badge variant="secondary" className="w-fit">{article.category}</Badge>
                <CardTitle className="min-w-0 break-words pt-3 text-xl leading-snug"><Link className="block min-h-11 break-words hover:underline" to={`/news/${article.slug}`}><NairaText>{article.title}</NairaText></Link></CardTitle>
                <CardDescription className="leading-6"><NairaText>{article.summary}</NairaText></CardDescription>
              </CardHeader>
              <CardFooter className="mt-auto flex items-center justify-between gap-3 text-sm text-[#55736c]"><span>{article.readTimeMinutes} min read</span><Button asChild variant="link" className="h-auto min-h-11 max-w-full justify-start p-0 text-[#12352f]"><Link className="inline-flex min-h-11 items-center gap-2" to={`/news/${article.slug}`} aria-label={`Read ${article.title}`}>Read news <ArrowRight className="h-4 w-4 shrink-0" /></Link></Button></CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default News;
