import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchResults = ({ results }) => {

  const navigate = useNavigate();
 
  // Need to get the value of the user, send (POST) to the backend, backend will return data of that user along with its publications.
  // But since there's no API yet for that, I can use (GET) that will get data of a user, in this case I will use /posts.
  // I will create a /summary page where it shows the summary of an author
  // So the steps is
  // 1) Create a /summary page, which means <Summary/> component (DONE)
  // 2) On clicking the name, it will go to the /summary page, using the router functionality. (DONE)
  // 3) In there, it will pass the value of GET from jsonplaceholder from here, using Context.
  // 4) The <Summary/> will then use the value from Context and display it on the page.
  const handleClick = (user) => {
    console.log(user.name);
    navigate('/summary', {state: {user}});
    
  }

  return (
    <div className='flex items-center justify-center'>
      <div className={`${results && results.length > 0 ? 'flex' : 'hidden'} bg-white w-[300px] md:w-[400px] flex-col shadow-lg rounded-lg mt-2 px-3 py-2`}>
        {results.map((result, idx) => (
          <button className='cursor-pointer hover:bg-blue-50 border-b border-gray-300 text-left' key={idx} onClick={() => handleClick(result)}>

            <p>{result.name}</p>
              {
                result.address.zipcode && (
                  <p className='text-sm text-gray-500'>ORCID ID: {result.address.zipcode}</p>
                )
              }


          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;