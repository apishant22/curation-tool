"use client";
import React, { useEffect, useState } from "react";

interface ProgressBarProps {
  loading: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ loading }) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;

    if (loading && progress < 90) {
      // Start the progress animation
      intervalId = setInterval(() => {
        setProgress((prevProgress) => {
          // Slow down progress as it gets higher
          const increment = (90 - prevProgress) / 10;
          return Math.min(prevProgress + increment, 90);
        });
      }, 100);
    } else if (!loading) {
      // When loading is complete, quickly fill to 100%
      setProgress(100);
      // Then reset after a brief delay
      const timeout = setTimeout(() => {
        setProgress(0);
      }, 500);
      return () => clearTimeout(timeout);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loading, progress]);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
        style={{ width: `${progress}%` }}>
        {/* Animated gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
      </div>
    </div>
  );
};

export default ProgressBar;
