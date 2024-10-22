import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header';
import SearchBar from './SearchBar';
import logoMain from '../assets/logo-main.png'
import ResultCard from './ResultCard';
import Footer from './Footer';
import Button from './Button';



const Result = () => {
  const location = useLocation();
  const {searchQuery} = location.state || {};
  if (!searchQuery) {
    return <div>No user available</div>
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
              <div>page 1 of n sort by</div>
            </div>
            <div className='mt-6 p-4 flex flex-col gap-12'>
              {/* we will call map function here, which corresponds to the result, for now, it is hardcoded, i can test but will do that later */}
              <ResultCard/>
              <ResultCard/>
              <ResultCard/>
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
