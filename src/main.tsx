import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

if (import.meta.env.MODE === "public") {
  hydrateRoot(root, <App />);
} else {
  createRoot(root).render(<App />);
}
