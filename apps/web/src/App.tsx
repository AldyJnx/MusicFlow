import { BrowserRouter } from 'react-router-dom'
import ClientRoutes from './client/routes/clientRoutes'

function App() {
  return (
    <BrowserRouter>
      <ClientRoutes />
    </BrowserRouter>
  )
}

export default App
