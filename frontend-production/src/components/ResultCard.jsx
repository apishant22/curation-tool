import React from "react";
import { useNavigate } from "react-router-dom";

const ResultCard = ({ name, employment, profileLink }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const number = profileLink.split("/").pop();
    const nameLower = name.toLowerCase().trim().replace(/\s+/g, " ");
    navigate(`/summary/${nameLower}/${number}`, {
      state: {
        result: name,
        profileNumber: number,
      },
    });
  };
  // console.log("Profile Link:" + profileLink);
  return (
    <div>
      <button
        className="bg-blue-200/75 p-3 rounded-xl hover:cursor-pointer w-full"
        onClick={handleClick}
      >
        {/* fetch result and populate inside the card */}
        <div className="text-left">
          <h1>{name}</h1>
          {employment && <p>{employment}</p>}
        </div>
        <div>
          <p></p>
        </div>
      </button>
    </div>
  );
};

export default ResultCard;
