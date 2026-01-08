import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Timestamp теперь выводится в index.html как inline script ДО загрузки React
// Это гарантирует, что он будет первой строкой в консоли

createRoot(document.getElementById("root")!).render(<App />);
