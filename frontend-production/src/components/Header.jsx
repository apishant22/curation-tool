import React from 'react'
import acmLogo from "../assets/acm-logo.png"
import { useNavigate } from 'react-router-dom'




const Header = () => {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/');
  }

  return (
    <button onClick={handleClick} className='bg-acm-blue w-full shadow-md flex justify-between p-4'>
      {/* <div className='w-28 flex justify-center'><img src={acmLogo} className='h-full w-auto'/></div> */}
      Logo here
    </button>
  )
}

export default Header
