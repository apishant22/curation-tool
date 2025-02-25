"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const HomeLogo = () => {
  const router = useRouter();
  return (
    <Image
      onClick={() => router.push("/")}
      alt={"ACM Logo"}
      src={"/images/acm-logo.png"}
      width={300}
      height={300}
      className="hidden cursor-pointer md:block"
    />
  );
};

export default HomeLogo;
