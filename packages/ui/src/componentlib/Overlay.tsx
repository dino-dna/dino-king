import React, { useState } from "react";
import "./Overlay.css";

export const Overlay: React.FCC = ({ children }) => {
  return <div className="overlay visible">{children}</div>;
};
