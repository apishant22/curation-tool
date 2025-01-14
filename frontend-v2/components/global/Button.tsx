"use client";

import React from "react";
import { IconType } from "react-icons";

interface ButtonProps {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  outline?: boolean;
  small?: boolean;
  icon?: IconType;
}

const Button: React.FC<ButtonProps> = ({
   label,
   onClick,
   disabled,
   outline = false,
   small,
   icon: Icon,
}) => {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`relative w-full rounded-lg transition hover:opacity-80 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70
      ${
                outline ? "bg-white border-black text-black" : "bg-white border-blue-500 text-blue-500"
            } 
      ${small ? "py-1" : "py-3"} ${small ? "text-sm" : "text-md"} 
      ${small ? "font-light" : "font-semibold"} 
      ${small ? "border-[1px]" : "border-2"} 
      ${
                outline
                    ? "hover:bg-gray-50 focus:ring-2 focus:ring-gray-400"
                    : "hover:bg-blue-50 focus:ring-2 focus:ring-blue-400"
            }`}>
            {Icon && <Icon size={24} className="absolute left-4 top-3" />}
            {label}
        </button>
    );
};



export default Button;
