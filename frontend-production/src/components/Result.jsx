import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import Header from "./Header";
import SearchBar from "./SearchBar";
import logoMain from "../assets/logo-main.png";
import ResultCard from "./ResultCard";
import Footer from "./Footer";
import Button from "./Button";
import Pagination from "./Pagination";

const Result = () => {
  const { user } = useParams();
  const API_URL = "/search";
  const [counter, setCounter] = useState(1);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});  // Add cache state
  const encodedQuery = encodeURIComponent(user);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      const cacheKey = `${encodedQuery}-${counter - 1}`;

      if (cache[cacheKey]) {
        setPosts(cache[cacheKey]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/${encodedQuery}/${counter - 1}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);

        setPosts(data);
        setCache((prevCache) => ({ ...prevCache, [cacheKey]: data }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, counter, cache, encodedQuery]);

  return (
    <div className="flex flex-col h-screen overflow-y-auto">
      <Header />
      <div className="flex flex-col items-center justify-center flex-grow mt-6">
        <div className="w-[780px] h-[1024px] lg:w-[1024px] flex flex-col gap-10">
          <div className="flex justify-between">
            <div className="w-28">
              <img
                src={logoMain}
                alt="acm-logo"
                className="h-full w-full object-contain"
              ></img>
            </div>
            <div className="flex items-center ">
              <SearchBar counter={counter} setCounter={setCounter} />
            </div>
          </div>
          <div className="bg-gray-50 shadow-md rounded-sm">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-sm text-center font-bold text-xl py-3 border-b border-gray-200 text-white">
              Results
            </div>
            <div className="flex justify-end ">
              {/* this is the pagination functionality, need to figure on how to dthat */}
              {/* <Pagination length={posts.length} postsPerPage={postsPerPage} handlePagination={handlePagination} currentPage={currentPage}/> */}
            </div>
            <div
              className={`p-4 flex flex-col gap-3 overflow-auto h-[36rem] ${
                loading ? "justify-center items-center" : ""
              }`}
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
              {/* we will call map function here, which corresponds to the result, for now, it is hardcoded, i can test but will do that later */}
              {!loading &&
                posts &&
                posts.authors &&
                posts.authors.map((res) => {
                  return (
                    <ResultCard
                      key={res["Profile Link"]}
                      name={res.Name}
                      employment={res.Location}
                      profileLink={res["Profile Link"]}
                    />
                  );
                })}
            </div>
            <Pagination counter={counter} setCounter={setCounter} user={user} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Result;
