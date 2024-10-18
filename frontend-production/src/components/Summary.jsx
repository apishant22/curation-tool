import React from 'react'
import { useLocation } from 'react-router-dom'

const Summary = () => {
  const location = useLocation();
  const { user} = location.state || {};

  if (!user) {
    return <div>No user available</div>
  }

  return (
    <div>
      <h1>Author Summary</h1>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>ORCID ID: {user.address.zipcode}</p>
    </div>    
  )
}

export default Summary
