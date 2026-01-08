import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Выводим timestamp деплоя в консоль ПЕРВОЙ СТРОКОЙ
// Используем синхронный XMLHttpRequest для немедленного вывода
(function() {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/DEPLOY_TIMESTAMP.txt', false); // false = синхронный запрос
    xhr.send();
    if (xhr.status === 200) {
      const timestamp = xhr.responseText.trim();
      if (timestamp) {
        console.log(`%c🕐 DEPLOY TIMESTAMP: ${timestamp} ✅`, 'color: #10b981; font-weight: bold; font-size: 14px;');
      }
    }
  } catch (e) {
    // Игнорируем ошибки, если файл недоступен
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
