import React from "react";

interface BannerProps {
  type: "error" | "warn" | "info" | "success";
  children: React.ReactNode;
}

const Banner: React.FC<BannerProps> = ({ type, children }) => {
  const getBannerStyle = (type: string) => {
    switch (type) {
      case "error":
        return {
          backgroundColor: "#f8d7da",
          color: "#721c24",
        };
      case "warn":
        return {
          backgroundColor: "#fff3cd",
          color: "#856404",
        };
      case "info":
        return {
          backgroundColor: "#d1ecf1",
          color: "#0c5460",
        };
      case "success":
        return {
          backgroundColor: "#d4edda",
          color: "#155724",
        };
      default:
        return {};
    }
  };

  return (
    <div
      style={{
        width: "100%",
        padding: 8,
        textAlign: "center",
        boxSizing: "border-box",
        ...getBannerStyle(type),
      }}
    >
      {children}
    </div>
  );
};

export default Banner;
