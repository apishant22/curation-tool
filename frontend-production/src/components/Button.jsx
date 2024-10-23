import React from 'react'

const Button = ({text, onClick}) => {

  // Need to handle Accept actions, Regenerate actions and Back actions..
  // Bet this one will take one whole day to do, or maybe half-day
  return (
    <div>
      <button onClick={onClick} className='text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700'>{text}</button>
    </div>
  )
}

export default Button
