import React from 'react'
import { useNavigate } from 'react-router-dom'

const ResultCard = ({name, employment}) => {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/summary', {state: {
      result: name
    }})
  }
  return (
    <div>
      <button className='bg-blue-200/75 p-6 rounded-xl hover:cursor-pointer w-full' onClick={handleClick}>
      {/* fetch result and populate inside the card */}
      <div className='text-left'>
      <h1>{name}</h1>
      {
        employment && (
         <p>{employment}</p>
        )
      }
      </div>

      </button>
    </div>

  )
}

export default ResultCard
