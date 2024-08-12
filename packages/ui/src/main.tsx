import "./index.css";
import ReactDOM from "react-dom/client";
import { App } from "./App";

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(<App />);

declare module "react" {
  type FCC<P = {}> = React.FC<P & { children?: React.ReactNode }>;
}
