import React from 'react'

const Event = ({time, events}) => {
  return (
  <div className='flex justify-between'>
    <div className='p-2'>{time}</div>
    <div className='flex-1 flex items-center justify-center p-4'>{events}</div>
  </div>
  )
}

export default Event
