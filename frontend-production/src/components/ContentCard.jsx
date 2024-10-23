import React from 'react'
import Button from './Button'


const ContentCard = ({name, summary}) => {

  const summaryShorten = (text , maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  return (
    <div>
      {/* Will use an API, that will select the top 3 person in the database */}
      <div className="w-[600px] p-4 bg-blue-50/75 shadow-gray-400 shadow-md">
        <div className='p-1 font-archivo text-blue-800'>
          {name}
        </div>
        <div className='p-1 h-20 overflow-hidden text-gray-700/75'>
          {summaryShorten(summary)}
        </div>
        <div className='flex justify-end p-1'>
          <Button text='Know more about her'></Button>
        </div>
      </div>
    </div>
  )
}

export default ContentCard
