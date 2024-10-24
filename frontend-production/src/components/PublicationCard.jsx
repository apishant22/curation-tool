import React from "react";
import { Timeline } from "flowbite-react";

const PublicationCard = ({ title, doi, date }) => {
  return (
    // <div className='p-3 bg-blue-50 rounded-xl'>
    //   <p>{title}</p>
    //   <p>DOI: {doi}</p>
    //   <p>Publication Date: {date}</p>
    // </div>
    <Timeline>
      <Timeline.Item>
        <Timeline.Point />
        <Timeline.Content>
          <Timeline.Time>{date}</Timeline.Time>
          <Timeline.Title className="text-sm hover:cursor-pointer hover:text-gray-400">
            {title}
          </Timeline.Title>
          <p className="text-xs font-normal text-gray-500">DOI: {doi}</p>
        </Timeline.Content>
      </Timeline.Item>
    </Timeline>
  );
};

export default PublicationCard;
