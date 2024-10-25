import React from 'react';

const AuthorHeader = ({ name }) => {
  return (
    <div className="relative py-6 mb-8 bg-white shadow-sm">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-700 via-acm-blue to-blue-700 p-6 rounded-lg border border-gray-100">
          <h1 className="text-center text-3xl font-bold font-archivo text-slate-200">
            {name.toUpperCase()}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default AuthorHeader;