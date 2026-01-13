import React from "react";

const Theme = ({ setOpenNav, openNav }) => {
  return (
    <div
      className="darkmode-trigger uk-position-bottom-right uk-position-small uk-position-fixed uk-box-shadow-large uk-radius-circle"
      data-darkmode-toggle=""
      onClick={() => setOpenNav(true)}
    >
      <label className="switch">
        <span className="sr-only">Dark mode toggle</span>
        <input type="checkbox" />
        <span className="slider" />
      </label>
    </div>
  );
};

export default Theme;
