import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Form from "./routes/Form.tsx";
import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route path="/network" element={<Form />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
