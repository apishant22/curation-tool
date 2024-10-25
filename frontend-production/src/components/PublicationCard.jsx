import React from "react";
import { Timeline } from "flowbite-react";

const PublicationCard = ({ publications }) => {
  if (!publications || publications.length === 0) {
    return <p className="text-gray-500">No publications available.</p>;
  }

  return (
    <div className="flex flex-col gap-4 p-3 mt-6">
      <Timeline>
        {publications.map((pub, index) => (
          <Timeline.Item key={index}>
            <Timeline.Point />
            <Timeline.Content>
              <Timeline.Time>{pub["Publication Date"]}</Timeline.Time>
              <Timeline.Title className="text-sm hover:cursor-pointer hover:text-gray-400">
                {pub.Title}
              </Timeline.Title>
              <p className="text-xs font-normal text-gray-500">DOI: {pub.DOI}</p>
            </Timeline.Content>
          </Timeline.Item>
        ))}
      </Timeline>
    </div>
  );
};

export default PublicationCard;