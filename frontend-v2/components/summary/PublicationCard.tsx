import { Timeline } from "flowbite-react";
import React from "react";

// Interface for each co-author
interface CoAuthor {
  Name: string;
  "Orcid ID": string;
}

// Interface for each publication item
interface Publication {
  Abstract: string;
  "Citation Count": number;
  "Co-Authors": CoAuthor[];
  DOI: string;
  "Publication Date": string;
  Title: string;
}

// Props interface for PublicationCard component
interface PublicationCardProps {
  publications: Publication[]; // Define as an array of Publication
}

const PublicationCard: React.FC<PublicationCardProps> = ({ publications }) => {
  return (
    <div className="flex flex-col gap-10 p-4 mt-6">
      <Timeline>
        {publications.map((pub, index) => (
          <Timeline.Item key={index}>
            <Timeline.Point />
            <Timeline.Content>
              {/* Publication Date */}
              <Timeline.Time>
                {pub["Publication Date"] || "No time available"}
              </Timeline.Time>

              {/* Publication Title with DOI Link */}
              <Timeline.Title className="text-sm hover:cursor-pointer hover:text-gray-400">
                <a
                  href={`https://dl.acm.org/doi/${pub.DOI}`}
                  target="_blank"
                  rel="noopener noreferrer">
                  {pub.Title || "Untitled Publication"}
                </a>
              </Timeline.Title>

              {/* DOI Link */}
              {pub.DOI && (
                <a
                  href={`https://dl.acm.org/doi/${pub.DOI}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-normal text-gray-500 hover:cursor-pointer hover:text-black">
                  DOI: {pub.DOI}
                </a>
              )}

              {/* Citation Count */}
              <p className="text-xs text-gray-500 mt-1">
                Citation Count: {pub["Citation Count"]}
              </p>

              {/* Co-Authors */}
              <p className="text-sm font-medium text-gray-700 mt-3">Authors:</p>
              <ul className="list-disc list-inside text-xs text-gray-600">
                {pub["Co-Authors"].map((coAuthor, idx) => (
                  <li key={idx}>
                    {coAuthor.Name} ({coAuthor["Orcid ID"]})
                  </li>
                ))}
              </ul>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

export default PublicationCard;
