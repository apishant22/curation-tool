import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Button = ({text, onClick, next, previous, counter, setCounter, user}) => {
  const navigate = useNavigate();

  const handleNextClick = () => {
    setCounter(prevCounter => {     
      const newCounter = prevCounter + 1;
      navigate(`/result/${user}/${newCounter}`);
      return newCounter;
    });

  }

  const handlePrevClick = () => {
    setCounter(prevCounter => {
      if (counter <= 1) {
        navigate(`/result/${user}/0`)
        return 0;
      }
      const newCounter = prevCounter - 1;
      navigate(`/result/${user}/${newCounter}`)
      return newCounter;

    });

  }

  const handleClick = () => {
    if (next) {
      handleNextClick();
    }
    else if (previous) {
      handlePrevClick();
    }
    else {
      onClick();
    }
  }

  // Need to handle Accept actions, Regenerate actions and Back actions..
  // Bet this one will take one whole day to do, or maybe half-day
  return (
    <div>
      <button onClick={handleClick} className='text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2 dark:bg-blue-600 dark:hover:bg-blue-700'>{text}</button>
    </div>
  )
}

export default Button
