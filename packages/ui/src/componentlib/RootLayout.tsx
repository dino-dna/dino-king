// Generate a page layout with Pivotal UI react components
import React from "react";
import { Grid, Row, Column } from "@carbon/react";

export const RootLayout: React.FCC = ({ children }) => {
  return <div>{children}</div>;
};
