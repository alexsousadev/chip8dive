import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import Chip8Home from './components/Chip8Home.tsx'
import Menu from './components/Menu.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Chip8Home />,
  },

  {
    path: '/menu',
    element: <Menu />,
  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
