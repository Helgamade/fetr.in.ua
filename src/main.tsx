import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Загружаем и выводим timestamp деплоя в консоль
fetch('/DEPLOY_TIMESTAMP.txt')
  .then(response => response.text())
  .then(timestamp => {
    const trimmedTimestamp = timestamp.trim();
    if (trimmedTimestamp) {
      console.log(`%c🕐 DEPLOY TIMESTAMP: ${trimmedTimestamp} ✅`, 'color: #10b981; font-weight: bold; font-size: 14px;');
    }
  })
  .catch(() => {
    // Игнорируем ошибки, если файл недоступен
  });

createRoot(document.getElementById("root")!).render(<App />);
