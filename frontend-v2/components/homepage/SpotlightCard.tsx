import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface SpotlightCardProps {
  name: string;
  profileLink: string;
  summary?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  name,
  profileLink,
  summary,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const formatName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const extractMainBody = (summary) => {
    if (!summary) {
      return "Summary not available.";
    }

    const biographyMatch = summary.match(/## Biography\s+([\s\S]*?)(\n##|\n?$)/);

    if (biographyMatch) {
      return biographyMatch[1].trim();
    }

    return "Biography not available.";
  };

  const truncateWithEllipsis = (text: string, maxWords: number): string => {
    if (!text) return "Summary not available.";
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
      "Item has been successfully clicked! Redirecting to the summary page."
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
        transition: "transform 2s ease-in-out",
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
              className="hover:text-blue-600"
              style={{ wordBreak: "break-word", whiteSpace: "normal" }}
              onClick={(e) => e.stopPropagation()}>
              {profileLink}
            </a>
          </p>
          <div
            className="mt-4 text-gray-600 dark:text-neutral-400 text-sm"
            style={{
              overflow: "hidden",
              maxHeight: "4.5em",
              whiteSpace: "normal",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 4,
            }}>
            <p>
              <strong>Summary:</strong>{" "}
              {truncateWithEllipsis(extractMainBody(summary), 25)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotlightCard;
