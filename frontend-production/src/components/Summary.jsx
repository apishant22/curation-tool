import React from 'react'
import { useLocation } from 'react-router-dom'
import Event from './Event';
import Button from './Button';
import Footer from './Footer';

const Summary = () => {

  // fetch paper of that author here
  const time = 2009;
  const events = 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Reiciendis iusto quas rem quam? Sit cumque consectetur vel doloribus ab iure quia, rem perspiciatis debitis beatae, maiores impedit? Accusantium, blanditiis expedita.';
  const location = useLocation();
  const {searchQuery} = location.state || {};
  console.log(searchQuery);

  if (!searchQuery) {
    return <div>No user available</div>
  }


  return (
    <div className='flex flex-col justify-between h-screen overflow-auto'>
      <div className='flex flex-grow'>
      <div className='w-[60%] flex flex-col'>
        {/* should fetch the name and summary from API here */}
        <h1 className='name text-center p-4'>Adriana Wilde</h1>
        <p className='summary p-4'>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Culpa assumenda earum ut, voluptatibus omnis sit similique pariatur cum a corporis doloribus, voluptates praesentium ea. Quos harum possimus minima laborum fuga.</p>
        <div className='bg-gray-400 p-4 flex-1'>
          <div className='bg-gray-600'>Summary of works</div>
          <div className='bg-gray-600'>Paper</div>
          <div className='bg-gray-600'>Paper</div>
        </div>
        <div className='flex justify-evenly mt-5'>
          <Button text={'Accept'}/>
          <Button text={'Regenerate'}/>
          <Button text={'Back'}/>
        </div>
      </div>
      <div className='flex-1'> 
        <h1 className='text-center'>
          Timeline
        </h1>
        {/* should do some mapping here */}
        <Event time={time} events={events}/>
        <Event time={time} events={events}/>
        <Event time={time} events={events}/>
        <Event time={time} events={events}/>
      </div>
      </div>
      <Footer/>  
    </div>

  )
}

export default Summary
