import React from 'react'
import ContentCard from './ContentCard';


const Content = () => {

  const name = 'Adriana Wilde';
  const summary = 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Accusantium dignissimos officiis ut animi explicabo eos dolores aliquam sit accusamus laboriosam mollitia, velit voluptatum, beatae consequuntur voluptates quia ullam. Voluptas, dignissimos?'
  return (
    <div className='flex flex-col gap-16 items-center justify-center py-16'>
      <ContentCard name={name} summary={summary}></ContentCard>
      <ContentCard name={name} summary={summary}></ContentCard>
      <ContentCard name={name} summary={summary}></ContentCard>
    </div>
  )
}

export default Content
