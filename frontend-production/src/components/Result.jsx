import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header';
import SearchBar from './SearchBar';
import logoMain from '../assets/logo-main.png'
import ResultCard from './ResultCard';
import Footer from './Footer';
import Button from './Button';
import Pagination from './Pagination';

const response = [
  {
    "id": 1,
    "name": "Adriana Max",
    "employment": "University of Oxford"
  },
  {
    "id": 2,
    "name": "Adriana Wilde",
    "employment": "University of Southampton"
  },
  {
    "id": 3,
    "name": "Adriana Booth",
  }
]




const Result = () => {
  const location = useLocation();
  const {searchQuery} = location.state || {};
  if (!searchQuery) {
    return <div>No user available</div>
  }
  console.log(searchQuery); // pass to the API, and retrieve the name

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(5);

  useEffect(() => {
    const fetchPosts = () => {
      setPosts(response);
      setLoading(false);
    }
    fetchPosts();
  }, [])

  const handlePagination = (pageNumber) => {
    setCurrentPage(pageNumber);
  }
  
  return (
    <div className='flex flex-col h-screen overflow-y-auto'>
      <Header/>
      <div className='flex flex-col items-center justify-center flex-grow mt-6'>
        <div className='w-[780px] h-[1024px] lg:w-[1024px] flex flex-col gap-10'>
          <div className='flex justify-between'>
            <div className='w-28'>
              <img src={logoMain} alt='acm-logo' className='h-full w-full object-contain'></img>
            </div>
            <div className='flex items-center '>
              <SearchBar/>
            </div>
          </div>
          <div className='bg-acm-light-gray'>
            <div className='flex justify-end '>
              {/* this is the pagination functionality, need to figure on how to dthat */}
              <Pagination length={posts.length} postsPerPage={postsPerPage} handlePagination={handlePagination} currentPage={currentPage}/>
            </div>
            <div className='mt-6 p-4 flex flex-col gap-12'>
              {/* we will call map function here, which corresponds to the result, for now, it is hardcoded, i can test but will do that later */}
              {
                response && response.map((res) => {
                  return <ResultCard name={res.name} employment={res.employment} data={res}/>
                })
              }
            </div>
            <div className='flex justify-end gap-6 p-4'>
              <Button text={'next'}/>
              <Button text={'previous'}/>
            </div>

          </div>
        </div>
      </div>
      <Footer/>

    </div>

  )
}

export default Result
