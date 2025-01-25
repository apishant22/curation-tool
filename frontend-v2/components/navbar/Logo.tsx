"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface LogoProps {
  src?: string;
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({ src, alt }) => {
  const router = useRouter();
  const clickFunction = () => {
    sessionStorage.removeItem("resultsURL");
    router.refresh();
    router.push("/");
  };
  return (
    <Image
      onClick={clickFunction}
      alt={alt || "ACM Logo"}
      src={src || "/images/acm-logo.png"}
      width={100}
      height={100}
      className="cursor-pointer md:block"
    />
  );
};

export default Logo;
