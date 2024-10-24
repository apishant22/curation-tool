import React from 'react'
import acmLogo from '../assets/acm-logo.png'
import instaIcon from '../assets/icon_instagram.png'

const Footer = ({marginTop}) => {
  return (
    <div className='w-full'>
      <div className={`flex justify-between ${marginTop}  bg-acm-gray`}>
        <div className='w-20 h-20 flex items-center justify-center flex-shrink-0 ml-4'>
          <img className='object-contain max-h-full max-w-full' src={acmLogo} alt='acm-logo'></img>
        </div>
        <div className='flex mr-12 gap-6 items-center'>
          <div className='w-8 h-8 flex-shrink-0'><img src={instaIcon} alt='insta-icon' className='h-full w-full object-contain'></img></div>
          <div className='w-8 h-8 flex-shrink-0'><img src={instaIcon} alt='insta-icon' className='h-full w-full object-contain'></img></div>
          <div className='w-8 h-8 flex-shrink-0'><img src={instaIcon} alt='insta-icon' className='h-full w-full object-contain'></img></div>
        </div>
      </div>
    </div>

  )
}

export default Footer
