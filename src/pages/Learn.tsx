import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getTaxGuidesByCategory, taxGuides } from "@/content/tax-guides";
import { setPageMetadata } from "@/lib/seo";

const categoryLabel = (category: string) => category.replaceAll("-", " ");

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
    <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
      <header className="border-b border-[#dce6df] bg-[#f8f7f3]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="font-display text-xl font-bold tracking-tight" aria-label="FileSmart home">FileSmart</Link>
          <Button asChild variant="outline" className="rounded-full border-[#12352f] text-[#12352f]">
            <Link to="/onboarding">Start online <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]"><BookOpen className="h-4 w-4" /> FileSmart education</p>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Learn about your tax</h1>
          <p className="mt-5 text-lg leading-8 text-[#55736c]">Clear, general information to help you prepare questions, records, and next steps with more confidence.</p>
        </div>

        <div className="mt-10 flex flex-wrap gap-2" aria-label="Guide categories">
          <Button type="button" variant={selectedCategory ? "outline" : "default"} onClick={() => setSelectedCategory(undefined)}>
            {!selectedCategory && <Check className="h-4 w-4" />} All guides
          </Button>
          {categories.map((category) => (
            <Button key={category} type="button" variant={selectedCategory === category ? "default" : "outline"} onClick={() => setSelectedCategory(category)}>
              {categoryLabel(category)}
            </Button>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <Card key={guide.slug} className="flex h-full flex-col border-[#dce6df] bg-white/70 shadow-none">
              <CardHeader>
                <Badge variant="secondary" className="w-fit capitalize">{categoryLabel(guide.category)}</Badge>
                <CardTitle className="pt-3 text-xl leading-snug"><Link className="hover:underline" to={`/learn/${guide.slug}`}>{guide.title}</Link></CardTitle>
                <CardDescription className="leading-6">{guide.summary}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 text-sm text-[#55736c]">{guide.readTimeMinutes} min read</CardContent>
              <CardFooter><Button asChild variant="link" className="h-auto p-0 text-[#12352f]"><Link to={`/learn/${guide.slug}`}>Read {guide.title} <ArrowRight className="h-4 w-4" /></Link></Button></CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Learn;
