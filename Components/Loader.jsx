import React from "react";

const Loader = () => {
  return (
    <div className="loader-overlay">
      <div style={{ textAlign: "center" }}>
        <div className="spinner"></div>
        <p style={{ marginTop: 16, color: "var(--text-secondary)" }}>
          Processing transaction...
        </p>
      </div>
    </div>
  );
};

export default Loader;
