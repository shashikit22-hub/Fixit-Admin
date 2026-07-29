import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ServiceRequests from './pages/ServiceRequests'
import RequestDetail from './pages/RequestDetail'
import Technicians from './pages/Technicians'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/requests" element={<ServiceRequests />} />
          <Route path="/requests/:id" element={<RequestDetail />} />
          <Route path="/technicians" element={<Technicians />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
