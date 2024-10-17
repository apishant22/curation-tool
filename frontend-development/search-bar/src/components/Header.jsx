import React from 'react'
import acmLogo from "../assets/acm-logo.png"



const Header = () => {
  return (
    <div className='fixed bg-white top-0 left-0 w-full h-16 border shadow-md flex justify-between py-1'>
      <div className='w-28 flex justify-center'><img src={acmLogo} className='h-full w-auto'/></div>
      <div></div>
    </div>
  )
}

export default Header
