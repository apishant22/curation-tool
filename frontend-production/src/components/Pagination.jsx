import React from 'react'

const Pagination = ({postsPerPage, length, handlePagination, currentPage}) => {
  const paginationNumbers = [];

  for (let i = 1; i <= Math.ceil(length / postsPerPage); i++) {
    paginationNumbers.push(i);
  }
  return (
    <div>
      {paginationNumbers.map((pageNumber) => (
        <button key={pageNumber} className={currentPage === pageNumber ? 'active' : ''}>{pageNumber}</button>
      ))}
    </div>
  )
}

export default Pagination
