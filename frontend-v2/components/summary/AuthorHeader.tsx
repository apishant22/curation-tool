import React from "react";

interface AuthorHeaderProps {
  name: string;
}

const AuthorHeader: React.FC<AuthorHeaderProps> = ({ name }) => {
  return (
    <div className="relative py-6 mb-8 bg-white">
      <div className="max-w-2xl mx-auto px-4">
        <div className=" p-2 rounded-lg border border-gray-100">
          <h1 className="text-center text-3xl font-bold">
            {name.toUpperCase()}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default AuthorHeader;
