import React from 'react'
import ContentCard from './ContentCard';
import heroBackground from '../assets/hero-background.jpg'


const Content = () => {

  // const background = {
  //   backgroundImage: `url(${heroBackground})`,
  //   backgroundSize: 'cover',
  //   backgroundPosition: 'center',
  //   backgroundRepeat: 'no-repeat'
  // }

  const response = [
    {
      "id": 1,
      "name": "Adriana Wilde",
      "summary": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis, enim doloremque! Nisi aspernatur quia minima magni illum quidem amet maxime repellat in, vitae, ad nesciunt adipisci dolores, temporibus quod consequuntur!",
    },
    {
      "id": 2,
      "name": "John Doe",
      "summary": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis, enim doloremque! Nisi aspernatur quia minima magni illum quidem amet maxime repellat in, vitae, ad nesciunt adipisci dolores, temporibus quod consequuntur!",
    },
    {
      "id": 3,
      "name": "Jane Doe",
      "summary": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Corporis, enim doloremque! Nisi aspernatur quia minima magni illum quidem amet maxime repellat in, vitae, ad nesciunt adipisci dolores, temporibus quod consequuntur!",
    }
  ]

  return (
    <div className='flex flex-grow flex-col gap-16 items-center justify-center'>
      {/* <ContentCard name={name} summary={summary}></ContentCard>
      <ContentCard name={name} summary={summary}></ContentCard>
      <ContentCard name={name} summary={summary}></ContentCard> */}
      {response && response.map((res) => {
        return <ContentCard key={res.id} name={res.name} summary={res.summary}></ContentCard>
      })}
    </div>
  )
}

export default Content
