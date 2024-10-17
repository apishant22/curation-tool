import React from 'react';

const SearchResults = ({ results }) => {
  return (
    <div className='flex items-center justify-center'>
      <div className={`${results && results.length > 0 ? 'flex' : 'hidden'} bg-white w-[300px] md:w-[400px] flex-col shadow-lg rounded-lg mt-2 px-3 py-2`}>
        {results.map((result, idx) => (
          <div key={idx}>
            <p className='cursor-pointer'>{result.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;