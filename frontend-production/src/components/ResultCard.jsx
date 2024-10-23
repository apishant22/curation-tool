import React from 'react'
import { useNavigate } from 'react-router-dom'

const ResultCard = () => {

  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/summary');
  }
  return (
    <div>
      <button className='bg-blue-200/75 p-6 rounded-xl hover:cursor-pointer w-full' onClick={handleClick}>
      {/* fetch result and populate inside the card */}
      <div className='text-left'>
      <h1>Name here</h1>
      <p>Orcid ID here</p>
      <p>Employment here</p>
      </div>

      </button>
    </div>

  )
}

export default ResultCard
