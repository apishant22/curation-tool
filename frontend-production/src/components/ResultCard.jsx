import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Briefcase } from "lucide-react";

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
    <div className="w-full">
      <button
        onClick={handleClick}
        className="w-full bg-white hover:bg-gray-50 rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200 group flex items-center justify-between gap-4"
      >
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900 text-lg mb-1">
            {name}
          </h3>
          {employment && (
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-4 h-4" />
              <p className="text-sm">{employment}</p>
            </div>
          )}
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
      </button>
    </div>
  );
};

export default ResultCard;
