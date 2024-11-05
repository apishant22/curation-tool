"use client";
import { Loader2, Sparkles } from "lucide-react";
import React from "react";

const Loading = () => {
  return (
    <div className="flex flex-grow flex-col max-w-[1024px] justify-center bg-white shadow-2xl p-8 rounded-lg animate-fadeIn">
      <div className="flex flex-col items-center space-y-6">
        {/* Animated header with sparkles */}
        <div className="relative flex items-center justify-center">
          <h2 className="text-xl font-bold text-gray-800 text-center">
            Hold on, we&apos;re gathering the author&apos;s information!
          </h2>
          <Sparkles className="absolute right-0 translate-x-8 text-blue-500 animate-bounce delay-100 mb-12" />
        </div>

        {/* Friendly message with typing animation */}
        <div className="text-center text-gray-600 max-w-md animate-typing overflow-hidden whitespace-nowrap">
          Please wait while we generate your page...
        </div>

        {/* Status message with spinner */}
        <div className="flex items-center justify-center space-x-2 text-md text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="animate-pulse">Generating page...</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
