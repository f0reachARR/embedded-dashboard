import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./components/App";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
