"use client";
import React from "react";

interface AuthorHeaderProps {
  name: string;
}

const AuthorHeader: React.FC<AuthorHeaderProps> = ({ name }) => {
  return (
    <div className="relative pt-6 ">
      <div className="max-w-2xl mx-auto px-4">
        <div className=" p-2 rounded-lg border ">
          <h1 className="text-center text-3xl font-bold">
            {name.toUpperCase()}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default AuthorHeader;
