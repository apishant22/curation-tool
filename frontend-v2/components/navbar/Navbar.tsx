"use client";

import React from "react";

import Logo from "./Logo";
import Container from "../global/Container";

const Navbar = () => {
  return (
    <div className="fixed z-10 w-full border-b-[1px] bg-white shadow-sm">
      <Container>
        <div className="flex items-center justify-between gap-2 p-4 md:gap-6">
          <Logo />
        </div>
      </Container>
    </div>
  );
};

export default Navbar;
