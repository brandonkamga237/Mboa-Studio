import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#ffffff",
          color: "#1a1a1a",
          border: "1px solid #e5e5e5",
          borderRadius: "10px",
          fontSize: "0.875rem",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
        success: { iconTheme: { primary: "#0f0f0f", secondary: "#ffffff" } },
        error: { iconTheme: { primary: "#dc2626", secondary: "#ffffff" } },
      }}
    />
    <App />
  </React.StrictMode>
);
