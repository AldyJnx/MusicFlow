import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ChangePassword from './auth/pages/ChangePassword'
import ForgotPassword from './auth/pages/ForgotPassword'
import Login from './auth/pages/Login'
import Register from './auth/pages/Register'
import VerifyCode from './auth/pages/VerifyCode'
import ClientRoutes from './client/routes/clientRoutes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/*" element={<ClientRoutes />} />
      </Routes>
    </BrowserRouter>
  )
}
  
export default App
