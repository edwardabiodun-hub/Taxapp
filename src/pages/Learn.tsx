import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getTaxGuidesByCategory, taxGuides } from "@/content/tax-guides";
import { setPageMetadata } from "@/lib/seo";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import { NairaText } from "@/components/ui/NairaText";

const categoryLabel = (category: string) => category.replace(/-/g, " ");

const Learn = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const categories = useMemo(() => [...new Set(taxGuides.map((guide) => guide.category))], []);
  const guides = getTaxGuidesByCategory(selectedCategory);

  useEffect(
    () =>
      setPageMetadata({
        title: "Learn about Nigerian tax | FileSmart",
        description: "Plain-language Nigerian tax education guides for understanding preparation and filing.",
        path: "/learn",
      }),
    [],
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-[#12352f]">
      <PublicNav />

      <main className="mx-auto max-w-6xl overflow-x-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]"><BookOpen className="h-4 w-4" /> FileSmart education</p>
          <h1 className="break-words font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Learn about your tax</h1>
          <p className="mt-5 text-lg leading-8 text-[#55736c]">Clear, general information to help you prepare questions, records, and next steps with more confidence.</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2" aria-label="Guide categories">
          <Button type="button" className="min-h-11" variant={selectedCategory ? "outline" : "default"} onClick={() => setSelectedCategory(undefined)}>
            {!selectedCategory && <Check className="h-4 w-4" />} All guides
          </Button>
          {categories.map((category) => (
            <Button key={category} type="button" className="min-h-11" variant={selectedCategory === category ? "default" : "outline"} onClick={() => setSelectedCategory(category)}>
              {categoryLabel(category)}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Card key={guide.slug} className="min-w-0 flex h-full flex-col border-[#dce6df] bg-white/70 shadow-none">
              <CardHeader>
                <Badge variant="secondary" className="w-fit capitalize">{categoryLabel(guide.category)}</Badge>
                <CardTitle className="min-w-0 break-words pt-3 text-xl leading-snug"><Link className="block min-h-11 break-words hover:underline" to={`/learn/${guide.slug}`}><NairaText>{guide.title}</NairaText></Link></CardTitle>
                <CardDescription className="leading-6"><NairaText>{guide.summary}</NairaText></CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-end text-sm text-[#55736c]">{guide.readTimeMinutes} min read</CardContent>
              <CardFooter><Button asChild variant="link" className="h-auto min-h-11 max-w-full justify-start p-0 text-[#12352f]"><Link className="inline-flex min-h-11 items-center gap-2" to={`/learn/${guide.slug}`} aria-label={`Read ${guide.title}`}>Read guide <ArrowRight className="h-4 w-4 shrink-0" /></Link></Button></CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Learn;
