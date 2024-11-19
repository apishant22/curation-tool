"use client";

import React, { useCallback, useState } from "react";

import Logo from "./Logo";
import Container from "../global/Container";
import { MdOutlineDarkMode, MdOutlineLightMode } from "react-icons/md";

const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);

  // Toggle function to switch between dark and light modes
  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const newTheme = !prev ? "dark" : "light";
      localStorage.setItem("theme", newTheme); // Store the theme in localStorage
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      return !prev;
    });
  }, []);
  return (
    <div className="fixed z-10 w-full bg-white border dark:bg-zinc-900">
      <Container>
        <div className="flex items-center justify-between gap-2 p-4 md:gap-6">
          <Logo />
          <button className="hover:text-neutral-600" onClick={toggleDarkMode}>
            {darkMode ? <MdOutlineDarkMode /> : <MdOutlineLightMode />}
          </button>
        </div>
      </Container>
    </div>
  );
};

export default Navbar;
