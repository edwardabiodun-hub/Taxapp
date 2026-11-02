import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

export function mountApp(target: HTMLElement, isPublic = import.meta.env.MODE === "public") {
  if (isPublic && target.hasChildNodes()) {
    hydrateRoot(target, <App />);
    return;
  }

  createRoot(target).render(<App />);
}

mountApp(root);
