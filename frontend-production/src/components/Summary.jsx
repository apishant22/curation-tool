import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Event from "./Event";
import Buttons from "./Button";
import Footer from "./Footer";
import Header from "./Header";
import PublicationCard from "./PublicationCard";
import { Button, Timeline } from "flowbite-react";
import { HiArrowNarrowRight } from "react-icons/hi";
import DetailsCard from "./DetailsCard";
import heroIcon from "../assets/hero-background.jpg";
import ProgressBar from "./ProgressBar";
import LoadingPanel from "./LoadingPanel";
import AuthorHeader from "./AuthorHeader";
import ErrorPage from "./ErrorPage";
import ReactMarkdown from "react-markdown";

const MarkdownContent = ({ content }) => {
  const components = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-4 text-gray-800">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-700">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-600">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline"
      >
        {children}
      </a>
    ),
  };

  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
};

const Summary = () => {
  // fetch paper of that author here
  // const location = useLocation();
  const { name, result } = location.state || {};
  const navigate = useNavigate();
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

  const handleClick = () => {
    navigate(`/result/${user}/1`, {
      state: { fromErrorPage: true },
    });
  };

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
        className={`flex w-full justify-center min-h-screen`}
        // style={{
        //   backgroundImage: `url(${heroIcon})`,
        //   backgroundSize: "cover",
        //   backgroundPosition: "center",
        //   backgroundRepeat: "repeat",
        // }}
      >
        <ErrorPage loading={loading} post={post} handleClick={handleClick} />

        {!loading && post.author_details && (
          <div className="flex flex-grow max-w-[1024px] bg-white shadow-2xl">
            {/* Combined flex-grow with flex */}
            <div className="w-[70%] flex flex-col">
              <div className="p-4">
                <AuthorHeader name={post.author_details.Name} />

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
                  {/* Added bg color to see the expansion */}
                  <div className="w-full">
                    <div className="mt-4 flex justify-center">
                      <span className="text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-medium">
                        AI-Generated Summary
                      </span>
                    </div>
                    {!post.summary && (
                      <div className="text-center">No summary</div>
                    )}
                    <MarkdownContent content={post.summary} />
                  </div>
                </div>
              </div>
              <div className="flex gap-4 justify-center p-2 mb-6">
                <Buttons text={"Accept"} />
                <Buttons text={"Regenerate"} />
                <Buttons text={"Back"} />
              </div>
            </div>
            <div className="flex-grow">
              <div className="flex p-3 flex-col gap-4 mt-6 max-w-[300px] max-h-screen overflow-auto">
                <PublicationCard
                  publications={post.author_details.Publications}
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
