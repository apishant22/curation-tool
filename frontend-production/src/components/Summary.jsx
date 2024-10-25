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
  const { name, result } = location.state || {};
  // console.log("searchQuery: " + searchQuery);
  // console.log("name: " + name);
  // console.log("profileNumber: " + profileNumber);
  const { user, profileLink } = useParams();
  // console.log("nameLower: " + user);
  // console.log("profileLink " + profileLink);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [post, setPost] = useState("");

  const API_URL = "/query";

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
        {loading && (
          <div role="status">
            <svg
              aria-hidden="true"
              class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span class="sr-only">Loading...</span>
          </div>
        )}

        {!loading && post.author_details && post.summary && (
          <div className="flex flex-grow max-w-[1024px] bg-white shadow-2xl">
            {/* Combined flex-grow with flex */}
            <div className="w-[70%] flex flex-col">
              <div className="p-4">
                {post.author_details && (
                  <div className="p-4 text-center font-bold text-2xl font-archivo border-y-2 border-gray-200 mx-auto max-w-md mb-6 tracking-wide">
                    {post.author_details.Name}
                  </div>
                )}
                <DetailsCard
                  bioTitle="Biography"
                  bioContent={post.author_details?.Biography || []} // Ensure it's an array
                  eduTitle="Education History"
                  eduContent={post.author_details?.["Education History"] || []} // Ensure it's an array
                  empTitle="Employment History"
                  empContent={post.author_details?.["Employment History"] || []} // Ensure it's an array
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

                    <p className="p-4">{post.summary}</p>
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
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Summary;
