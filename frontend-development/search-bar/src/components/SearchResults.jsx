import React from 'react';

const SearchResults = ({ results }) => {

  const handleClick = (user) => {
    console.log(user.name);
  }

  return (
    <div className='flex items-center justify-center'>
      <div className={`${results && results.length > 0 ? 'flex' : 'hidden'} bg-white w-[300px] md:w-[400px] flex-col shadow-lg rounded-lg mt-2 px-3 py-2`}>
        {results.map((result, idx) => (
          <button className='cursor-pointer hover:bg-blue-50 border-b border-gray-300 text-left' key={idx} onClick={() => handleClick(result)}>
            <p>{result.name}</p>
            <p className='text-sm'>ORCID ID: {result.address.zipcode}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;