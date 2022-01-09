import React from "react";
import ReactDOM from "react-dom";
import "@blueprintjs/core/lib/css/blueprint.css";
import "./index.css";
import App from "./App";
import { HotkeysProvider } from "@blueprintjs/core";

ReactDOM.render(
  <React.StrictMode>
    <HotkeysProvider>
      <App />
    </HotkeysProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
