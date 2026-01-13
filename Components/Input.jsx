import React from "react";

const Input = ({ name, handleChange, type = "text", step, placeholder }) => {
  return (
    <div className="uk-grid-2xsmall uk-grid uk-child-width-auto@m uk-flex-middle uk-flex-center uk-margin-small-top uk-margin-medium-top@m">
      <div className="uk-first-column">
        <input
          onChange={handleChange}
          type={type}
          step={step}
          className="uk-input uk-form-medium uk-form-large@m uk-width-large@m"
          placeholder={placeholder || name}
        />
      </div>
    </div>
  );
};

export default Input;
