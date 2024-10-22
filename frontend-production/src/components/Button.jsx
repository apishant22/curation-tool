import React from 'react'

const Button = ({text}) => {

  // Need to handle Accept actions, Regenerate actions and Back actions..
  // Bet this one will take one whole day to do, or maybe half-day
  return (
    <div>
      <button className='text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800'>{text}</button>
    </div>
  )
}

export default Button
