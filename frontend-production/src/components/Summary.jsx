import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Event from "./Event";
import Buttons from "./Button";
import Footer from "./Footer";
import Header from "./Header";
import PublicationCard from "./PublicationCard";
import { Button, Timeline } from "flowbite-react";
import { HiArrowNarrowRight } from "react-icons/hi";
import DetailsCard from "./DetailsCard";
import heroIcon from "../assets/hero-background.jpg";

const Summary = () => {
  // fetch paper of that author here
  // const location = useLocation();
  // const {name, result} = location.state || {};
  // console.log("searchQuery: " + searchQuery);
  // console.log("name: " + name);
  // console.log("profileNumber: " + profileNumber);
  const { user, profileLink } = useParams();
  // console.log("nameLower: " + user);
  // console.log("profileLink " + profileLink);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [post, setPost] = useState("");

  const API_URL = "http://127.0.0.1:3003/query";

  useEffect(() => {
    const fetchAuthor = async () => {
      setLoading(true);
      setError(null);

      try {
        const encodedQuery = encodeURIComponent(user);
        const response = await fetch(
          `${API_URL}/${encodedQuery}/${profileLink}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data);
        setPost(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user && profileLink) {
      fetchAuthor();
    }
  }, [user, profileLink]);

  const lorem =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias dicta, cupiditate omnis animi quasi laboriosam officia dignissimos consequuntur error, dolorem, sapiente quia. Minus tempora numquam veniam sunt necessitatibus! Fugit, voluptas!";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* Main content */}
      <div
        className="flex w-full justify-center"
        style={{
          backgroundImage: `url(${heroIcon})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "repeat",
        }}
      >
        <div className="flex flex-grow max-w-[1024px] bg-white shadow-2xl">
          {" "}
          {/* Combined flex-grow with flex */}
          <div className="w-[70%] flex flex-col">
            <div className="p-4">
              <div className="p-4 text-center font-bold text-2xl font-archivo border-y-2 border-gray-200 mx-auto max-w-md mb-6 tracking-wide">
                Adriana Wilde
              </div>
              <DetailsCard
                bioTitle={"Biography"}
                bioContent={lorem}
                eduTitle={"Education"}
                eduContent={lorem}
                empTitle={"Employment"}
                empContent={lorem}
              />
            </div>
            <div className="p-6 ">
              <div className="flex-grow flex items-stretch bg-gray-100 rounded-lg">
                {" "}
                {/* Added bg color to see the expansion */}
                <div className="w-full">
                  <div className="mt-4 flex justify-center">
                    <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                      AI-Generated Summary
                    </span>
                  </div>

                  <p className="p-4">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem
                    fuga reprehenderit doloribus natus rerum minus odio, commodi
                    autem sunt maxime harum quibusdam, ullam excepturi iure
                    aliquid laboriosam enim eius iusto. Lorem ipsum dolor sit
                    amet consectetur adipisicing elit. Distinctio libero harum,
                    unde qui perspiciatis minus suscipit obcaecati consequuntur
                    commodi, fuga voluptatum dignissimos vero vitae? Ducimus
                    amet nesciunt nisi magnam cumque.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-4 justify-center p-4">
              <Buttons text={"Accept"} />
              <Buttons text={"Regenerate"} />
              <Buttons text={"Back"} />
            </div>
          </div>
          <div className="flex-grow">
            <div className="flex p-3 flex-col gap-4 mt-6">
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
              <PublicationCard
                title={"Content Co-creation for Novice Programmers"}
                doi={"10.1145/3610969.3611135"}
                date={"2023-09-07"}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Summary;
