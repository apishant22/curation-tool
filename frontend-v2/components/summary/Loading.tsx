"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Sparkles, BookOpenCheck } from "lucide-react";

const Loading = ({ profileLink }: { profileLink: string }) => {
  const [status, setStatus] = useState<string>("Starting process...");

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  // Map statuses to progress values
  const statusProgressMap: { [key: string]: number } = {
    "Starting process...": 0,
    "Checking database for existing author...": 10,
    "Author found in database. Checking for updates...": 20,
    "Author not found in database. Proceeding with scraping...": 20,
    "Scraping latest publications...": 30,
    "Fetching author details from database...": 40,
    "No details in database. Scraping full author details...": 50,
    "Scraping full author details due to new publication...": 50,
    "Storing scraped author details in database...": 60,
    "Updating author details in database...": 60,
    "No new publications found. Checking summary...": 60,
    "Generating summary using LLM...": 85,
    "Generating new summary using LLM...": 85,
    "Generating summary using LLM for updated author details...": 85,
    "Process complete. Author details updated successfully.": 100,
    "Process complete. Author details and summary updated successfully.": 100,
    "Process complete. No updates required.": 100,
  };

  const fetchProgress = async () => {
    try {
      const profileId = profileLink.split("/").pop();
      const response = await fetch(`${BASE_URL}/progress/${profileId}`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      } else {
        setStatus("Unable to fetch progress updates.");
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
      setStatus("An error occurred while fetching progress.");
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      const interval = setInterval(fetchProgress, 2000);
      return () => clearInterval(interval);
    }, 2000);

    return () => clearTimeout(delay);
  }, [profileLink]);


  // Determine progress based on the current status
  const progress = statusProgressMap[status] || 0;

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
              style={{ width: `${progress}%` }}></div>
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
