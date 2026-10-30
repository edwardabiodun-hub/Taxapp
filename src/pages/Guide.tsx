import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getTaxGuide } from "@/content/tax-guides";
import { setPageMetadata } from "@/lib/seo";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { NairaText } from "@/components/ui/NairaText";

const categoryLabel = (category: string) => category.replace(/-/g, " ");

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
              description: "Return to FileSmart's education guides to find another tax topic.",
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
          <Button asChild className="mx-auto mt-8 min-h-11 rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]"><Link className="inline-flex min-h-11 items-center" to="/learn">Back to all guides <ArrowRight className="h-4 w-4" /></Link></Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />

      <main className="mx-auto max-w-3xl overflow-x-hidden px-5 py-12 sm:px-8 sm:py-16">
        <Badge variant="secondary" className="capitalize">{categoryLabel(guide.category)}</Badge>
        <h1 className="mt-5 break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"><NairaText>{guide.title}</NairaText></h1>
        <p className="mt-5 text-lg leading-8 text-[#55736c]"><NairaText>{guide.summary}</NairaText></p>
        <p className="mt-4 text-sm text-[#55736c]">{guide.readTimeMinutes} min read · Last reviewed {guide.updatedAt}</p>
        {guide.reviewStatus === "pending-professional-review" && (
          <p className="mt-4 rounded-xl border border-[#e7c981] bg-[#fff8e9] px-4 py-3 text-sm leading-6 text-[#5c461e]" role="note">
            Professional review pending — this is general information, not individualized tax advice.
          </p>
        )}

        <article className="mt-10 break-words space-y-6">
          {guide.blocks.map((block, index) => {
            if (block.type === "heading") {
              const Heading = block.level === 3 ? "h3" : "h2";
              return <Heading key={`${block.type}-${index}`} className="font-display text-2xl font-bold leading-tight text-[#12352f]"><NairaText>{block.text}</NairaText></Heading>;
            }
            if (block.type === "list") {
              return <ul key={`${block.type}-${index}`} className="list-disc space-y-3 pl-6 leading-7 text-[#23483f]">{block.items.map((item) => <li key={item}><NairaText>{item}</NairaText></li>)}</ul>;
            }
            if (block.type === "table") {
              return (
                <div key={`${block.type}-${index}`} className="overflow-x-auto rounded-2xl border border-[#dce6df] bg-white/70">
                  <table className="w-full min-w-[28rem] text-left text-sm">
                    <thead className="bg-[#edf4ee] text-[#12352f]"><tr>{block.headers.map((header) => <th key={header} scope="col" className="px-4 py-3 font-semibold"><NairaText>{header}</NairaText></th>)}</tr></thead>
                    <tbody>{block.rows.map((row, rowIndex) => <tr key={`${row.join("-")}-${rowIndex}`} className="border-t border-[#dce6df]">{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`} className="px-4 py-3 text-[#23483f]"><NairaText>{cell}</NairaText></td>)}</tr>)}</tbody>
                  </table>
                </div>
              );
            }
            if (block.type === "callout") {
              return <Card key={`${block.type}-${index}`} className="border-[#e7c981] bg-[#fff8e9] shadow-none"><CardContent className="p-5 leading-7 text-[#5c461e]"><p className="font-semibold">{block.tone === "caution" ? "Please note" : "Helpful context"}</p><p className="mt-2"><NairaText>{block.text}</NairaText></p></CardContent></Card>;
            }
            if (block.type === "faq") {
              return <div key={`${block.type}-${index}`} className="rounded-2xl border border-[#dce6df] bg-white/70 p-5"><h3 className="font-semibold text-[#12352f]"><NairaText>{block.question}</NairaText></h3><p className="mt-2 leading-7 text-[#23483f]"><NairaText>{block.answer}</NairaText></p></div>;
            }
            return <p key={`${block.type}-${index}`} className="leading-8 text-[#23483f]"><NairaText>{block.text}</NairaText></p>;
          })}
        </article>

        {guide.cta && (
          <Card className="mt-10 border-[#cfe0d4] bg-[#edf4ee] shadow-none">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-[#12352f]">Continue with FileSmart</p>
                <p className="mt-1 text-sm leading-6 text-[#55736c]">Turn what you have learned into a clearer preparation record.</p>
              </div>
              <Button asChild className="min-h-11 rounded-full bg-[#12352f] text-[#fbfaf5] hover:bg-[#1c4e44]">
                <Link className="inline-flex min-h-11 items-center" to={guide.cta.href}>
                  {guide.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <aside className="mt-10 border-t border-[#dce6df] pt-6 text-sm leading-6 text-[#55736c]">
          <p><NairaText>{guide.sourceNote}</NairaText></p>
          {guide.sources && guide.sources.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold text-[#12352f]">Official references</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {guide.sources.map((source) => <li key={source.url}><a className="underline decoration-[#b06b12] underline-offset-2 hover:text-[#12352f]" href={source.url} target="_blank" rel="noreferrer">{source.label}</a></li>)}
              </ul>
            </div>
          )}
        </aside>
        <Button asChild variant="link" className="mt-8 min-h-11 h-auto px-0 text-[#12352f]"><Link className="inline-flex min-h-11 items-center" to="/learn"><ArrowLeft className="h-4 w-4" /> Read another guide</Link></Button>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Guide;
