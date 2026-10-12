import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTaxGuide } from "@/content/tax-guides";
import { setPageMetadata } from "@/lib/seo";

const categoryLabel = (category: string) => category.replaceAll("-", " ");

const Guide = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getTaxGuide(slug) : undefined;

  useEffect(
    () =>
      setPageMetadata(
        guide
          ? {
              title: `${guide.title} | FileSmart`,
              description: guide.summary,
              path: `/learn/${guide.slug}`,
              type: "article",
              publishedTime: guide.publishedAt,
              modifiedTime: guide.updatedAt,
            }
          : {
              title: "Guide not found | FileSmart",
              description: "Return to the FileSmart education guides to find another Nigerian tax topic.",
              path: `/learn/${slug ?? ""}`,
            },
      ),
    [guide, slug],
  );

  if (!guide) {
    return (
      <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
        <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-16 text-center sm:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]">FileSmart education</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Guide not found</h1>
          <p className="mx-auto mt-5 max-w-lg leading-7 text-[#55736c]">That guide may have moved or the link may be incomplete. Browse the full education library to find another topic.</p>
          <Button asChild className="mx-auto mt-8 rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]"><Link to="/learn">Back to all guides <ArrowRight className="h-4 w-4" /></Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
      <header className="border-b border-[#dce6df] bg-[#f8f7f3]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-[#55736c] hover:text-[#12352f]"><ArrowLeft className="h-4 w-4" /> All guides</Link>
          <Link to="/" className="font-display text-xl font-bold tracking-tight" aria-label="FileSmart home">FileSmart</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
        <Badge variant="secondary" className="capitalize">{categoryLabel(guide.category)}</Badge>
        <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{guide.title}</h1>
        <p className="mt-5 text-lg leading-8 text-[#55736c]">{guide.summary}</p>
        <p className="mt-4 text-sm text-[#55736c]">{guide.readTimeMinutes} min read · Updated {guide.updatedAt}</p>

        <article className="mt-10 space-y-6">
          {guide.blocks.map((block, index) => {
            if (block.type === "list") {
              return <ul key={`${block.type}-${index}`} className="list-disc space-y-3 pl-6 leading-7 text-[#23483f]">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
            }
            if (block.type === "callout") {
              return <Card key={`${block.type}-${index}`} className="border-[#e7c981] bg-[#fff8e9] shadow-none"><CardContent className="p-5 leading-7 text-[#5c461e]"><p className="font-semibold">{block.tone === "caution" ? "Please note" : "Helpful context"}</p><p className="mt-2">{block.text}</p></CardContent></Card>;
            }
            return <p key={`${block.type}-${index}`} className="leading-8 text-[#23483f]">{block.text}</p>;
          })}
        </article>

        <aside className="mt-10 border-t border-[#dce6df] pt-6 text-sm leading-6 text-[#55736c]"><p>{guide.sourceNote}</p></aside>
        <Button asChild variant="link" className="mt-8 h-auto px-0 text-[#12352f]"><Link to="/learn"><ArrowLeft className="h-4 w-4" /> Read another guide</Link></Button>
      </main>
    </div>
  );
};

export default Guide;
