import React from 'react'
import { useLocation } from 'react-router-dom'
import Event from './Event';
import Button from './Button';
import Footer from './Footer';
import Header from './Header';

const Summary = () => {

  // fetch paper of that author here
  const time = 2009;
  const events = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis iusto quas rem quam? Sit cumque consectetur vel doloribus ab iure quia, rem perspiciatis debitis beatae, maiores impedit? Accusantium, blanditiis expedita.';
  const location = useLocation();
  const {searchQuery, name, result} = location.state || {};
  console.log("searchQuery: " + searchQuery);
  console.log("name: " + name)




  return (
    <div className='flex flex-col justify-between h-screen overflow-auto'>
      <Header/>
      <div className='text-center'>
          {/* Display name if available */}
          {name && (
            <h1 className="text-2xl font-bold mb-4">{name}</h1>
          )}
          
          {/* Display result if available */}
          {result && (
            <p className="text-gray-700 mb-6">{result}</p>
          )}
      </div>
      <Footer/>  
    </div>

  )
}

export default Summary
