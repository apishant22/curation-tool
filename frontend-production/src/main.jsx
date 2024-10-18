import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { createBrowserRouter, Router, RouterProvider } from 'react-router-dom'
import Summary from './components/Summary.jsx'


const router = createBrowserRouter([
  {
    path: "/",
    element: <App/>
  },
  {
    path: "/summary",
    element: <Summary/>
  },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
