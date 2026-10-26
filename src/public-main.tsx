import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PublicRoutes } from "./PublicApp";
import "./index.css";

createRoot(document.getElementById("root")!).render(<BrowserRouter><PublicRoutes /></BrowserRouter>);
