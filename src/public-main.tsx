import { createRoot } from "react-dom/client";
import PublicApp from "./PublicApp";
import "./index.css";

const rootElement = document.getElementById("root")!;

// Public pages are prerendered for SEO, but their server markup is intentionally
// slimmer than the client provider tree. A client render replaces that markup
// and guarantees that forms and navigation receive React event handlers.
createRoot(rootElement).render(<PublicApp />);
