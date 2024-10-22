import React from 'react'
import acmLogo from '../assets/acm-logo.png'

const Footer = () => {
  return (
    <div className='flex justify-between'>
      <div className='flex-grow text-center'>Credits</div>
      <div className='w-28 flex justify-center'>
        <img className='h-full w-auto' src={acmLogo} alt='acm-logo'></img>
      </div>

      
    </div>
  )
}

export default Footer
