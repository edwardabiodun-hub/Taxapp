import { Card, CardContent } from "@/components/ui/card";
import { NairaText } from "@/components/ui/NairaText";
import type { TaxGuideBlock } from "@/content/tax-guides";

const ArticleBlocks = ({ blocks }: { blocks: TaxGuideBlock[] }) => (
  <article className="mt-10 break-words space-y-6">
    {blocks.map((block, index) => {
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
);

export default ArticleBlocks;
