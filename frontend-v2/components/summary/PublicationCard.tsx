"use client";
import React, { useState } from "react";
import { Timeline } from "flowbite-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useNetworkModal from "@/app/hooks/useNetworkModal";

interface CoAuthor {
  Name: string;
  "Orcid ID": string;
}

interface Publication {
  Abstract: string;
  "Citation Count": number;
  "Co-Authors": CoAuthor[];
  DOI: string;
  "Publication Date": string;
  Title: string;
}

interface PublicationCardProps {
  publications: Publication[];
}

const PublicationCard: React.FC<PublicationCardProps> = ({ publications }) => {
  const [sortBy, setSortBy] = useState<"date" | "citations">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedPublications = [...publications].sort((a, b) => {
    if (sortBy === "date") {
      // Handle cases where dates are unknown or invalid
      const dateA =
        a["Publication Date"] && a["Publication Date"] !== "Unknown"
          ? new Date(a["Publication Date"]).getTime()
          : sortOrder === "desc"
          ? -Infinity
          : Infinity;

      const dateB =
        b["Publication Date"] && b["Publication Date"] !== "Unknown"
          ? new Date(b["Publication Date"]).getTime()
          : sortOrder === "desc"
          ? -Infinity
          : Infinity;

      // If both dates are valid, compare them
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }

      // If one date is invalid, push it to the end
      if (isNaN(dateA)) return sortOrder === "desc" ? -1 : 1;
      if (isNaN(dateB)) return sortOrder === "desc" ? 1 : -1;

      return 0;
    } else {
      // Citation count sorting remains the same
      return sortOrder === "desc"
        ? b["Citation Count"] - a["Citation Count"]
        : a["Citation Count"] - b["Citation Count"];
    }
  });

  const networkModal = useNetworkModal();

  return (
    <div className="flex flex-col">
      <div
        className="mx-auto flex items-center justify-center text-sm border-[1px] p-2 rounded-lg text-center max-w-[160px] cursor-pointer bg-green-500 transition duration-200 hover:scale-110"
        onClick={networkModal.onOpen}>
        <p className="text-white">Network of Authors</p>
      </div>
      <div className="flex justify-center gap-4 p-4">
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "date" | "citations")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Publication Date</SelectItem>
            <SelectItem value="citations">Citation Count</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sortOrder}
          onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Order..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4">
        <Timeline>
          {sortedPublications.map((pub, index) => (
            <Timeline.Item key={index}>
              <Timeline.Point />
              <Timeline.Content>
                <Timeline.Time>
                  {pub["Publication Date"] || "No time available"}
                </Timeline.Time>

                <Timeline.Title className="text-sm hover:cursor-pointer hover:text-gray-400">
                  <a
                    href={`https://dl.acm.org/doi/${pub.DOI}`}
                    target="_blank"
                    rel="noopener noreferrer">
                    {pub.Title || "Untitled Publication"}
                  </a>
                </Timeline.Title>

                {pub.DOI && (
                  <a
                    href={`https://dl.acm.org/doi/${pub.DOI}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-normal text-gray-500 hover:cursor-pointer hover:text-black">
                    DOI: {pub.DOI}
                  </a>
                )}

                <p className="text-sm font-semibold text-gray-700 w-fit">
                  Citations:{" "}
                  <span className="px-2 rounded-md bg-yellow-200 text-black">
                    {pub["Citation Count"]}
                  </span>
                </p>
                {pub["Co-Authors"].length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mt-3">
                      Co-Authors:
                    </p>
                    <ul className="list-disc list-inside text-xs text-gray-600">
                      {pub["Co-Authors"].map((coAuthor, idx) => (
                        <li key={idx}>{coAuthor.Name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </div>
  );
};

export default PublicationCard;
