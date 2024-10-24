import React from "react";
import { Accordion } from "flowbite-react";

const DetailsCard = ({
  eduTitle,
  eduContent,
  bioTitle,
  bioContent,
  empTitle,
  empContent,
}) => {
  return (
    <Accordion >
      <Accordion.Panel>
        <Accordion.Title className="p-3">{bioTitle}</Accordion.Title>
        <Accordion.Content>{bioContent}</Accordion.Content>
      </Accordion.Panel>
      <Accordion.Panel>
        <Accordion.Title className="p-3">{eduTitle}</Accordion.Title>
        <Accordion.Content>{eduContent}</Accordion.Content>
      </Accordion.Panel>
      <Accordion.Panel>
        <Accordion.Title className="p-3">{empTitle}</Accordion.Title>
        <Accordion.Content>{empContent}</Accordion.Content>
      </Accordion.Panel>
    </Accordion>
  );
};

export default DetailsCard;
