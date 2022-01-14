import React from "react";
import ReactDOM from "react-dom";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./index.css";
import App from "./App";
import { HotkeysProvider } from "@blueprintjs/core";
import { nullthrows } from "./assert";

const root = ReactDOM.createRoot(nullthrows(document.getElementById("root")));

root.render(
  <React.StrictMode>
    <HotkeysProvider>
      <App />
    </HotkeysProvider>
  </React.StrictMode>
);
