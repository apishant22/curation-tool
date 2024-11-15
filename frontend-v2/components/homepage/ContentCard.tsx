"use client";

import { useRouter } from "next/navigation";
import React from "react";
import Button from "../global/Button";

interface ContentCardProps {
  name: string;
  summary?: string;
  orcid: number;
}

const ContentCard: React.FC<ContentCardProps> = ({ name, summary, orcid }) => {
  const summaryShorten = (text: string | undefined, maxLength = 200) => {
    if (typeof text !== "string") return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };
  const router = useRouter();
  return (
    <div className="w-[500px] rounded-md p-4 bg-slate-50 shadow-gray-400 shadow-md">
      <div className="p-1 font-archivo text-blue-800">{name}</div>
      <div className="p-1 h-20 overflow-hidden text-gray-700/75">
        {summaryShorten(summary)}
      </div>
      <div className="flex justify-end pt-4">
        <Button
          label="Know more about the scholar"
          onClick={() => router.push(`/summary/${name}/${orcid}`)}></Button>
      </div>
    </div>
  );
};

export default ContentCard;
