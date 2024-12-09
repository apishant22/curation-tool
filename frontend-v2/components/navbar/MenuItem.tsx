"use client";

interface MenuItemProps {
  onClick: () => void;
  label: string;
  logout?: boolean;
  transparent?: boolean;
}

import React from "react";

const MenuItem: React.FC<MenuItemProps> = ({
  onClick,
  label,
  logout,
  transparent,
}) => {
  return (
    <div
      onClick={onClick}
      className={`py-3 pl-6 text-sm font-semibold text-black transition duration-150 hover:text-neutral-400 dark:text-neutral-400 dark:hover:bg-transparent dark:hover:text-neutral-50 ${
        logout
          ? "rounded-md border bg-red-600 text-white dark:bg-transparent"
          : "bg-transparent"
      } ${transparent ? "bg-transparent text-black" : ""}`}>
      {label}
    </div>
  );
};

export default MenuItem;
