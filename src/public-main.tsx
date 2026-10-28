import { createRoot, hydrateRoot } from "react-dom/client";
import PublicApp from "./PublicApp";
import "./index.css";

const rootElement = document.getElementById("root")!;
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <PublicApp />);
} else {
  createRoot(rootElement).render(<PublicApp />);
}
