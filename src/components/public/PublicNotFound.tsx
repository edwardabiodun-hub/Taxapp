import { Link } from "react-router-dom";
import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";

const PublicNotFound = () => (
  <div className="min-h-screen bg-[#f8f7f3] text-[#12352f]">
    <PublicNav />
    <main className="mx-auto flex min-h-[55vh] max-w-3xl flex-col items-start justify-center px-5 py-16 sm:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#b06b12]">404 · Page not found</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">We couldn’t find that page.</h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-[#55736c]">The address may have changed or the page may no longer be available. You can return to FileSmart or browse the tax education guides.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="inline-flex min-h-11 items-center rounded-full bg-[#12352f] px-6 font-semibold text-white hover:bg-[#1c4e44]" to="/">Go to FileSmart home</Link>
        <Link className="inline-flex min-h-11 items-center rounded-full border border-[#b8cec4] px-6 font-semibold hover:bg-white" to="/learn">Browse tax guides</Link>
      </div>
    </main>
    <PublicFooter />
  </div>
);

export default PublicNotFound;
