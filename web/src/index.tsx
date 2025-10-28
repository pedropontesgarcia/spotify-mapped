import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@radix-ui/themes/styles.css";
import "./index.css";

import App from "./App";
import { Theme } from "@radix-ui/themes";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  // <StrictMode>
  <Theme appearance="dark">
    <App />
  </Theme>
  // </StrictMode>
);
