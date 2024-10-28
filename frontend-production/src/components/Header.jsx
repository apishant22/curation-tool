import React from "react";
import acmLogo from "../assets/acm_logo.png";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/");
  };

  return (
    <button
      onClick={handleClick}
      className="bg-acm-blue w-full shadow-xl flex justify-between "
    >
      <div className="w-40 flex items-center justify-center flex-shrink-0 ml-5">
        <img
          className="object-contain max-h-full max-w-full"
          src={acmLogo}
          alt="acm-logo"
        ></img>
      </div>
    </button>
  );
};

export default Header;
