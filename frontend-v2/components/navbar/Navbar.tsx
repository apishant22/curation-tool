"use client";

import React from "react";

import Logo from "./Logo";
import Container from "../global/Container";
import UserMenu from "./UserMenu";

type User =
  | {
      name?: string | null | undefined;
      email?: string | null | undefined;
      image?: string | null | undefined;
    }
  | undefined;

type Props = {
  user: User;
};

const Navbar: React.FC<Props> = (user) => {
  return (
    <div className="fixed z-10 w-full bg-white dark:bg-zinc-900">
      <Container>
        <div className="flex items-center justify-between gap-2 p-4 pr-12 pl-12 md:gap-6">
          <Logo />
          <UserMenu image={user.user?.image} />
        </div>
      </Container>
    </div>
  );
};

export default Navbar;
