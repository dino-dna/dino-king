import "./index.css";
import ReactDOM from "react-dom/client";
import { App } from "./App";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React from "react";

// const DinoKingView = React.lazy(() => import("./DinoKingView"));
// const Attribution = React.lazy(() => import("./Attribution"));

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/game/:gameId",
    lazy: () =>
      import("./DinoKingView").then((mod) => ({ Component: mod.default })),
  },
  {
    path: "/attribution",
    lazy: () =>
      import("./Attribution").then((mod) => ({ Component: mod.default })),
    errorElement: <div>Attribution failed to load</div>,
  },
]);

const rootElement = document.getElementById("root") as HTMLElement;
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);

declare module "react" {
  type FCC<P = {}> = React.FC<P & { children?: React.ReactNode }>;
}
