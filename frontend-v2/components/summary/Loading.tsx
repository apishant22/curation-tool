import React, { useEffect, useState } from "react";
import { Loader2, Sparkles, BookOpenCheck } from "lucide-react";

const Loading = () => {
  const [status, setStatus] = useState("Starting process...");
  const [progress, setProgress] = useState(0);

  // Define the sequence of status messages and their corresponding progress values
  const statusSequence = [
    { message: "Starting process...", progress: 0, duration: 2000 },
    {
      message: "Checking database for existing author...",
      progress: 10,
      duration: 2000,
    },
    {
      message: "Scraping latest publications...",
      progress: 30,
      duration: 3000,
    },
    { message: "Fetching author details...", progress: 50, duration: 2500 },
    {
      message: "Analyzing publication history...",
      progress: 65,
      duration: 2000,
    },
    {
      message: "Generating summary using LLM...",
      progress: 85,
      duration: 3000,
    },
    {
      message: "Process complete. Finalizing details...",
      progress: 100,
      duration: 1500,
    },
  ];

  useEffect(() => {
    let currentIndex = 0;

    const updateStatus = () => {
      if (currentIndex < statusSequence.length) {
        const { message, progress, duration } = statusSequence[currentIndex];
        setStatus(message);
        setProgress(progress);

        currentIndex++;

        if (currentIndex < statusSequence.length) {
          setTimeout(updateStatus, duration);
        }
      }
    };

    // Start the sequence
    updateStatus();

    // Cleanup function
    return () => {
      currentIndex = statusSequence.length; // This will stop the sequence
    };
  }, []);

  return (
    <div className="flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-grow flex-col max-w-[1024px] justify-center bg-white dark:bg-zinc-800 shadow-2xl p-8 pt-12 rounded-lg animate-fadeIn">
        <div className="flex flex-col items-center space-y-6">
          {/* Animated header with sparkles */}
          <div className="relative flex items-center justify-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-neutral-400 text-center">
              Hold on, we&apos;re gathering the author&apos;s information!
            </h2>
            <Sparkles className="absolute right-0 translate-x-8 text-blue-500 animate-bounce delay-100 mb-12" />
          </div>

          {/* Status Message */}
          <div className="text-center text-gray-600 max-w-md animate-typing overflow-hidden whitespace-nowrap dark:text-neutral-400">
            {status}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-4 relative">
            <div
              className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
            <div className="absolute right-0 -top-6 text-sm text-gray-600 dark:text-gray-400">
              {progress}%
            </div>
          </div>

          {/* Status Message with Spinner */}
          <div className="flex items-center justify-center space-x-2 text-md text-gray-600 dark:text-neutral-400">
            {progress < 85 ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            ) : (
              <BookOpenCheck className="w-4 h-4 text-green-500 animate-pulse" />
            )}
            <span className="animate-pulse">
              {progress < 100 ? "Generating page..." : "Finalizing!"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
