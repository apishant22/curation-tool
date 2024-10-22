import React from 'react'
import acmLogo from '../assets/logo-main.png'
import SearchBar from './SearchBar'
import UnderSearchText from '../assets/undertext-search.png'

const HeaderContent = () => {
  return (
    <div className='flex flex-col justify-center items-center p-12 bg-gray-100/75 shadow-md'>
      <div className="flex flex-col items-center justify-center"><img src={acmLogo} alt='acm-logo' className='w-32 md:w-52'></img></div>
      <div className="pt-3"><SearchBar/></div>
      <div className=""><img src={UnderSearchText} alt='search under text' className='min-w-96 w-96 mt-3'></img></div>
    </div>
  )
}

export default HeaderContent
