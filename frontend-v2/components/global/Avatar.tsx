"use client";

import Image from "next/image";
import React from "react";

interface AvatarProps {
  src?: string | null | undefined;
  web?: boolean;
  smaller?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ src, web, smaller }) => {
  return (
    <Image
      alt="avatar"
      src={src || "/images/avatar.png"}
      width={web && !smaller ? 35 : smaller ? 22 : 50}
      height={web && !smaller ? 35 : smaller ? 22 : 50}
      className="rounded-full cursor-pointer"
    />
  );
};

export default Avatar;
