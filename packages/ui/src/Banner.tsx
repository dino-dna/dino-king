import React from "react";

export const Banner: React.FC<React.HTMLProps<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div className={`${className ?? ""} banner__state--error`} {...rest}>
    <p>{children}</p>
  </div>
);
