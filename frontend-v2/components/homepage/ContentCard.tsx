"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface ContentCardProps {
  name: string;
  profileLink: string;
  summary?: string;
  reason?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  name,
  profileLink,
  reason,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const formatName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const truncateWithEllipsis = (text: string, maxWords: number): string => {
    if (!text) return "Details not available.";
    const words = text.split(" ");
    if (words.length > maxWords) {
      return words.slice(0, maxWords - 1).join(" ") + " ...";
    }
    return text;
  };

  const handleCardClick = async () => {
    const formattedName = name.trim().replace(/\s+/g, " ").toLowerCase();
    const profileIdMatch = profileLink.match(/profile\/(\d+)$/);
    const profileId = profileIdMatch ? profileIdMatch[1] : "";
    const searchParams = new URLSearchParams({
      name: formattedName,
      profileId: profileId,
    });

    toast.success(
      "Item has been successfully clicked! Redirecting to the details page."
    );

    router.push(`/summary?${searchParams.toString()}`);
  };

  return (
    <div
      className={`p-6 border rounded-lg shadow-sm transition-transform hover:shadow-lg dark:bg-zinc-800 cursor-pointer ${
        isHovered ? "z-10 transform scale-105" : ""
      }`}
      style={{
        transform: "scale(1)",
        transition: "transform 1s ease-in-out",
        position: "relative",
        zIndex: isHovered ? 10 : 1,
        width: "380px",
        maxWidth: "100%",
        wordWrap: "break-word",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}>
      {/* Main Content */}
      {reason && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-blue-600 dark:text-white hover:text-blue-800 dark:hover:text-neutral-500">
            {formatName(name)}
          </h2>

          <div className="text-sm text-gray-500">
            <p className="flex items-start space-x-1">
              <span className="font-medium whitespace-nowrap">ACM DL:</span>
              <a
                href={profileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-600 break-words"
                style={{ wordBreak: "break-word", whiteSpace: "normal" }}
                onClick={(e) => e.stopPropagation()}>
                {profileLink}
              </a>
            </p>
            <div
              className="mt-4 text-gray-600 dark:text-neutral-400 text-sm italic"
              style={{
                overflow: "hidden",
                maxHeight: "4.5em",
                whiteSpace: "normal",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 4,
              }}>
              {truncateWithEllipsis(reason, 25)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCard;
